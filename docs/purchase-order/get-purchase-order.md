---
type: API Endpoint
title: Get Purchase Order
description: Fetch one purchase order with resolved master data and computed amounts.
method: GET
path: /purchase-order/:id
status: mock
tags: [purchase-order, read]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Get Purchase Order

Backs `views/purchase-order/pages/PagePurchaseOrderDetail.vue` (read-only view) and
`PagePurchaseOrderEdit.vue` (loads the record into the form).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

## Response

`200`: `{ "data": { ...PurchaseOrder } }` — response includes resolved supplier,
department, warehouse, and product display fields. `dpp`, `ppn`, `nett`, and `total` are
recomputed from lines and `pkp_active`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |

## Notes

The detail page exposes actions according to the current state:

- `pending`: approve or reject;
- `rejected`: resubmit as `pending`;
- `approved` and unlocked: lock;
- locked: unlock;
- writable PO: edit or delete.
