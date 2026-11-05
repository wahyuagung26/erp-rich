---
type: API Endpoint
title: Get Purchase Receipt Invoiceable Lines
description: Lookup of a receipt's reference info and received lines with default prices, used to seed the invoice form.
method: GET
path: /purchase-receipt/:id/invoiceable-lines
status: mock
tags: [purchase-invoice, read, lookup]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-05T23:30:00Z
---

# Get Purchase Receipt Invoiceable Lines

Backs the receipt picker of `FormPurchaseInvoice.vue`: choosing a receipt calls this to fill the
reference section, PKP status, and product lines.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseReceipt.id` |

## Response

`200`:

```json
{
  "data": {
    "purchase_receipt": {
      "id": 1,
      "number": "BM-RICH/0001/09/2026",
      "date": "2026-09-06",
      "delivery_note_number": "SJ-2026-0091",
      "department_id": 10,
      "department_code": "PRD",
      "department_name": "Produksi",
      "purchase_order_number": "PO-RICH/0002/09/2026",
      "supplier_code": "RC00001",
      "supplier_name": "PT Rahadhyan Integrasi Nusantara",
      "pkp_active": true
    },
    "lines": [
      {
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Kulkas 2 Pintu",
        "brand_name": "Samsung",
        "unit_name": "Pieces",
        "quantity": 40,
        "price": 375000,
        "dpp": 15000000,
        "ppn": 1650000,
        "total": 16650000
      }
    ]
  }
}
```

`lines` holds only products received on the receipt (`quantity > 0`). `price` is the default
(net PO price); `dpp`/`ppn`/`total` are computed from it.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | receipt not found | `{ "message": "Penerimaan pembelian tidak ditemukan" }` |
| `422` | receipt already invoiced | `{ "message": "Penerimaan sudah dibuat invoice" }` |
