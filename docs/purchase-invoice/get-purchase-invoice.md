---
type: API Endpoint
title: Get Purchase Invoice
description: Fetch one purchase invoice with resolved references and computed amounts.
method: GET
path: /purchase-invoice/:id
status: mock
tags: [purchase-invoice, read]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-05T23:30:00Z
---

# Get Purchase Invoice

Backs `PagePurchaseInvoiceDetail.vue` (read-only view), `PagePurchaseInvoiceEdit.vue` (loads the
record into the form) and `PagePurchaseInvoicePrint.vue` (print view, A4 portrait; shows a
"DRAFT" watermark while `approval_status` is `pending`).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

## Response

`200`: `{ "data": {
    "id": 1,
    "number": "BL-RICH/0001/09/2026",
    "date": "2026-09-08",
    "purchase_receipt_id": 1,
    "purchase_receipt_number": "BM-RICH/0001/09/2026",
    "purchase_order_id": 2,
    "purchase_order_number": "PO-RICH/0002/09/2026",
    "supplier_id": 7,
    "supplier_code": "RC00001",
    "supplier_name": "PT Rahadhyan Integrasi Nusantara",
    "department_id": 10,
    "department_code": "PRD",
    "department_name": "Produksi",
    "supplier_invoice_number": "INV-SUP-2026-001",
    "description": "Tagihan penerimaan sebagian PO",
    "pkp_active": true,
    "approval_status": "pending",
    "approved_by": null,
    "approved_at": null,
    "kontrabon_number": null,
    "tax_invoice": null,
    "created_by": "Admin",
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
    ],
    "dpp": 15000000,
    "ppn": 1650000,
    "total": 16650000
  } }`

`dpp`, `ppn`, and `total` are recomputed from `lines` and `pkp_active`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
