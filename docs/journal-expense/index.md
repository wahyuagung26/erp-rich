---
type: OKF Module
title: Journal Expense
description: Cash disbursement journal (jurnal pengeluaran) — expense lines plus an auto-balanced cash/bank credit line, with the same approval workflow as Journal.
tags: [journal, expense, cash-disbursement, double-entry]
timestamp: 2026-09-07T17:00:00Z
---

# Journal Expense

Cash disbursement journal — "Jurnal Pengeluaran". Consumed by
`frontend/src/views/journal-expense/`. Mirrors [journal](../journal/index.md)'s
approval workflow (`status` / `approved_by` / `approved_at`, `PATCH .../status`)
but the double entry is built differently:

- The **cash/bank account is a header field** (`cash_account_id`), not a line.
- Lines are the **expenses** (debit) and optional **potongan** such as PPh 21 (credit).
- The server appends the balancing **cash credit line**: `cash_out = Σ line debit − Σ line credit`.
  So the user never types the cash side and the entry always balances.

Business rule (meeting 2026-08-04): jurnal umum is for non-cash / correction
entries; money actually leaving the company goes through this journal.

## Entity: `JournalExpense`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | optional input; server-assigned when blank, e.g. `JK-2609-001` |
| `date` | string | `YYYY-MM-DD` |
| `voucher` | string | free-text voucher/reference; required |
| `description` | string | required |
| `attachment` | object \| null | one PDF/JPG/PNG attachment; max 5 MB; required on create |
| `cash_account_id` | number | header cash/bank account (the credit side); must be a `cash_bank` [`Account`](../account/index.md) |
| `cash_account_code` / `cash_account_name` | string | denormalized, response only |
| `department_id` | number | header department; required |
| `department_code` / `department_name` | string | denormalized, response only |
| `cash_flow` | string | header cash-flow code from [`CashFlow`](../cash-flow/index.md); required (tags the cash/bank movement) |
| `cash_flow_name` | string | denormalized, response only |
| `status` | enum | `submitted`, `approved`, or `rejected` |
| `rejection_reason` | string \| null | set when a submitted journal is rejected |
| `approved_by` | string \| null | approver's name; set on approve, cleared on re-submit |
| `approved_at` | string \| null | ISO 8601 datetime of approval; set/cleared alongside `approved_by` |
| `lines` | `JournalExpenseLine[]` | ≥ 1 expense/potongan line; the cash credit line is NOT stored here |
| `total` | number | server-computed = Σ line debit (gross expense) |
| `cash_out` | number | server-computed = Σ line debit − Σ line credit (amount credited to the cash/bank account); must be > 0 |

### `JournalExpenseLine`

| Field | Type | Notes |
|---|---|---|
| `account_id` | number | FK to `Account.id` — the expense (or potongan) account |
| `account_code` / `account_name` | string | denormalized, response only |
| `department_id` | number \| null | optional per-line department; falls back to the header department |
| `department_code` / `department_name` | string | denormalized, response only |
| `detail_description` | string | optional line description |
| `debit` | number | ≥ 0 |
| `credit` | number | ≥ 0; enabled per line via the "aktifkan kredit" checkbox (potongan / PPh 21) |

Per line exactly one of `debit` / `credit` is > 0.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/journal-expense` | [list-journal-expense](./list-journal-expense.md) |
| GET | `/journal-expense/:id` | [get-journal-expense](./get-journal-expense.md) |
| POST | `/journal-expense` | [create-journal-expense](./create-journal-expense.md) |
| PUT | `/journal-expense/:id` | [update-journal-expense](./update-journal-expense.md) |
| DELETE | `/journal-expense/:id` | [delete-journal-expense](./delete-journal-expense.md) |
| PATCH | `/journal-expense/:id/status` | [update-journal-expense-status](./update-journal-expense-status.md) |
