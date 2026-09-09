---
type: API Endpoint
title: Delete Purchase Order
description: Delete a purchase order that is still writable.
method: DELETE
path: /purchase-order/:id
status: mock
tags: [purchase-order, write]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Delete Purchase Order

Backs the delete action in `views/purchase-order/pages/PagePurchaseOrderTable.vue` and
`PagePurchaseOrderDetail.vue`, both behind a confirm dialog.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

## Response

`200`:

```json
{ "message": "Order pembelian dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | PO is approved or has a receipt | `{ "message": "..." }` |

## Notes

The mock performs a hard delete; it does not set a soft-delete timestamp. Deletion is
rejected when `approval_status` is `approved` or `delivery_status` is not `not_received`.
