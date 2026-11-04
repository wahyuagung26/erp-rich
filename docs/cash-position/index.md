---
type: OKF Module
title: Cash Position
description: Daily cash & bank position report — per cash/bank account, yesterday's balance plus the day's movements, computed live from approved journals. Company-scoped, read-only.
tags: [report, cash, bank, accounting]
timestamp: 2026-11-05T12:00:00Z
---

# Cash Position

"Posisi Kas & Bank" — a read-only daily report. Consumed by
`frontend/src/views/cash-position/`. Ports the legacy `saldo_kas_bank` module.

For a given `date_from`–`date_to` range (a single day when equal) and the active company, it lists **every non-deleted
`cash_bank` [`Account`](../account/index.md)** (even ones with no activity) and,
per account:

| Column | Meaning |
|---|---|
| `opening` | "Saldo Awal" — Σ(debit − credit) of every approved journal movement touching the account, dated **before** `date_from`. Balances accumulate from zero; there is no separate opening-balance record. |
| `cash_in` | "Uang Masuk" — Σ(debit) of movements dated **within** the range |
| `cash_out` | "Uang Keluar" — Σ(credit) of movements dated **within** the range |
| `closing` | "Saldo Akhir" — `opening + cash_in − cash_out` |

**Movements** are drawn, `status: approved` only, from:

- [journal](../journal/index.md) — every line whose `account_id` is a `cash_bank`
  account: `debit` / `credit` as recorded.
- [journal-expense](../journal-expense/index.md) — the header `cash_account_id`:
  `credit = cash_out`.
- [journal-income](../journal-income/index.md) — the header `cash_account_id`:
  `debit = cash_in`.

## Entity: `CashPosition`

| Field | Type | Notes |
|---|---|---|
| `date_from` / `date_to` | string | `YYYY-MM-DD`, the report range (echoed back) |
| `rows` | `CashPositionRow[]` | one per `cash_bank` account, ordered by `account_code` |
| `total` | object | column sums: `{ opening, cash_in, cash_out, closing }` |
| `cash_flow_closing` | number | "Saldo Kas Akhir Laporan Arus Kas" — see [get-cash-position](./get-cash-position.md) |
| `difference` | number | "Selisih" = `total.closing − cash_flow_closing` |

### `CashPositionRow`

| Field | Type |
|---|---|
| `account_id` | number |
| `account_code` | string |
| `account_name` | string |
| `opening` / `cash_in` / `cash_out` / `closing` | number |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/cash-position` | [get-cash-position](./get-cash-position.md) |
