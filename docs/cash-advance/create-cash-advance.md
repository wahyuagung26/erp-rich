---
type: API Endpoint
title: Create Cash Advance
description: Create an operational cash advance and submit it for approval.
method: POST
path: /cash-advance
status: mock
tags: [cash-advance, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Create Cash Advance

Backs `views/cash-advance/components/FormCashAdvance.vue`. `number` is always
server-assigned. `used` starts at `0`; `remaining` is `amount`. A new entry is
submitted for approval immediately.

## Request

### Body

```json
{
  "date": "2026-09-08",
  "department_id": 1,
  "recipient": "Budi Santoso",
  "description": "Uang muka perjalanan dinas Surabaya",
  "amount": 3000000,
  "cash_account_id": 1,
  "advance_account_id": 11,
  "cash_flow": "OPERASI_OUT",
  "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `department_id` | number | required; active [`Department`](../department/index.md) |
| `recipient` | string | required |
| `description` | string | optional |
| `amount` | number | required; `> 0` |
| `cash_account_id` | number | required; must be a non-deleted `cash_bank` [`Account`](../account/index.md) |
| `advance_account_id` | number | required; must be a non-deleted `asset` [`Account`](../account/index.md) |
| `cash_flow` | string \| null | optional; must exist in [`CashFlow`](../cash-flow/index.md) when sent |
| `attachment` | object | required; one PDF/JPG/JPEG/PNG, max 5 MB |

## Response

`201`:

```json
{
  "data": {
    "id": 6, "number": "UM-2609-001", "date": "2026-09-08",
    "department_id": 1, "department_code": "FIN", "department_name": "Finance",
    "recipient": "Budi Santoso", "description": "Uang muka perjalanan dinas Surabaya",
    "amount": 3000000, "used": 0, "remaining": 3000000,
    "cash_account_id": 1, "cash_account_code": "1000101", "cash_account_name": "Kas Kecil",
    "advance_account_id": 11, "advance_account_code": "1000106", "advance_account_name": "Uang Muka Operasional",
    "cash_flow": "OPERASI_OUT", "cash_flow_name": "Operasi Out",
    "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." },
    "status": "submitted", "rejection_reason": null, "approved_by": null, "approved_at": null
  },
  "message": "Uang muka operasional diajukan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | invalid amount / bad refs / missing attachment | `{ "message": "...", "errors": { "amount": ["..."] } }` |
