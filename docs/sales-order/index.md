---
type: OKF Module
title: Sales Order
description: Pesanan penjualan ke customer (legacy Sales Quotation `sq`, dicetak "SALES ORDER") — header, varian produk per gudang, diskon global, biaya penjualan, approval, satu invoice per order. Tidak menggerakkan stok/jurnal, tetapi terkunci closing period.
tags: [sales-order, penjualan]
timestamp: 2026-11-18T12:00:00Z
---

# Sales Order

Pesanan dari customer. Consumed by `frontend/src/views/sales-order/` (list, detail, tambah, edit, cetak).
Sales Order tidak menggerakkan stok maupun jurnal, tetapi **tetap terkena closing period** seperti semua dokumen bertanggal
(`locked`, `ClosingBadge`; lihat [conventions](../conventions.md#closing-period-lock-locked)).
Satu Sales Order menjadi **paling banyak satu** [Invoice Penjualan](../sales-invoice/index.md), untuk seluruh dokumen
(legacy `trsq.RefSO`), lewat [get-sales-order-invoiceable-lines](./get-sales-order-invoiceable-lines.md).

Semua angka (`total` baris, `subtotal`, `discount_global`, `dpp`, `ppn`, `expense_total`, `total`) dihitung **server saat simpan
dan disimpan**; setelah itu nilai tersimpan yang berlaku (tidak dihitung ulang saat dibaca), supaya dokumen hasil migrasi legacy
dengan rumus lama tetap utuh. Client hanya mengirim input; UI menghitung preview dengan rumus yang sama.

Nama, alamat, dan telepon customer disimpan sebagai **snapshot** di header saat simpan; detail dan cetak membaca snapshot,
bukan master customer.

Tidak diport dari legacy: persetujuan harga di bawah harga minimum lewat kredensial (`apso1`), draft per-sesi (`tempo`), nomor global per cabang.

## Rumus

Per baris: `net_price = price − discount` (`discount` = rupiah **per satuan**), `total = round(net_price × quantity)`.

Header (FUSI-484, PPN dihitung sekali di level header):

```
subtotal        = Σ line.total
discount_global = discount_type = nominal → min(discount_value, subtotal)
                  discount_type = percent → round(subtotal × discount_value / 100)      (0–100)
dpp             = PKP ? max(subtotal − discount_global, 0) : 0
ppn             = PKP ? round(dpp × 11%) : 0
expense_total   = Σ expense.amount
total           = max(subtotal − discount_global, 0) + ppn + expense_total
```

Rumus ini dipakai saat simpan. Order hasil migrasi legacy membawa total aslinya (mis. order sebelum FUSI-484 memakai PPN per baris)
dan tidak dihitung ulang.

## Entity: `SalesOrder`

| Field | Type | Notes |
|---|---|---|
| `locked` | boolean | response-only; `date` ada di periode closing → tidak bisa edit, hapus, atau ubah persetujuan |
| `id` | number | auto-increment, server-assigned |
| `number` | string | `<kode perusahaan>.SO<yymmdd><nnn>`, mis. `RIN.SO260902001`; otomatis, read-only (format legacy `sq`) |
| `date` | string | required, `YYYY-MM-DD` |
| `top_days` | number | termin pembayaran, salah satu dari `0, 7, 14, 21, 30, 60, 90, 120` (0 = tunai). Legacy `trsq` tidak punya TOP; data migrasi = 0 |
| `due_date` | string | read-only, `date + top_days` |
| `customer_id` | number | required; customer master |
| `customer_code` | string \| undefined | resolved dari master |
| `customer_name` `customer_address` `customer_phone` | string | **snapshot** saat simpan (dipakai detail & cetak) |
| `sales_id` | number | required; Master Sales (salesperson) |
| `sales_code` `sales_name` | string \| undefined | resolved display fields |
| `department_id` | number | required |
| `department_code` `department_name` | string \| undefined | resolved display fields |
| `pkp_active` | boolean | required; UI default = `customer.pkp`, bisa diubah per order. `true` → PPN 11% |
| `description` | string | optional (boleh kosong) |
| `discount_type` | enum | `nominal` \| `percent` — jenis diskon global (legacy "Diskon Invoice") |
| `discount_value` | number | input diskon global: rupiah (`nominal`) atau persen 0–100 (`percent`); 0 = tanpa diskon |
| `approval_status` | enum | `pending`, `approved` (tidak ada `rejected`) |
| `invoice_status` | enum | computed: `invoiced` bila ada invoice yang merujuk order ini dan tidak `rejected`, selain itu `not_invoiced` |
| `sales_invoice_id` `sales_invoice_number` | number \| null, string \| null | invoice tersebut |
| `approved_by` `approved_at` | string \| null | metadata approval |
| `created_by` | string | nama pembuat |
| `created_at` | string | ISO 8601 datetime the record was created (list column "Dibuat"); server-assigned, read-only |
| `lines` | array of `SalesOrderLine` | minimal satu baris, varian tidak boleh dobel |
| `expenses` | array of `SalesOrderExpense` | Biaya Penjualan, boleh kosong |
| `subtotal` `discount_global` `dpp` `ppn` `expense_total` `total` | number | disimpan saat simpan (lihat Rumus) |

## Entity: `SalesOrderLine`

| Field | Type | Notes |
|---|---|---|
| `variant_id` | number | required; varian aktif ([Product variants](../product/index.md#variants-sku)). Unik per order — dua ukuran dari produk yang sama = dua baris |
| `product_id` `product_code` `product_name` `sku` `variant_label` `brand_name` `unit_name` | resolved | dari varian; `variant_label` = `Standar` untuk varian default |
| `warehouse_id` | number | required; gudang asal barang |
| `warehouse_code` `warehouse_name` | string \| undefined | resolved display fields |
| `quantity` | number | > 0 |
| `price` | number | > 0; default UI dari `selling_price` produk, bisa diubah |
| `discount` | number | ≥ 0, rupiah **per satuan**, tidak boleh melebihi `price` |
| `notes` | string | keterangan baris, boleh kosong |
| `total` | number | disimpan saat simpan: `round((price − discount) × quantity)` |

## Entity: `SalesOrderExpense` (Biaya Penjualan)

| Field | Type | Notes |
|---|---|---|
| `sales_expense_id` | number | required; master [Biaya Penjualan](../sales-expense/index.md) |
| `sales_expense_code` `sales_expense_name` | string \| undefined | resolved display fields |
| `notes` | string | keterangan biaya, boleh kosong |
| `amount` | number | > 0, rupiah |

## Status dan aturan

- Order baru: `approval_status: pending`, `invoice_status: not_invoiced`.
- `pending` → `approved` (Setujui); `approved` → `pending` (Batalkan Persetujuan) **selama belum ada invoice**. Tidak ada status ditolak.
- Edit dan hapus hanya selama `pending` dan tidak `locked`.
- Hanya order `approved` yang belum diinvoice yang bisa dijadikan invoice (lihat invoiceable-lines).
- **Closing period:** create, edit, hapus, dan perubahan persetujuan ditolak bila `date` (lama maupun baru) ada di periode closing.
  Baca, cetak, dan riwayat tetap boleh.
- Hapus = hard delete di mock; riwayatnya ikut terhapus.

## Catatan lintas modul (Invoice Penjualan)

Satu order ↔ paling banyak satu invoice yang tidak `rejected` (`sales_invoice.sales_order_id`). Invoice yang ditolak melepas order-nya,
sehingga order bisa dibuatkan invoice lain; mengajukan ulang invoice yang ditolak ditolak bila order sudah diambil invoice lain.
Jumlah per baris invoice boleh berbeda dari order (legacy juga mengizinkan); tidak ada penghitung `invoiced_quantity` per baris.
Mock: helper `linkedInvoice(orderId)` di `mocks/modules/sales-order.ts`; Invoice Penjualan menulis riwayat order "Invoice Dibuat" / "Invoice Dihapus".

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sales-order` | [list-sales-order](./list-sales-order.md) |
| GET | `/sales-order/:id` | [get-sales-order](./get-sales-order.md) |
| POST | `/sales-order` | [create-sales-order](./create-sales-order.md) |
| PUT | `/sales-order/:id` | [update-sales-order](./update-sales-order.md) |
| DELETE | `/sales-order/:id` | [delete-sales-order](./delete-sales-order.md) |
| PATCH | `/sales-order/:id/approval` | [update-sales-order-status](./update-sales-order-status.md) |
| GET | `/sales-order/:id/history` | [get-sales-order-history](./get-sales-order-history.md) |
| GET | `/sales-order/:id/invoiceable-lines` | [get-sales-order-invoiceable-lines](./get-sales-order-invoiceable-lines.md) |
