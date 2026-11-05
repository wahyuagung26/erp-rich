---
type: OKF Module
title: Retur Pembelian (Purchase Return)
description: Retur barang ke supplier atas satu invoice pembelian yang sudah disetujui — jumlah per produk, DPP/PPN, approval dua arah, faktur pajak, dan penyelesaian retur (potong hutang atau dana kembali).
tags: [purchase-return, procurement, payables]
timestamp: 2026-11-05T14:00:00Z
---

# Retur Pembelian

Retur ("RB") atas **satu** [purchase-invoice](../purchase-invoice/index.md) yang `approved`. Consumed by
`frontend/src/views/purchase-return/` (list, detail, tambah, edit). Ported from Legacy `/rb`.

**Scope prototipe:** stok keluar dan jurnal Posting **di luar scope** (sama seperti invoice). Cetak: `PagePurchaseReturnPrint.vue` (print view A4 dari halaman detail, simpan sebagai PDF lewat dialog cetak browser).
Kapan retur muncul di mutasi hutang supplier masih **unresolved** (lihat notulen 2026-08-24).

## Entity: `PurchaseReturn`

| Field | Type | Notes |
|---|---|---|
| `id` | number | server-assigned |
| `number` | string | nomor otomatis ("No Retur"), read-only |
| `date` | string | required, `YYYY-MM-DD`; tidak melebihi hari ini dan tidak sebelum tanggal invoice |
| `purchase_invoice_id` | number | required; invoice sumber (harus `approved`), terkunci setelah create |
| `purchase_invoice_number` `supplier_invoice_number` | string | resolved, read-only |
| `supplier_id` `supplier_code` `supplier_name` | — | resolved dari invoice, read-only |
| `department_id` `department_code` `department_name` | — | resolved dari invoice, read-only |
| `warehouse_id` | number | required; gudang asal barang yang diretur ("Gudang") |
| `warehouse_code` `warehouse_name` | string | resolved |
| `reason` | string | "Alasan Retur"; required, max 250 karakter |
| `pkp_active` | boolean | snapshot PKP dari invoice sumber |
| `approval_status` | enum | `pending`, `approved` — dua arah (lihat Guardrails) |
| `approved_by` `approved_at` | string \| null | metadata approval |
| `tax_invoice` | object \| null | `{ number, date, file }`; hanya untuk `pkp_active` dan retur `approved`. Modal bersama, lihat [faktur pajak](../purchase-invoice/index.md#faktur-pajak-modal-bersama) |
| `created_by` | string | nama pembuat |
| `lines` | array | hanya produk dengan `quantity > 0` |
| `dpp` `ppn` `total` | number | dihitung server dari `lines` |
| `used_total` | number | total yang dipakai memotong hutang supplier |
| `refunded_total` | number | total dana kembali ke cash / bank |
| `remaining_total` | number | `total − used_total − refunded_total` ("Sisa Retur") |
| `settlement_status` | enum | `open`, `settled` — `settled` bila `approved` dan `remaining_total = 0` |
| `settlements` | array | riwayat penyelesaian, lihat `PurchaseReturnSettlement` |

## Entity: `PurchaseReturnLine`

| Field | Type | Notes |
|---|---|---|
| `product_id` | number | produk pada invoice sumber; identitas baris |
| `product_code` `product_name` `brand_name` `unit_name` | string \| undefined | resolved |
| `quantity_purchased` | number | jumlah pada invoice ("Qty Dibeli") |
| `quantity_returned_before` | number | jumlah yang sudah diretur oleh retur LAIN atas invoice yang sama ("Sudah Diretur") |
| `quantity` | number | "Qty Retur"; `0 ≤ quantity ≤ quantity_purchased − quantity_returned_before` |
| `price` | number | harga satuan dari invoice sumber, read-only |
| `dpp` `ppn` `total` | number | `round(quantity × price)`; `ppn` = 11% bila `pkp_active` |

## Entity: `PurchaseReturnSettlement`

| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `date` | string | `YYYY-MM-DD` |
| `type` | enum | `cash_bank` (dana kembali, dicatat di retur) · `payable_deduction` (potong hutang, dicatat dari [Hutang Supplier](../supplier-payable/index.md)) |
| `payable_number` `payment_number` | string \| null | terisi untuk `payable_deduction` |
| `bank_account_id` `bank_account_name` | — | terisi untuk `cash_bank` |
| `description` | string | |
| `amount` | number | |

## Guardrails

- Invoice sumber harus `approved`. Retur boleh lebih dari satu per invoice selama total `quantity` per produk tidak melebihi jumlah invoice.
- Hanya retur `pending` yang boleh diedit atau dihapus.
- **Approve dua arah:** `pending` → `approved` dan `approved` → `pending` (Batal Approve). Batal approve ditolak bila sudah ada `settlements`.
- Penyelesaian hanya untuk retur `approved`; `amount` tidak boleh melebihi `remaining_total`.
- `cash_bank` dibuat/dibatalkan dari retur; `payable_deduction` dibuat/dibatalkan dari Hutang Supplier dan tidak bisa dibatalkan dari retur.
- Nomor faktur pajak unik antar invoice dan retur.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/purchase-return` | [list-purchase-return](./list-purchase-return.md) |
| GET | `/purchase-return/:id` | [get-purchase-return](./get-purchase-return.md) |
| POST | `/purchase-return` | [create-purchase-return](./create-purchase-return.md) |
| PUT | `/purchase-return/:id` | [update-purchase-return](./update-purchase-return.md) |
| DELETE | `/purchase-return/:id` | [delete-purchase-return](./delete-purchase-return.md) |
| PATCH | `/purchase-return/:id/approval` | [update-purchase-return-approval](./update-purchase-return-approval.md) |
| POST | `/purchase-return/:id/settlements` | [create-purchase-return-settlement](./create-purchase-return-settlement.md) |
| DELETE | `/purchase-return/:id/settlements/:settlementId` | [delete-purchase-return-settlement](./delete-purchase-return-settlement.md) |
| GET | `/purchase-return/:id/tax-invoice` | [get-purchase-return-tax-invoice](./get-purchase-return-tax-invoice.md) |
| PUT | `/purchase-return/:id/tax-invoice` | [update-purchase-return-tax-invoice](./update-purchase-return-tax-invoice.md) |
| GET | `/purchase-return/:id/history` | [get-purchase-return-history](./get-purchase-return-history.md) |
| GET | `/purchase-invoice/:id/returnable-lines` | [get-purchase-invoice-returnable-lines](./get-purchase-invoice-returnable-lines.md) |
