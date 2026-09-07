---
type: API Endpoint
title: Create Journal Expense
description: Create a cash disbursement journal and submit it for approval.
method: POST
path: /journal-expense
status: mock
tags: [journal, expense, write]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-09-07T17:00:00Z
---

# Create Journal Expense

Backs `views/journal-expense/components/FormJournalExpense.vue`. The user picks the
header cash/bank account and enters expense lines (plus optional potongan on the
credit side); the server appends the balancing cash credit line. A new entry is
submitted for approval immediately.

## Request

### Body

```json
{
  "number": "",
  "date": "2026-09-03",
  "voucher": "BKK-2609-001",
  "description": "Pembayaran gaji & PPh 21 September",
  "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 12345, "data_url": "data:application/pdf;base64,..." },
  "cash_account_id": 2,
  "department_id": 1,
  "cash_flow": "OPERASI_OUT",
  "lines": [
    { "account_id": 14, "department_id": null, "detail_description": "Gaji pokok", "debit": 10000000, "credit": 0 },
    { "account_id": 7, "department_id": null, "detail_description": "Potongan PPh 21", "debit": 0, "credit": 500000 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `number` | string | no; blank means server-generated (`JK-YYMM-NNN`) |
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
| `lines[].debit` / `.credit` | number | ≥ 0; exactly one > 0 per line |

Server rejects unless `Σ debit − Σ credit > 0` (net cash out must be positive).

## Response

`201`:

```json
{
  "data": {
    "id": 6, "number": "JK-2609-001", "date": "2026-09-03", "voucher": "BKK-2609-001",
    "description": "Pembayaran gaji & PPh 21 September",
    "cash_account_id": 2, "cash_account_code": "1-1100", "cash_account_name": "Bank BCA",
    "department_id": 1, "department_code": "FIN", "department_name": "Finance",
    "cash_flow": "OPERASI_OUT", "cash_flow_name": "Operasi — Keluar",
    "status": "submitted", "rejection_reason": null, "approved_by": null, "approved_at": null,
    "total": 10000000, "cash_out": 9500000,
    "lines": [
      { "account_id": 14, "account_code": "6-6000", "account_name": "Beban Gaji", "debit": 10000000, "credit": 0 },
      { "account_id": 7, "account_code": "2-2100", "account_name": "Utang PPh 21", "debit": 0, "credit": 500000 }
    ]
  },
  "message": "Jurnal pengeluaran diajukan"
}
```

`number` (when blank), `total`, `cash_out`, and all `*_code` / `*_name` labels are
server-assigned. The balancing cash credit line is implied by `cash_account_id` +
`cash_out` and is not returned inside `lines`.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | net cash out ≤ 0 / bad line / non-cash_bank `cash_account_id` / unknown ref | `{ "message": "...", "errors": { "lines": ["..."] } }` |
