---
type: OKF Module
title: Journal Income
description: Cash receipt journal (jurnal pemasukan) — income lines plus an auto-balanced cash/bank debit line, with the same approval workflow as Journal.
tags: [journal, income, cash-receipt, double-entry]
timestamp: 2026-09-07T19:00:00Z
---

# Journal Income

Cash receipt journal — "Jurnal Pemasukan". Consumed by
`frontend/src/views/journal-income/`. Mirror of
[journal-expense](../journal-expense/index.md) with the cash side **debited**:

- The **cash/bank account is a header field** (`cash_account_id`), not a line.
- Lines are the **income sources**, all on the **credit** side.
- The server appends the balancing **cash debit line**: `cash_in = Σ line credit`.
  So the user never types the cash side and the entry always balances.

Business rule (meeting 2026-08-04): jurnal umum is for non-cash / correction
entries; money actually received goes through this journal.

## Entity: `JournalIncome`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | optional input; server-assigned when blank, e.g. `JM-2609-001` |
| `date` | string | `YYYY-MM-DD` |
| `voucher` | string | free-text voucher/reference; required |
| `description` | string | required |
| `attachment` | object \| null | one PDF/JPG/PNG attachment; max 5 MB; required on create |
| `cash_account_id` | number | header cash/bank account (the debit side); must be a `cash_bank` [`Account`](../account/index.md) |
| `cash_account_code` / `cash_account_name` | string | denormalized, response only |
| `department_id` | number | header department; required |
| `department_code` / `department_name` | string | denormalized, response only |
| `cash_flow` | string | header cash-flow code from [`CashFlow`](../cash-flow/index.md); required |
| `cash_flow_name` | string | denormalized, response only |
| `status` | enum | `submitted`, `approved`, or `rejected` |
| `rejection_reason` | string \| null | set when a submitted journal is rejected |
| `approved_by` | string \| null | approver's name; set on approve, cleared on re-submit |
| `approved_at` | string \| null | ISO 8601 datetime of approval; set/cleared alongside `approved_by` |
| `lines` | `JournalIncomeLine[]` | ≥ 1 income line; the cash debit line is NOT stored here |
| `total` | number | server-computed = Σ line credit (gross income) |
| `cash_in` | number | server-computed = Σ line credit (equals `total`); amount debited to the cash/bank account; must be > 0 |

### `JournalIncomeLine`

Same shape as [`JournalExpenseLine`](../journal-expense/index.md): `account_id`
(+ denormalized `account_code` / `account_name`), optional `department_id`
(+ denormalized labels), `detail_description`, `debit`, `credit`. Every income
line is **credit-only** — `credit` > 0 and `debit` is always 0.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/journal-income` | [list-journal-income](./list-journal-income.md) |
| GET | `/journal-income/:id` | [get-journal-income](./get-journal-income.md) |
| POST | `/journal-income` | [create-journal-income](./create-journal-income.md) |
| PUT | `/journal-income/:id` | [update-journal-income](./update-journal-income.md) |
| DELETE | `/journal-income/:id` | [delete-journal-income](./delete-journal-income.md) |
| PATCH | `/journal-income/:id/status` | [update-journal-income-status](./update-journal-income-status.md) |
