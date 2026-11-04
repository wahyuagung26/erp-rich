---
type: API Endpoint
title: List Cash Advance Settlement
description: History of settlement/usage records against one operational cash advance.
method: GET
path: /cash-advance/:id/settlement
status: mock
tags: [cash-advance, settlement, read, list]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-11-05T16:00:00Z
---

# List Cash Advance Settlement

Backs the "Riwayat Penyelesaian" table on `views/cash-advance/pages/PageCashAdvanceDetail.vue`
and `PageCashAdvanceEdit.vue`. Bounded to one parent advance (at most a handful of
rows in practice), so unlike other list endpoints in this bundle it returns a plain
array under `data` with **no pagination `meta`**.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | the owning `CashAdvance` id |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "cash_advance_id": 2, "number": "PU-2608-001", "date": "2026-08-10",
      "description": "Pembelian ATK kantor",
      "attachments": [{ "name": "kwitansi.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }],
      "lines": [
        { "account_id": 2, "account_code": "6000101", "account_name": "Beban Gaji Pokok", "department_id": 1, "department_code": "FIN", "department_name": "Finance", "cash_flow": "OPERASI_OUT", "cash_flow_name": "Operasi Out", "detail_description": "Pembelian ATK", "debit": 500000, "credit": 0 }
      ],
      "amount": 500000, "remaining_after": 1000000
    }
  ]
}
```

Rows are ordered by `date` then `id` ascending, oldest first.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | `id` does not match a `CashAdvance` | `{ "message": "Uang muka operasional tidak ditemukan" }` |
