---
type: API Endpoint
title: Create Journal Income
description: Create a cash receipt journal and submit it for approval.
method: POST
path: /journal-income
status: mock
tags: [journal, income, write]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-09-07T19:00:00Z
---

# Create Journal Income

Backs `views/journal-income/components/FormJournalIncome.vue`. The user picks the
header cash/bank account and enters credit-only income lines; the server appends
the balancing cash debit line. A new entry is submitted for approval immediately.

## Request

### Body

```json
{
  "number": "",
  "date": "2026-09-03",
  "voucher": "BKM-2609-001",
  "description": "Penerimaan penjualan tunai",
  "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 12345, "data_url": "data:application/pdf;base64,..." },
  "cash_account_id": 2,
  "department_id": 1,
  "cash_flow": "OPERASI_IN",
  "lines": [
    { "account_id": 5, "department_id": null, "detail_description": "Penjualan tunai", "debit": 0, "credit": 5000000 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `number` | string | no; blank means server-generated (`JM-YYMM-NNN`) |
| `voucher` | string | required; free text |
| `description` | string | required |
| `attachment` | object | required; one PDF/JPG/PNG, max 5 MB |
| `cash_account_id` | number | required; must be a non-deleted `cash_bank` [`Account`](../account/index.md) |
| `department_id` | number | required; active [`Department`](../department/index.md) |
| `cash_flow` | string | required; cash-flow code from [`CashFlow`](../cash-flow/index.md) |
| `lines` | array | ≥ 1 item |
| `lines[].account_id` | number | required; non-deleted [`Account`](../account/index.md) |
| `lines[].department_id` | number \| null | optional active department |
| `lines[].detail_description` | string | optional |
| `lines[].debit` | number | must be 0 — income lines are credit-only |
| `lines[].credit` | number | > 0 |

Server rejects unless every line is credit-only and `Σ credit > 0`.

## Response

`201`:

```json
{
  "data": {
    "id": 6, "number": "JM-2609-001", "date": "2026-09-03", "voucher": "BKM-2609-001",
    "description": "Penerimaan penjualan tunai & potong biaya transfer",
    "cash_account_id": 2, "cash_account_code": "1-1100", "cash_account_name": "Bank BCA",
    "department_id": 1, "department_code": "FIN", "department_name": "Finance",
    "cash_flow": "OPERASI_IN", "cash_flow_name": "Operasi In",
    "status": "submitted", "rejection_reason": null, "approved_by": null, "approved_at": null,
    "total": 5000000, "cash_in": 5000000,
    "lines": [
      { "account_id": 5, "account_code": "4-4000", "account_name": "Penjualan Produk", "debit": 0, "credit": 5000000 }
    ]
  },
  "message": "Jurnal pemasukan diajukan"
}
```

`number` (when blank), `total`, `cash_in` (always equal to `total`), and all
`*_code` / `*_name` labels are server-assigned. The balancing cash debit line is
implied by `cash_account_id` + `cash_in` and is not returned inside `lines`.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | a line has `debit` > 0 or `credit` ≤ 0 / `Σ credit` ≤ 0 / non-cash_bank `cash_account_id` / unknown ref | `{ "message": "...", "errors": { "lines": ["..."] } }` |
