---
type: OKF Module
title: Sales Order
description: Pesanan penjualan ke customer (legacy Sales Quotation `sq`, dicetak "SALES ORDER") — header, produk per gudang, diskon global, biaya penjualan, approval, status invoice. Dasar pembuatan Invoice Penjualan; tidak menggerakkan stok maupun jurnal.
tags: [sales-order, penjualan]
timestamp: 2026-11-06T17:00:00Z
---

# Sales Order

Pesanan dari customer. Consumed by `frontend/src/views/sales-order/` (list, detail, tambah, edit, cetak).
Sales Order **tidak** menggerakkan stok maupun jurnal — karena itu **tidak terkena closing period**
(tidak ada field `locked`, tidak ada `ClosingBadge`; lihat [conventions](../conventions.md#closing-period-lock-locked)).
Dokumen ini kemudian dijadikan dasar [Invoice Penjualan](../sales-invoice/index.md) lewat
[get-sales-order-invoiceable-lines](./get-sales-order-invoiceable-lines.md).

Semua angka (`total` baris, `subtotal`, `discount_global`, `dpp`, `ppn`, `expense_total`, `total`) dihitung **server**;
client hanya mengirim input. UI menghitung preview dengan rumus yang sama, tetapi server yang menentukan.

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

## Entity: `SalesOrder`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | `<kode perusahaan>.SO<yymmdd><nnn>`, mis. `RIN.SO260902001`; otomatis, read-only (format legacy `sq`) |
| `date` | string | required, `YYYY-MM-DD` |
| `top_days` | number | termin pembayaran, salah satu dari `0, 7, 14, 21, 30, 60, 90, 120` (0 = tunai) |
| `due_date` | string | read-only, `date + top_days` |
| `customer_id` | number | required; customer master |
| `customer_code` `customer_name` `customer_address` `customer_phone` | string \| undefined | resolved display fields (address & phone feed the print view) |
| `sales_id` | number | required; Master Sales (salesperson) |
| `sales_code` `sales_name` | string \| undefined | resolved display fields |
| `department_id` | number | required |
| `department_code` `department_name` | string \| undefined | resolved display fields |
| `pkp_active` | boolean | required; UI default = `customer.pkp`, bisa diubah per order. `true` → PPN 11% |
| `description` | string | optional (boleh kosong) |
| `discount_type` | enum | `nominal` \| `percent` — jenis diskon global (legacy "Diskon Invoice") |
| `discount_value` | number | input diskon global: rupiah (`nominal`) atau persen 0–100 (`percent`); 0 = tanpa diskon |
| `discount_global` | number | computed, nilai diskon global dalam rupiah |
| `approval_status` | enum | `pending`, `approved`, `rejected` |
| `invoice_status` | enum | computed: `not_invoiced`, `partial`, `invoiced` — dari `invoiced_quantity` semua baris |
| `rejection_reason` | string \| null | terisi saat ditolak |
| `approved_by` `approved_at` | string \| null | metadata approval |
| `created_by` | string | nama pembuat |
| `lines` | array of `SalesOrderLine` | minimal satu baris, produk tidak boleh dobel |
| `expenses` | array of `SalesOrderExpense` | Biaya Penjualan, boleh kosong |
| `subtotal` `dpp` `ppn` `expense_total` `total` | number | computed (lihat Rumus) |

## Entity: `SalesOrderLine`

| Field | Type | Notes |
|---|---|---|
| `product_id` | number | required; produk aktif. Unik per order |
| `product_code` `product_name` `brand_name` `unit_name` | string \| undefined | resolved display fields |
| `warehouse_id` | number | required; gudang asal barang |
| `warehouse_code` `warehouse_name` | string \| undefined | resolved display fields |
| `quantity` | number | > 0 |
| `price` | number | > 0; default UI dari `product.selling_price`, bisa diubah |
| `discount` | number | ≥ 0, rupiah **per satuan**, tidak boleh melebihi `price` |
| `notes` | string | keterangan baris, boleh kosong |
| `total` | number | computed: `round((price − discount) × quantity)` |
| `invoiced_quantity` | number | computed/read-only untuk client; jumlah yang sudah dibuat Invoice Penjualan (lihat Catatan) |
| `remaining_quantity` | number | computed: `max(quantity − invoiced_quantity, 0)` |

## Entity: `SalesOrderExpense` (Biaya Penjualan)

| Field | Type | Notes |
|---|---|---|
| `sales_expense_id` | number | required; master [Biaya Penjualan](../sales-expense/index.md) |
| `sales_expense_code` `sales_expense_name` | string \| undefined | resolved display fields |
| `notes` | string | keterangan biaya, boleh kosong |
| `amount` | number | > 0, rupiah |

## Status dan aturan

- Order baru: `approval_status: pending`, `invoice_status: not_invoiced`.
- `pending` → disetujui / ditolak lewat detail; `rejected` → bisa Ajukan Ulang (`pending`). Order yang sudah `approved` tidak bisa dibatalkan persetujuannya.
- Edit dan hapus hanya selama `approval_status ≠ approved` **dan** belum ada invoice (`invoice_status = not_invoiced`).
- Hanya order `approved` yang bisa dijadikan Invoice (lihat invoiceable-lines).
- `invoice_status`: semua `invoiced_quantity = 0` → `not_invoiced`; semua baris `invoiced_quantity ≥ quantity` → `invoiced`; selain itu `partial`.
- Hapus = hard delete di mock; riwayatnya ikut terhapus.

## Catatan lintas modul (Invoice Penjualan)

`invoiced_quantity` per baris disimpan di mock pada `db.salesOrder[].lines[].invoiced_quantity`. Mock Invoice Penjualan **tidak** menulisnya langsung,
melainkan memanggil helper yang diekspor `applyInvoicedQuantity(orderId, lines, direction, reference?)` dari `mocks/modules/sales-order.ts`
(`direction` `1` saat invoice dibuat/diubah ke order, `-1` saat dibatalkan/dihapus; `lines` = `[{ product_id, quantity }]`; `reference` = nomor invoice untuk riwayat).
Backend nyata: jumlah yang sudah diinvoice = Σ `quantity` baris invoice (tidak ditolak/dibatalkan) yang merujuk order & produk tersebut.

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
