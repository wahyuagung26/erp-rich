---
type: API Endpoint
title: Delete Purchase Return Settlement
description: Cancel a cash / bank refund.
method: DELETE
path: /purchase-return/:id/settlements/:settlementId
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Delete Purchase Return Settlement

Backs the delete icon on `cash_bank` rows of the settlement table in `PagePurchaseReturnDetail.vue`.

## Response

`200`: `{ "data": { ...PurchaseReturn }, "message": "Pengembalian dana dibatalkan" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | return or settlement not found | `{ "message": "..." }` |
| `422` | settlement is `payable_deduction` | `{ "message": "Pemakaian untuk potong hutang dibatalkan lewat menu Hutang Supplier" }` |
