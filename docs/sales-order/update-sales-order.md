---
type: API Endpoint
title: Update Sales Order
description: Edit an existing sales order while its write guard allows changes.
method: PUT
path: /sales-order/:id
status: mock
tags: [sales-order, write]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-06T15:00:00Z
---

# Update Sales Order

Backs `views/sales-order/pages/PageSalesOrderEdit.vue`. Full-object PUT — same body and rules as [create-sales-order](./create-sales-order.md).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesOrder.id` |

### Body

Same shape and rules as [create-sales-order](./create-sales-order.md).

## Response

`200`: `{ "data": { ...SalesOrder }, "message": "Sales order diperbarui" }`. `id`, `number`, `approval_status`, approval metadata and `created_by` are retained.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
| `422` | write guard | `{ "message": "..." }` (no `errors`) |
| `422` | body validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |

## Notes

Write guard: refused when `approval_status` is `approved` ("Sales order yang sudah disetujui tidak boleh diubah") or when any line has `invoiced_quantity > 0`
("Sales order yang sudah memiliki invoice tidak boleh diubah"). A rejected order can be edited and keeps `rejected` until it is resubmitted.
No closing-period check.
