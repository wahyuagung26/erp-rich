---
type: OKF Module
title: Hutang Supplier (Supplier Payable)
description: Hutang ke supplier per invoice pembelian yang disetujui (Legacy "kontrabon") — jatuh tempo, pembayaran cash/bank, dan pembayaran dengan potong retur pembelian.
tags: [supplier-payable, procurement, payables]
timestamp: 2026-11-05T14:00:00Z
---

# Hutang Supplier

Hutang yang terbentuk saat [purchase-invoice](../purchase-invoice/index.md) **disetujui**. Consumed by
`frontend/src/views/supplier-payable/` (list, detail). Ported from Legacy `/kontrabon`, dengan istilah "kontrabon" diganti
**Hutang Supplier** dan "pembayaran kontrabon" menjadi **pembayaran hutang supplier per invoice** (notulen 2026-08-24).

**Tidak ada create/delete hutang.** Hutang 1:1 dengan invoice `approved` — `id` hutang = `purchase_invoice_id`, `number` = `kontrabon_number`
invoice. Yang bisa ditulis hanyalah **pembayaran**.

**Scope prototipe:** biaya admin, kembalian, arus kas per pembayaran, dan giro **di luar scope**; jurnal Posting belum dibuat.
Cetak: `PageSupplierPayablePrint.vue` (print view A4 dari halaman detail, disimpan sebagai PDF lewat dialog cetak browser).

## Entity: `SupplierPayable`

| Field | Type | Notes |
|---|---|---|
| `id` | number | = `purchase_invoice_id` |
| `number` | string | "No Hutang Supplier" (`kontrabon_number` invoice), read-only |
| `date` | string | tanggal invoice disetujui |
| `top_days` | number | TOP supplier (hari) saat ini |
| `due_date` | string | `date + top_days` ("Jatuh Tempo") |
| `purchase_invoice_id` `purchase_invoice_number` `supplier_invoice_number` | — | referensi invoice |
| `supplier_id` `supplier_code` `supplier_name` | — | resolved |
| `department_id` `department_code` `department_name` | — | resolved |
| `description` | string | keterangan invoice |
| `total` | number | total invoice |
| `paid_total` | number | jumlah seluruh `payments` ("Terbayar") |
| `remaining_total` | number | `total − paid_total` ("Sisa") |
| `status` | enum | `unpaid` (belum ada pembayaran), `partial`, `paid` (Lunas) |
| `overdue` | boolean | `remaining_total > 0` dan `due_date` sebelum hari ini |
| `payments` | array | `SupplierPayablePayment` |

## Entity: `SupplierPayablePayment`

| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `number` | string | "No Pembayaran", otomatis |
| `date` | string | `YYYY-MM-DD` |
| `payment_type_id` `payment_type_name` | — | tipe pembayaran sisi `purchase` |
| `method` | enum | `cash_bank` \| `return_deduction` \| `down_payment` (dari tipe pembayaran) |
| `bank_account_id` `bank_account_name` | — | terisi untuk `cash_bank` |
| `purchase_return_id` `purchase_return_number` | — | terisi untuk `return_deduction` |
| `supplier_advance_id` `supplier_advance_number` | — | terisi untuk `down_payment` ([Uang Muka Supplier](../supplier-advance/index.md)) |
| `description` | string | |
| `amount` | number | |

## Guardrails

- `amount > 0` dan `≤ remaining_total`; tanggal tidak boleh melebihi hari ini dan tidak sebelum `date` hutang.
- `cash_bank` wajib `bank_account_id`. `return_deduction` wajib `purchase_return_id` berstatus `approved`, supplier sama, dan `amount ≤ remaining_total` retur.
- `down_payment` wajib `supplier_advance_id` dari supplier yang sama dengan `amount ≤ remaining` uang muka.
- Pembayaran `return_deduction` otomatis menambah `settlement` bertipe `payable_deduction` pada retur; membatalkan pembayaran menghapusnya.
- Pembayaran `down_payment` otomatis menambah baris [pemakaian](../supplier-advance/list-supplier-advance-usage.md) pada uang muka (menaikkan `used`, menurunkan `remaining`); membatalkan pembayaran menghapusnya.
- Tipe pembayaran `expense` ditolak.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/supplier-payable` | [list-supplier-payable](./list-supplier-payable.md) |
| GET | `/supplier-payable/:id` | [get-supplier-payable](./get-supplier-payable.md) |
| POST | `/supplier-payable/:id/payments` | [create-supplier-payable-payment](./create-supplier-payable-payment.md) |
| DELETE | `/supplier-payable/:id/payments/:paymentId` | [delete-supplier-payable-payment](./delete-supplier-payable-payment.md) |

Referensi pendukung: tipe pembayaran lewat [list-payment-type](../payment-type/list-payment-type.md) (`transaction_type=purchase`, `method`), retur lewat [list-purchase-return](../purchase-return/list-purchase-return.md).
