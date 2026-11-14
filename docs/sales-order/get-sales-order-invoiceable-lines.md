---
type: API Endpoint
title: Get Sales Order Invoiceable Lines
description: Lookup used by the Invoice Penjualan form — an approved, not yet invoiced sales order's header defaults plus all its lines.
method: GET
path: /sales-order/:id/invoiceable-lines
status: mock
tags: [sales-order, read, lookup]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-13T12:00:00Z
---

# Get Sales Order Invoiceable Lines

Backs the create-invoice form of [Invoice Penjualan](../sales-invoice/index.md) when the user picks a Sales Order (or arrives from the
detail page via `?sales_order_id=`). Caller: the Invoice Penjualan form (`/sales-invoice/tambah?sales_order_id=`) — this module only provides the endpoint. Modelled on
[get-purchase-order-receivable-lines](../purchase-receipt/get-purchase-order-receivable-lines.md).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesOrder.id` |

## Response

`200`:

```json
{
  "data": {
    "sales_order": {
      "id": 3,
      "number": "RIN.SO260910001",
      "date": "2026-09-10",
      "description": "Pesanan rutin bulanan",
      "customer_id": 4,
      "customer_code": "CUST-0004",
      "customer_name": "PT Cahaya Nusantara",
      "sales_id": 2,
      "sales_code": "SL02",
      "sales_name": "Siti Aminah",
      "department_id": 9,
      "department_code": "SLS",
      "department_name": "Sales",
      "pkp_active": true,
      "top_days": 30,
      "discount_type": "percent",
      "discount_value": 5,
      "expenses": [
        { "sales_expense_id": 1, "sales_expense_code": "BP01", "sales_expense_name": "Biaya Pengiriman", "notes": "Kirim ke gudang customer", "amount": 250000 }
      ]
    },
    "lines": [
      {
        "variant_id": 1,
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Kulkas 2 Pintu",
        "sku": "PRD001",
        "variant_label": "Standar",
        "brand_name": "Samsung",
        "unit_name": "Pieces",
        "quantity": 10,
        "price": 4200000,
        "discount": 200000,
        "warehouse_id": 1,
        "warehouse_code": "GD1",
        "warehouse_name": "Gudang Pusat",
        "notes": ""
      }
    ]
  }
}
```

The whole order becomes one invoice (1 SO ↔ 1 invoice): every line is returned with the ordered `quantity`, `price`, `discount`,
`warehouse_id` and `notes` to prefill; the user may still change them on the invoice. The header-level `discount_*` and `expenses` are prefill
only: the invoice stores its own copy, and the invoice server computes every amount.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
| `422` | order is not `approved` | `{ "message": "Sales order belum disetujui" }` |
| `422` | order already has a non-rejected invoice | `{ "message": "Sales order sudah dibuatkan invoice <nomor>" }` |
