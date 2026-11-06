---
type: API Endpoint
title: Get Sales Invoice
description: Fetch one sales invoice with resolved master data, computed totals, payments and paid / outstanding amounts.
method: GET
path: /sales-invoice/:id
status: mock
tags: [sales-invoice, read]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T20:00:00Z
---

# Get Sales Invoice

Backs `PageSalesInvoiceDetail.vue`, `PageSalesInvoiceEdit.vue` (loads the record into the form) and `PageSalesInvoicePrint.vue` (A4 portrait; "DRAFT"
watermark while `approval_status` is `pending`). Also the read model for Surat Jalan / Retur Penjualan / Piutang Customer
([index](./index.md#kontrak-untuk-modul-berikutnya)).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

## Response

`200`: `{ "data": { ...SalesInvoice } }` — entity in [index](./index.md). Every display field, amount, `paid_total`, `outstanding`, `payment_status`, `locked`
and each line's `max_quantity` are recomputed.

```json
{ "data": {
    "id": 1,
    "number": "RIN.INV260920/001",
    "date": "2026-09-20",
    "due_date": "2026-10-20",
    "top_days": 30,
    "locked": false,
    "customer_id": 4,
    "customer_code": "CUST-0004",
    "customer_name": "PT Cahaya Nusantara",
    "customer_address": "Jl. Rungkut Industri III No. 7",
    "customer_phone": "031-8471200",
    "sales_id": 2,
    "sales_code": "SL02",
    "sales_name": "Siti Aminah",
    "department_id": 9,
    "department_code": "SLS",
    "department_name": "Sales",
    "sales_order_id": 3,
    "sales_order_number": "RIN.SO260910001",
    "pkp_active": true,
    "description": "Pengiriman tahap pertama",
    "discount_type": "percent",
    "discount_value": 5,
    "discount_global": 800000,
    "approval_status": "approved",
    "rejection_reason": null,
    "approved_by": "Admin",
    "approved_at": "2026-09-20T09:30:00.000Z",
    "tax_invoice": null,
    "created_by": "Admin",
    "lines": [
      {
        "product_id": 1, "product_code": "PRD001", "product_name": "Kulkas 2 Pintu", "brand_name": "Samsung", "unit_name": "Pieces",
        "warehouse_id": 1, "warehouse_code": "GD1", "warehouse_name": "Gudang Pusat",
        "quantity": 4, "price": 4200000, "discount": 200000, "notes": "", "total": 16000000, "max_quantity": 10
      }
    ],
    "expenses": [
      { "sales_expense_id": 1, "sales_expense_code": "BP01", "sales_expense_name": "Biaya Pengiriman", "notes": "", "amount": 250000 }
    ],
    "subtotal": 16000000,
    "dpp": 15200000,
    "ppn": 1672000,
    "expense_total": 250000,
    "total": 17122000,
    "payments": [
      {
        "id": 1, "invoice_id": 1, "date": "2026-09-20", "payment_type_id": 1, "payment_type": "Tunai", "method": "cash_bank",
        "reference": "", "amount": 5000000, "kind": "creation"
      },
      {
        "id": 2, "invoice_id": 1, "date": "2026-09-20", "payment_type_id": -1, "payment_type": "Biaya", "method": "expense",
        "reference": "Ongkos Kirim", "amount": 150000, "kind": "creation", "sales_expense_id": 1
      }
    ],
    "paid_total": 5000000,
    "outstanding": 12122000,
    "payment_status": "partial"
  } }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
