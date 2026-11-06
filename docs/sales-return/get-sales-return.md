---
type: API Endpoint
title: Get Sales Return
description: Fetch one sales return with lines and settlements.
method: GET
path: /sales-return/:id
status: mock
tags: [sales-return, read]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Get Sales Return

Backs `PageSalesReturnDetail.vue` and `PageSalesReturnEdit.vue` (and the print view `PageSalesReturnPrint.vue`).

## Response

`200`: `{ "data": { ...SalesReturn } }` — includes `locked`, `invoice_outstanding` and `settlements[].locked`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
