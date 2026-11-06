---
type: API Endpoint
title: Delete Sales Order
description: Delete a sales order that is still writable.
method: DELETE
path: /sales-order/:id
status: mock
tags: [sales-order, write]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-06T15:00:00Z
---

# Delete Sales Order

Backs the delete action in `PageSalesOrderTable.vue` and `PageSalesOrderDetail.vue`, both behind a confirm dialog.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesOrder.id` |

## Response

`200`: `{ "message": "Sales order dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
| `422` | approved, or already has an invoice | `{ "message": "..." }` |

## Notes

Same write guard as [update-sales-order](./update-sales-order.md) (messages say "dihapus"). Hard delete; the history timeline is deleted with it. No closing-period check.
