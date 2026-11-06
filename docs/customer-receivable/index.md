---
type: OKF Module
title: Piutang Customer (Customer Receivable)
description: Piutang ke customer per Invoice Penjualan yang disetujui (legacy `penagih` + `v1_2_ar_payments`) — jatuh tempo, pembayaran cash / bank, pemakaian titipan, dan pelunasan dengan biaya.
tags: [customer-receivable, penjualan, receivables]
timestamp: 2026-11-06T17:00:00Z
---

# Piutang Customer

Piutang yang terbentuk saat [sales-invoice](../sales-invoice/index.md) **disetujui**. Consumed by
`frontend/src/views/customer-receivable/` (list, detail, cetak). Ported from Legacy `penagih` (daftar piutang) dan pembayaran piutang
(`piutang = 'Y'`) beserta keputusan 2026-10-14 (pembayaran tipe Biaya).

**Tidak ada create/delete piutang.** Piutang 1:1 dengan Invoice Penjualan `approved` — `id` piutang = `sales_invoice_id` = `id` invoice, `number` = nomor invoice.
Hanya **pembayaran** yang bisa ditulis. Invoice `pending` / `rejected` tidak muncul (404).

**Sumber data pembayaran:** `db.salesInvoicePayment` (milik [sales-invoice](../sales-invoice/index.md#entity-salesinvoicepayment)). `paid_total`, `outstanding` dan
`status` dihitung ulang dari **semua** baris invoice. Tiga asal baris (`source`):

| `source` | Baris asli | Di halaman ini |
|---|---|---|
| `creation` | `kind: creation` — dibayar saat invoice dibuat | tampil, **read-only** ("dikelola dari Invoice Penjualan") |
| `return` | `kind: receivable` dengan `return_id` — penyelesaian [Retur Penjualan](../sales-return/index.md) | tampil, **read-only** ("dikelola dari Retur Penjualan <nomor>", tautan `/sales-return/<return_id>`) |
| `receivable` | `kind: receivable` tanpa `return_id` — dicatat di sini | bisa diedit / dibatalkan (kecuali periode closing) |

Closing period: Invoice sudah ter-lock di modulnya. **Pembayaran terkunci menurut `date`-nya sendiri** (lihat Guardrails).
Cetak: `PageCustomerReceivablePrint.vue` (A4 portrait dari halaman detail, `/customer-receivable/:id/cetak`).

**Scope prototipe:** jurnal Posting belum dibuat; aging bucket, fee, arus kas dan giro di luar scope. Posting tipe Biaya (keputusan 2026-10-14):
debit akun Biaya Penjualan yang dipilih, kredit piutang — **bukan** akun bank.

## Entity: `CustomerReceivable`

| Field | Type | Notes |
|---|---|---|
| `id` | number | = `id` invoice penjualan |
| `number` | string | "Nomor" = nomor invoice, read-only |
| `date` | string | tanggal invoice |
| `top_days` `due_date` | — | `due_date = date + top_days` ("Jatuh Tempo") |
| `customer_id` `customer_code` `customer_name` | — | resolved |
| `department_id` `department_code` `department_name` `sales_name` | — | resolved |
| `description` | string | keterangan invoice |
| `total` | number | total invoice |
| `paid_total` | number | jumlah seluruh `payments` ("Terbayar") |
| `outstanding` | number | `total − paid_total` ("Sisa") |
| `status` | enum | `unpaid`, `partial`, `paid` (Lunas) — sama dengan `payment_status` invoice |
| `overdue` | boolean | `outstanding > 0` dan `due_date` sebelum hari ini |
| `payments` | array | `CustomerReceivablePayment`, urut `date` lalu `id` |

## Entity: `CustomerReceivablePayment`

| Field | Type | Notes |
|---|---|---|
| `id` | number | id baris `db.salesInvoicePayment` |
| `number` | string \| null | "Nomor", `AR-<nomor invoice>-BY<nn>` (format legacy `byrso`, nn = urutan pembayaran pada invoice itu), mis. `AR-RIN.INV260920/001-BY02`, untuk `source: receivable`; `null` untuk `creation` / `return` |
| `date` | string | `YYYY-MM-DD` |
| `source` | enum | `creation` \| `return` \| `receivable` (lihat atas) |
| `payment_type_id` `payment_type_name` | — | tipe pembayaran; Biaya = id `-1` (hard-coded, bukan master) |
| `method` | enum | `cash_bank` \| `down_payment` (Titipan) \| `expense` (Biaya) |
| `bank_account_id` `bank_account_name` | — | untuk `cash_bank` |
| `deposit_id` `deposit_number` | — | untuk `down_payment` ([Titipan Customer](../customer-deposit/index.md)) |
| `sales_expense_id` `sales_expense_name` | — | untuk `expense` ([Biaya Penjualan](../sales-expense/index.md)) |
| `return_id` `return_number` | — | untuk `source: return` |
| `reference` | string | teks tampilan referensi (nama bank / nomor titipan / nama biaya / nomor retur / referensi invoice) |
| `description` | string | |
| `amount` | number | |
| `locked` | boolean | server-computed: `date` pembayaran di periode closing ([Posting & Closing](../posting/index.md)); hanya bermakna untuk `source: receivable` |

## Guardrails

- Hanya invoice `approved` yang punya piutang; mencatat pembayaran ke invoice lain → `422`.
- `amount > 0` dan `≤ outstanding`; tanggal tidak boleh melebihi hari ini dan tidak sebelum `date` invoice.
- Tipe pembayaran: master `payment-type` (`transaction_type=sale`, `method` `cash_bank` atau `down_payment`) **atau** **Biaya** (hard-coded, lihat [list-customer-receivable-payment-type](./list-customer-receivable-payment-type.md)).
- `cash_bank` wajib `bank_account_id`. `down_payment` (Titipan) wajib `deposit_id` milik customer yang sama dengan `amount ≤ remaining` titipan; menambah baris
  [pemakaian](../customer-deposit/list-customer-deposit-usage.md) pada titipan (menaikkan `used`, menurunkan `remaining`) + riwayat titipan; membatalkan pembayaran
  menghapusnya. **Biaya** wajib `sales_expense_id` (Biaya Penjualan aktif); bukan uang masuk, tanpa akun kas/bank.
- **Periode closing:** pembayaran `source: receivable` dengan `date` di periode closing (`period <= closed_until`) `locked` — tidak bisa diedit / dibatalkan; pembayaran baru
  dan perubahan tanggal ke periode closing ditolak. Invoice tetap bisa dilihat; pembayaran `creation` / `return` mengikuti kunci modul asalnya.
- Edit hanya `date`, `amount`, `description`, `bank_account_id` (cash/bank), `sales_expense_id` (Biaya); tipe dan titipan tetap.
- Pembayaran `creation` / `return` ditolak diubah dari sini (`422`, pesan menyebut modul pengelolanya).
- Invoice dengan pembayaran piutang tidak bisa **Batalkan Approval** (aturan di [sales-invoice](../sales-invoice/index.md#status-dan-aturan)).

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/customer-receivable` | [list-customer-receivable](./list-customer-receivable.md) |
| GET | `/customer-receivable/:id` | [get-customer-receivable](./get-customer-receivable.md) |
| GET | `/customer-receivable/payment-types` | [list-customer-receivable-payment-type](./list-customer-receivable-payment-type.md) |
| POST | `/customer-receivable/:id/payments` | [create-customer-receivable-payment](./create-customer-receivable-payment.md) |
| PUT | `/customer-receivable/:id/payments/:paymentId` | [update-customer-receivable-payment](./update-customer-receivable-payment.md) |
| DELETE | `/customer-receivable/:id/payments/:paymentId` | [delete-customer-receivable-payment](./delete-customer-receivable-payment.md) |

Referensi pendukung: titipan lewat [list-customer-deposit](../customer-deposit/list-customer-deposit.md) (`customer_id`, `has_balance=1`), riwayat invoice lewat
[get-sales-invoice-history](../sales-invoice/get-sales-invoice-history.md) (pembayaran piutang tercatat di riwayat invoice).
