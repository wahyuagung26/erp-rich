---
type: API Endpoint
title: Update Purchase Order
description: Edit an existing purchase order while its write guard allows changes.
method: PUT
path: /purchase-order/:id
status: mock
tags: [purchase-order, write]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Purchase Order

Backs `views/purchase-order/pages/PagePurchaseOrderEdit.vue`. Full-object PUT (same body
and rules as [create-purchase-order](./create-purchase-order.md)).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

### Body

Same shape and rules as [create-purchase-order](./create-purchase-order.md). `id`, `number`,
status fields, resolved labels, and computed amounts are ignored/not accepted as request
fields.

## Response

`200`: `{ "data": { ...PurchaseOrder }, "message": "Order pembelian diperbarui" }`.
The existing `id` and `number` are retained, and the current approval status is preserved.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | write guard or body validation failure | `{ "message": "...", "errors"?: { "<field>": ["..."] } }` |

## Notes

The mock rejects update when `approval_status` is `approved` or `delivery_status` is not
`not_received`. A validation `422` may include field errors;
a guard error contains only `message`.
