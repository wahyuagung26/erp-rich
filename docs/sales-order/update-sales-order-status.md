---
type: API Endpoint
title: Update Sales Order Approval Status
description: Change a sales order approval status through a confirmed detail action.
method: PATCH
path: /sales-order/:id/approval
status: mock
tags: [sales-order, write]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-06T15:00:00Z
---

# Update Sales Order Approval Status

Backs the Setujui / Tolak / Ajukan Ulang actions in `PageSalesOrderDetail.vue`; the UI confirms first.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesOrder.id` |

### Body

```json
{ "status": "approved" }
```

| Field | Type | Allowed values |
|---|---|---|
| `status` | string | `pending`, `approved`, `rejected` |

## Response

`200`: `{ "data": { ...SalesOrder }, "message": "Status persetujuan diperbarui" }`. Approved → sets `approved_by` / `approved_at`; rejected → sets `rejection_reason`; pending → clears both.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
| `422` | invalid status, or changing an approved order to another status | `{ "message": "..." }` |

## Notes

`pending` is used to resubmit a rejected order. An approved order cannot be moved back (same rule as Order Pembelian). No closing-period check.
