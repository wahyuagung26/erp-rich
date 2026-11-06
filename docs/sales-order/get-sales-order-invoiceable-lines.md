---
type: API Endpoint
title: Get Sales Order Invoiceable Lines
description: Lookup used by the Invoice Penjualan form — a sales order's header defaults plus per-product ordered/invoiced/remaining quantity.
method: GET
path: /sales-order/:id/invoiceable-lines
status: mock
tags: [sales-order, read, lookup]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-06T15:00:00Z
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
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Kulkas 2 Pintu",
        "brand_name": "Samsung",
        "unit_name": "Pieces",
        "ordered_quantity": 10,
        "invoiced_quantity": 4,
        "remaining_quantity": 6,
        "quantity": 0,
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

Every line starts with `quantity: 0` — the user fills in the quantity to invoice now (≤ `remaining_quantity`). `price`, `discount`, `warehouse_id` and
`notes` are the SO values to prefill. Lines with `remaining_quantity = 0` are still returned (the form may hide them). The header-level
`discount_*` and `expenses` are prefill only: the invoice stores its own copy, and the server of the invoice recomputes every amount.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
| `422` | order is not `approved` | `{ "message": "Sales order belum disetujui" }` |

## Notes

`invoiced_quantity` is the per-line counter described in [index](./index.md#catatan-lintas-modul-invoice-penjualan); the Invoice module maintains it
through `applyInvoicedQuantity` and must never let `invoiced_quantity` exceed `ordered_quantity`.
