---
type: API Endpoint
title: Get Purchase Order Receivable Lines
description: Lookup used by the create-receipt form — a PO's reference info plus per-product ordered/received/remaining quantity.
method: GET
path: /purchase-order/:id/receivable-lines
status: mock
tags: [purchase-receipt, read, lookup]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-09-09T12:00:00Z
---

# Get Purchase Order Receivable Lines

Backs `views/purchase-receipt/composables/usePurchaseReceiptOrder.ts`, fired from
`FormPurchaseReceipt.vue` when the user picks an `Order Pembelian` on a **new** receipt.
`purchase_order_id` cannot be changed once a receipt exists (see
[update-purchase-receipt](./update-purchase-receipt.md)), so the edit form never calls this
— it loads its lines straight from [get-purchase-receipt](./get-purchase-receipt.md), whose
`received_quantity`/`remaining_quantity` already exclude that receipt itself.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

## Response

`200`:

```json
{
  "data": {
    "purchase_order": {
      "id": 2,
      "number": "PO-RICH/0002/09/2026",
      "date": "2026-09-05",
      "description": "Contoh PO supplier PKP",
      "supplier_code": "SUP007",
      "supplier_name": "Supplier PKP Contoh",
      "department_id": 10,
      "warehouse_id": 1
    },
    "lines": [
      {
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Produk Contoh",
        "brand_code": "MRK001",
        "brand_name": "Merk Contoh",
        "unit_name": "Pieces",
        "ordered_quantity": 100,
        "received_quantity": 40,
        "remaining_quantity": 60,
        "quantity": 0,
        "warehouse_id": 1,
        "warehouse_code": "GD1",
        "warehouse_name": "Gudang Pusat"
      }
    ]
  }
}
```

Every line starts with `quantity: 0` and `warehouse_id` defaulted to the PO's own
`warehouse_id` — the user fills in `quantity` per line the form is meant to receive today.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | PO is not `approved` | `{ "message": "Order pembelian belum disetujui" }` |

## Notes

`received_quantity` sums every existing [purchase-receipt](./index.md) line against this PO
and product; `remaining_quantity` is `ordered_quantity - received_quantity`, minimum 0.
