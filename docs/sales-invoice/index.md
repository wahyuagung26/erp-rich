---
type: OKF Module
title: Invoice Penjualan (Sales Invoice)
description: Tagihan penjualan ke customer (legacy `so` / `trso`) — header, produk per gudang, diskon global, biaya penjualan, pembayaran saat invoice dibuat, approval yang menggerakkan stok + jurnal, faktur pajak. Hub bagi Surat Jalan, Retur Penjualan, Piutang Customer, dan Import Faktur Pajak.
tags: [sales-invoice, penjualan, receivables]
timestamp: 2026-11-13T12:00:00Z
---

# Invoice Penjualan

Invoice yang ditagihkan ke customer. Consumed by `frontend/src/views/sales-invoice/` (list, detail, tambah, edit, cetak).
Dibuat **dari Sales Order** (`/sales-invoice/tambah?sales_order_id=<id>`, memakai
[get-sales-order-invoiceable-lines](../sales-order/get-sales-order-invoiceable-lines.md)) atau **langsung tanpa SO**.

Approve = **stok keluar + jurnal** (mock hanya mengubah status dan menulis riwayat; tidak ada buku stok/jurnal). Karena itu Invoice Penjualan
**terkena closing period** ([conventions](../conventions.md#closing-period-lock-locked)): field `locked`, `ClosingBadge`, dan 422 pada edit / hapus /
setiap perubahan approval / `date` di periode closing. Faktur pajak tetap bisa diubah.

Tidak diport dari legacy: persetujuan harga di bawah minimum, draft per-sesi, nomor per cabang, RBAC departemen, Giro / voucher / transfer lookup,
biaya admin pembayaran, bulat ke kelipatan 50.

## Rumus

Sama persis dengan [Sales Order](../sales-order/index.md#rumus) (server-authoritative; client hanya preview):

```
line.total      = round((price − discount) × quantity)          discount = rupiah per satuan
subtotal        = Σ line.total
discount_global = nominal → min(discount_value, subtotal) | percent → round(subtotal × discount_value / 100)
dpp             = PKP ? max(subtotal − discount_global, 0) : 0
ppn             = PKP ? round(dpp × 11%) : 0
expense_total   = Σ expense.amount
total           = max(subtotal − discount_global, 0) + ppn + expense_total
paid_total      = Σ payments.amount            (SEMUA baris db.salesInvoicePayment milik invoice, kind apa pun)
outstanding     = total − paid_total           ("Sisa")
due_date        = date + top_days
```

## Entity: `SalesInvoice`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment |
| `number` | string | "Nomor", `<kode perusahaan>.INV<yymmdd>/<nnn>`, mis. `RIN.INV260920/001`; otomatis (format legacy `so`) |
| `date` | string | `YYYY-MM-DD`; tidak boleh di periode closing |
| `locked` | boolean | response-only (get / list): `date` di periode closing → edit, hapus, approval diblokir |
| `top_days` | number | `0, 7, 14, 21, 30, 60, 90, 120` |
| `due_date` | string | read-only, `date + top_days` |
| `customer_id` `customer_code` `customer_name` `customer_address` `customer_phone` | — | customer + resolved fields |
| `sales_id` `sales_code` `sales_name` | — | Master Sales |
| `department_id` `department_code` `department_name` | — | |
| `sales_order_id` | number \| null | Sales Order sumber; `null` = invoice langsung. Terkunci setelah create |
| `sales_order_number` | string \| null | resolved |
| `pkp_active` | boolean | snapshot status PKP invoice (default dari customer / SO, bisa diubah) |
| `description` | string | opsional |
| `discount_type` `discount_value` `discount_global` | — | diskon global (lihat Rumus) |
| `approval_status` | enum | `pending`, `approved`, `rejected` |
| `rejection_reason` `approved_by` `approved_at` | string \| null | metadata approval |
| `tax_invoice` | object \| null | `{ number, date, file }` — bentuk sama dengan [Invoice Pembelian](../purchase-invoice/index.md#faktur-pajak-modal-bersama); hanya untuk `pkp_active` |
| `created_by` | string | |
| `lines` | array of `SalesInvoiceLine` | min. 1, **satu baris per produk** (unik per invoice) |
| `expenses` | array | Biaya Penjualan, bentuk sama dengan [`SalesOrderExpense`](../sales-order/index.md#entity-salesorderexpense-biaya-penjualan) |
| `subtotal` `dpp` `ppn` `expense_total` `total` | number | computed |
| `payments` | array of `SalesInvoicePayment` | semua pembayaran invoice, urut `date` lalu `id` |
| `paid_total` `outstanding` | number | computed dari **semua** `payments` |
| `payment_status` | enum | computed: `unpaid` (`paid_total = 0`), `partial`, `paid` (`outstanding ≤ 0`) |

## Entity: `SalesInvoiceLine`

| Field | Type | Notes |
|---|---|---|
| `variant_id` | number | identitas baris ([varian produk](../product/index.md#variants-sku)), unik per invoice |
| `product_id` `product_code` `product_name` `sku` `variant_label` `brand_name` `unit_name` | — | resolved dari varian |
| `warehouse_id` `warehouse_code` `warehouse_name` | — | gudang asal barang |
| `quantity` | number | > 0 (boleh berbeda dari SO) |
| `price` | number | harga satuan sebelum diskon, > 0 |
| `discount` | number | rupiah **per satuan**, ≥ 0, ≤ `price` |
| `notes` | string | keterangan baris |
| `total` | number | `round((price − discount) × quantity)` |

## Entity: `SalesInvoicePayment`

| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `invoice_id` | number | |
| `date` | string | untuk `kind: creation` = `date` invoice |
| `payment_type_id` `payment_type` `method` | — | master [Pembayaran](../payment-type/index.md) (`transaction_type: sale`); `payment_type` = nama, `method` = `cash_bank` \| `down_payment` \| `expense`. Tipe **Biaya** hard-coded (`payment_type_id: -1`, `payment_type: "Biaya"`, `method: "expense"`; keputusan 2026-10-14, sama dengan [Piutang Customer](../customer-receivable/index.md)) — bukan baris master |
| `reference` | string | referensi bebas (no. transfer dst.); untuk titipan diisi nomor titipan; untuk Biaya diisi nama biaya penjualan |
| `amount` | number | > 0 |
| `kind` | enum | `creation` = dibayar **saat invoice dibuat** (milik invoice, ditulis form Invoice); `receivable` = pembayaran piutang sesudahnya (ditulis Piutang Customer (`customer-receivable`)) |
| `deposit_id` | number \| undefined | hanya `method: down_payment` — [Titipan Customer](../customer-deposit/index.md) yang dipakai |
| `deposit_number` | string \| undefined | resolved |
| `sales_expense_id` | number \| undefined | hanya `method: expense` (Biaya) — [Biaya Penjualan](../sales-expense/index.md); tanpa akun cash / bank, tanpa arus kas |

Baris disimpan di `db.salesInvoicePayment` (`mocks/db.ts`): `{ id, invoice_id, date, payment_type_id, payment_type, method, reference, amount, kind, deposit_id?, sales_expense_id? }`.
`paid_total` / `outstanding` **selalu dihitung ulang dari semua baris invoice itu**, tidak disimpan.

## Status dan aturan

- Invoice baru `pending`. `pending` → `approved` / `rejected`; `rejected` → **Ajukan Ulang** (`pending`); `approved` → **Batalkan Approval** (`pending`).
- Edit dan hapus hanya selama `approval_status ≠ approved` dan tidak `locked`. Invoice `rejected` boleh diedit (tetap `rejected` sampai diajukan ulang).
- **Batalkan Approval** ditolak bila: ada pembayaran `kind: receivable`, atau ada dokumen turunan (Surat Jalan / Retur Penjualan — mock: guard di `unapproveGuards`, lihat bawah), atau `locked`.
- Dari Sales Order: **1 SO ↔ paling banyak 1 invoice** untuk seluruh dokumen ([sales-order](../sales-order/index.md#catatan-lintas-modul-invoice-penjualan)).
  Hanya SO `approved` yang belum punya invoice (yang tidak `rejected`). Form diisi dari semua baris SO; customer terkunci ke customer SO,
  baris lain tetap boleh diubah. Invoice `rejected` melepas SO-nya; Ajukan Ulang ditolak bila SO sudah diambil invoice lain.
- Pembayaran saat invoice dibuat: `payments[]` di body create / update (replace penuh baris `creation`; baris `receivable` tidak tersentuh). Total semua pembayaran ≤ `total`.
  Tipe `down_payment` (Titipan) wajib memilih `deposit_id` milik customer yang sama, nominal ≤ `remaining` titipan; menulis
  `CustomerDepositUsage` ([contract](../customer-deposit/index.md#contract-for-invoice-penjualan)) dan menghapusnya saat pembayaran / invoice dihapus.
  Tipe **Biaya** (`payment_type_id: -1`) wajib `sales_expense_id` biaya penjualan aktif dan ikut dihitung dalam batas `total`; mengurangi `outstanding` seperti pembayaran lain.
- Pembayaran sesudah invoice dibuat **hanya** lewat Piutang Customer.

## Kontrak untuk modul berikutnya

| Modul | Yang dipakai |
|---|---|
| Surat Jalan (satu SJ per invoice) | `GET /sales-invoice/:id` → `lines[].{variant_id, product_*, sku, variant_label, unit_name, quantity, warehouse_*}`, `approval_status`, header customer. Baris stabil & unik per varian. Daftarkan guard di `unapproveGuards` |
| Retur Penjualan | `lines[].{variant_id, quantity (qty terjual), price, discount, total}`, `pkp_active`, `tax_invoice` |
| Piutang Customer | tulis `db.salesInvoicePayment` dengan `kind: 'receivable'`; baca `outstanding`, `due_date`, `payment_status`; helper `invoicePaidTotal`, `findSalesInvoice` |
| Import Faktur Pajak | `GET/PUT /sales-invoice/:id/tax-invoice` |

Helper yang diekspor `mocks/modules/sales-invoice.ts`: `invoicePaidTotal(invoiceId)`, `invoiceOutstanding(invoiceId)`, `findSalesInvoice(id)` (resolved, tanpa `locked`),
`resolveSalesInvoice(row)`, `unapproveGuards` (array `(invoiceId) => string | null`).

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sales-invoice` | [list-sales-invoice](./list-sales-invoice.md) |
| GET | `/sales-invoice/:id` | [get-sales-invoice](./get-sales-invoice.md) |
| POST | `/sales-invoice` | [create-sales-invoice](./create-sales-invoice.md) |
| PUT | `/sales-invoice/:id` | [update-sales-invoice](./update-sales-invoice.md) |
| DELETE | `/sales-invoice/:id` | [delete-sales-invoice](./delete-sales-invoice.md) |
| PATCH | `/sales-invoice/:id/approval` | [update-sales-invoice-approval](./update-sales-invoice-approval.md) |
| GET | `/sales-invoice/:id/tax-invoice` | [get-sales-invoice-tax-invoice](./get-sales-invoice-tax-invoice.md) |
| PUT | `/sales-invoice/:id/tax-invoice` | [update-sales-invoice-tax-invoice](./update-sales-invoice-tax-invoice.md) |
| GET | `/sales-invoice/:id/history` | [get-sales-invoice-history](./get-sales-invoice-history.md) |

Dipakai dari modul lain: `GET /sales-order/:id/invoiceable-lines` (form), `GET /customer-deposit?customer_id=&has_balance=1` (pilihan titipan), `GET /customer-receivable/payment-types` (tipe pembayaran form: master `sale` cash_bank / down_payment + Biaya), `GET /sales-expense` (pilihan Biaya), `GET /delivery-note?sales_invoice_id=` (detail: tombol Buat / Lihat Surat Jalan).
