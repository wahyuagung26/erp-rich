---
type: API Endpoint
title: Update Purchase Order Approval Status
description: Change a purchase order approval status through a confirmed detail action.
method: PATCH
path: /purchase-order/:id/approval
status: mock
tags: [purchase-order, write]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Purchase Order Approval Status

Backs the approval actions in `views/purchase-order/pages/PagePurchaseOrderDetail.vue`.
The UI confirms before sending approve, reject, or resubmit actions.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

### Body

```json
{ "status": "approved" }
```

| Field | Type | Allowed values |
|---|---|---|
| `status` | string | `pending`, `approved`, `rejected` |

## Response

`200`: `{ "data": { ...PurchaseOrder }, "message": "Status persetujuan diperbarui" }`.
When approved, the mock sets `approved_by` and `approved_at`. When rejected, it sets
`rejection_reason`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | invalid status, or changing an approved PO to another status | `{ "message": "..." }` |

## Notes

`pending` is used by the UI to resubmit a rejected PO. An approved PO cannot be changed to
another approval status.
