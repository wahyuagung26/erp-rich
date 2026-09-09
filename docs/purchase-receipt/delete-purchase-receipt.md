---
type: API Endpoint
title: Delete Purchase Receipt
description: Delete a purchase receipt that has not been invoiced.
method: DELETE
path: /purchase-receipt/:id
status: mock
tags: [purchase-receipt, write]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-09-09T12:00:00Z
---

# Delete Purchase Receipt

Backs the delete action in `views/purchase-receipt/pages/PagePurchaseReceiptTable.vue` and
`PagePurchaseReceiptDetail.vue`, both behind a confirm dialog.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseReceipt.id` |

## Response

`200`:

```json
{ "message": "Penerimaan pembelian dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Penerimaan pembelian tidak ditemukan" }` |
| `422` | receipt is already invoiced | `{ "message": "Penerimaan yang sudah dibuat invoice tidak boleh dihapus" }` |

## Notes

The mock performs a hard delete; it does not set a soft-delete timestamp.
