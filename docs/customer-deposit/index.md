---
type: OKF Module
title: Titipan Customer
description: Customer deposit (titipan customer) — money received from a customer in advance, applied against Invoice Penjualan. Usage is read-only and computed from the usage rows below.
tags: [customer-deposit, deposit, titipan, penjualan]
timestamp: 2026-11-06T17:00:00Z
---

# Titipan Customer

"Titipan Customer" — money a customer pays before a sale, held as a balance (Sisa) and consumed when an
[Invoice Penjualan](../sales-invoice/index.md) is paid with it. Consumed by `frontend/src/views/customer-deposit/`.
Legacy: `titipan` (titipan_member / pembayaran_titipan / titipan_pakai). There is **no** approval workflow; the
deposit is usable the moment it is created, and it posts a jurnal (Kas/Bank debit, Titipan Customer credit), so it is
**closing-locked** ([conventions](../conventions.md#closing-period-lock-locked)).

`used` / `remaining` / `last_invoice_number` are server-computed from the sum of the deposit's
[`CustomerDepositUsage`](#entity-customerdepositusage) rows (active usage only) and are never written. Usage rows are
created by Invoice Penjualan (paying with a titipan) and are **read-only** on the deposit side.

## Entity: `CustomerDeposit`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | "Nomor"; server-assigned, format legacy `TSC.<kode perusahaan>/<yymmdd>/<nnn>`, e.g. `TSC.RIN/260903/001`; not user-editable |
| `date` | string | `YYYY-MM-DD` |
| `locked` | boolean | response-only, server-computed: `date` falls in a closed period → edit and delete are refused |
| `department_id` | number | required |
| `department_code` / `department_name` | string | denormalized, response only |
| `customer_id` | number | required; cannot change once the deposit has usage |
| `customer_code` / `customer_name` | string | denormalized, response only |
| `amount` | number | "Nominal"; required, `> 0`, never below `used` |
| `used` | number | "Terpakai" — sum of usage rows, read-only |
| `remaining` | number | "Sisa" — `amount - used` |
| `last_invoice_number` | string \| null | `invoice_number` of the latest usage row, read-only |
| `description` | string | "Keterangan"; optional |
| `cash_account_id` | number | "Akun Kas / Bank" the money was received into; must be a `cash_bank` [`Account`](../account/index.md) |
| `cash_account_code` / `cash_account_name` | string | denormalized, response only |
| `cash_flow` | string \| null | optional code from [`CashFlow`](../cash-flow/index.md) |
| `cash_flow_name` | string | denormalized, response only |
| `attachment` | object \| null | proof of transfer; one PDF/JPG/JPEG/PNG, max 5 MB; required |

## Entity: `CustomerDepositUsage`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `customer_deposit_id` | number | owning [`CustomerDeposit`](#entity-customerdeposit) |
| `date` | string | `YYYY-MM-DD` |
| `invoice_id` | number \| null | [`SalesInvoice`](../sales-invoice/index.md) that used the deposit; set by the invoice when it saves a Titipan payment (seed rows point at the seeded invoices) |
| `invoice_number` | string | "No Invoice" |
| `note` | string | "Keterangan" |
| `amount` | number | "Nominal Pakai" |

## Contract for Invoice Penjualan

- **Payment picker:** `GET /customer-deposit?customer_id=<id>&has_balance=1` ([list](./list-customer-deposit.md)) — only that customer's deposits with `remaining > 0`. Use `id`, `number`, `date`, `remaining` for the picker; the amount applied to one invoice must be `<= remaining`.
- **Applying a deposit** adds one `CustomerDepositUsage` row (`customer_deposit_id`, `date`, `invoice_id`, `invoice_number`, `note`, `amount`); cancelling/deleting that invoice (or payment line) removes the row. There is no HTTP endpoint to write usage here — in the mock the invoice handler pushes to `db.customerDepositUsage`.
- **Reading usage:** `GET /customer-deposit/:id/usage` ([usage](./list-customer-deposit-usage.md)).

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/customer-deposit` | [list-customer-deposit](./list-customer-deposit.md) |
| GET | `/customer-deposit/:id` | [get-customer-deposit](./get-customer-deposit.md) |
| POST | `/customer-deposit` | [create-customer-deposit](./create-customer-deposit.md) |
| PUT | `/customer-deposit/:id` | [update-customer-deposit](./update-customer-deposit.md) |
| DELETE | `/customer-deposit/:id` | [delete-customer-deposit](./delete-customer-deposit.md) |
| GET | `/customer-deposit/:id/usage` | [list-customer-deposit-usage](./list-customer-deposit-usage.md) |
| GET | `/customer-deposit/:id/history` | [get-customer-deposit-history](./get-customer-deposit-history.md) |
