---
type: API Endpoint
title: Get Closing Reconciliation
description: Reconciliation overview for one period — trial balance, balance sheet and unfinished journals.
method: GET
path: /posting/closing/reconciliation
status: mock
tags: [closing, reconciliation, read]
resource: /frontend/src/mocks/modules/posting.ts
timestamp: 2026-11-05T22:00:00Z
---

# Get Closing Reconciliation

Lets FAT validate whether a period's data is balanced before closing. Computed live for any period.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `period` | string | yes | `YYYY-MM` |

## Response

`200`: `{ "data": ClosingReconciliation }` — see [index](./index.md#closingreconciliation).

| Check `key` | Basis | `fail` when |
|---|---|---|
| `trial_balance` | Σdebit vs Σcredit of **approved** journals dated within the period (Jurnal Umum, Pemasukan, Pengeluaran incl. the cash side) | debit ≠ credit |
| `balance_sheet` | cumulative up to period end: Aset (`cash_bank` + `asset`) vs Liabilitas + Ekuitas + Laba Berjalan (revenue − expense) | Aset ≠ Liabilitas + Ekuitas |
| `pending_journals` | count of `submitted` journals dated within the period, per journal type | `warn` when count > 0 (never `fail`) |

## Errors

| Status | When | Body |
|---|---|---|
| `422` | missing / malformed `period` | `{ "message": "Validasi gagal", "errors": { "period": ["..."] } }` |
