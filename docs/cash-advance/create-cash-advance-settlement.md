---
type: API Endpoint
title: Create Cash Advance Settlement
description: Record a settlement/usage against an approved operational cash advance.
method: POST
path: /cash-advance/:id/settlement
status: mock
tags: [cash-advance, settlement, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T12:00:00Z
---

# Create Cash Advance Settlement

Backs the "Tambah Penyelesaian" action on `PageCashAdvanceDetail.vue` /
`PageCashAdvanceEdit.vue`. Only available (and only accepted server-side) while the
parent advance's `status` is `approved` and its `remaining` is `> 0`. On success the
parent `CashAdvance.used`/`remaining` are recomputed from the sum of all its
settlement rows.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | the owning `CashAdvance` id |

### Body

```json
{
  "date": "2026-08-10",
  "amount": 500000,
  "attachment": { "name": "kwitansi.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `amount` | number | required; `> 0`; `<=` the advance's current `remaining` |
| `attachment` | object | required; one PDF/JPG/JPEG/PNG, max 5 MB |

## Response

`201`:

```json
{
  "data": {
    "id": 6, "cash_advance_id": 2, "number": "PU-2609-001", "date": "2026-08-10",
    "amount": 500000, "remaining_after": 100000,
    "attachment": { "name": "kwitansi.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
  },
  "message": "Penyelesaian uang muka ditambahkan"
}
```

The frontend re-fetches [get-cash-advance](./get-cash-advance.md) and
[list-cash-advance-settlement](./list-cash-advance-settlement.md) afterward to
refresh `used`/`remaining` and the history table.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | `id` does not match a `CashAdvance` | `{ "message": "Uang muka operasional tidak ditemukan" }` |
| `422` | advance not `approved`, invalid date, invalid amount, amount exceeds remaining, or missing attachment | `{ "message": "...", "errors": { "amount": ["..."] } }` |
