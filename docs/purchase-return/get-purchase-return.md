---
type: API Endpoint
title: Get Purchase Return
description: Fetch one purchase return with lines and settlements.
method: GET
path: /purchase-return/:id
status: mock
tags: [purchase-return, read]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Get Purchase Return

Backs `PagePurchaseReturnDetail.vue` and `PagePurchaseReturnEdit.vue`.

## Response

`200`: `{ "data": { ...PurchaseReturn } }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
