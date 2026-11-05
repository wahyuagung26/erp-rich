---
type: API Endpoint
title: Get Purchase Invoice Returnable Lines
description: Lines of an approved invoice with how much of each can still be returned.
method: GET
path: /purchase-invoice/:id/returnable-lines
status: mock
tags: [purchase-return, read]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Get Purchase Invoice Returnable Lines

Backs the invoice picker of the return form (`FormPurchaseReturn.vue`): after an invoice is picked, its products are loaded with `quantity = 0`.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `exclude_return_id` | number | no | on edit: ignore this return's own quantities when computing `quantity_returned_before` |

## Response

`200`:

```json
{
  "data": {
    "purchase_invoice": { "id": 1, "number": "BL-RICH/0001/09/2026", "date": "2026-09-08", "supplier_invoice_number": "INV-SUP-0102", "supplier_code": "SUP-0004", "supplier_name": "PT Cahaya Logistik", "department_code": "...", "department_name": "...", "pkp_active": true },
    "lines": [ { "product_id": 2, "quantity_purchased": 10, "quantity_returned_before": 3, "quantity": 0, "price": 800000, "dpp": 0, "ppn": 0, "total": 0 } ]
  }
}
```

`lines` are [`PurchaseReturnLine`](./index.md#entity-purchasereturnline) (resolved labels included).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | invoice not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
| `422` | invoice not `approved` | `{ "message": "Hanya invoice yang sudah disetujui yang bisa diretur" }` |
