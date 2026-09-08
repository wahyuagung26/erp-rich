---
type: API Endpoint
title: Update Purchase Order Lock
description: Lock or unlock a purchase order through a confirmed detail action.
method: PATCH
path: /purchase-order/:id/lock
status: mock
tags: [purchase-order, write]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Purchase Order Lock

Backs the lock actions in `views/purchase-order/pages/PagePurchaseOrderDetail.vue`.
The UI confirms before sending the request.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

### Body

```json
{ "locked": true }
```

| Field | Type | Rules |
|---|---|---|
| `locked` | boolean | `true` to lock, `false` to unlock |

## Response

`200`: `{ "data": { ...PurchaseOrder }, "message": "PO dikunci" }`.
When `locked` is false, the message is `Kunci PO dibuka` and `lock_reason` is null. When
locked, the mock sets `lock_reason` to its explicit lock message.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | locking a PO that is not approved | `{ "message": "PO harus disetujui sebelum dikunci" }` |

## Notes

The mock requires approval when `locked` is true. Unlocking is sent as a separate action
when the PO is locked.
