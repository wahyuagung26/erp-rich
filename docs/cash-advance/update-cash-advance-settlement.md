---
type: API Endpoint
title: Update Cash Advance Settlement
description: Edit a settlement/usage record against an approved operational cash advance.
method: PUT
path: /cash-advance/:id/settlement/:settlementId
status: mock
tags: [cash-advance, settlement, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-11-05T16:00:00Z
---

# Update Cash Advance Settlement

Same body as [Create Cash Advance Settlement](./create-cash-advance-settlement.md).
Only allowed while the parent advance's `status` is `approved`. The total (`amount`) cap
excludes this row's own current amount (so re-saving the same amount always
passes). The parent `CashAdvance.used`/`remaining` are recomputed after the edit.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | the owning `CashAdvance` id |
| `settlementId` | number | the `CashAdvanceSettlement` id |

### Body

```json
{
  "date": "2026-08-10",
  "description": "Pembelian ATK kantor (revisi)",
  "attachments": [{ "name": "kwitansi-revisi.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }],
  "lines": [
    { "account_id": 2, "department_id": 1, "cash_flow": "OPERASI_OUT", "detail_description": "Pembelian ATK", "debit": 450000, "credit": 0 }
  ]
}
```

## Response

`200`: `{ "data": CashAdvanceSettlement, "message": "Penyelesaian uang muka diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | `id`/`settlementId` do not match | `{ "message": "..." }` |
| `422` | advance not `approved`, invalid date, invalid line, total not `> 0`, total exceeds remaining, or missing attachments | `{ "message": "...", "errors": { "lines": ["..."] } }` |
