---
type: API Endpoint
title: Get Sales Order
description: Fetch one sales order with resolved master data, per-line invoiced quantity and computed totals.
method: GET
path: /sales-order/:id
status: mock
tags: [sales-order, read]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-13T12:00:00Z
---

# Get Sales Order

Backs `PageSalesOrderDetail.vue` (read-only view), `PageSalesOrderEdit.vue` (loads the record into the form) and
`PageSalesOrderPrint.vue` (print view, A4 portrait; "DRAFT" watermark while `approval_status` is `pending`).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesOrder.id` |

## Response

`200`: `{ "data": { ...SalesOrder } }` — see the entity in [index](./index.md). Sales, department, warehouse, variant and expense display
fields and `customer_code` are resolved; `customer_name` / `customer_address` / `customer_phone` are the stored snapshot; every amount is
the stored value (never recomputed); `due_date`, `invoice_status`, `sales_invoice_*` and `locked` are computed.

```json
{
  "data": {
    "id": 3,
    "number": "RIN.SO260910001",
    "date": "2026-09-10",
    "top_days": 30,
    "due_date": "2026-10-10",
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
    "pkp_active": true,
    "description": "Pesanan rutin bulanan",
    "discount_type": "percent",
    "discount_value": 5,
    "discount_global": 200000,
    "approval_status": "approved",
    "invoice_status": "invoiced",
    "sales_invoice_id": 1,
    "sales_invoice_number": "RIN.INV260920/001",
    "locked": false,
    "approved_by": "Admin",
    "approved_at": "2026-09-10T09:30:00.000Z",
    "created_by": "Admin",
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
        "warehouse_id": 1,
        "warehouse_code": "GD1",
        "warehouse_name": "Gudang Pusat",
        "quantity": 1,
        "price": 4200000,
        "discount": 200000,
        "notes": "",
        "total": 4000000
      }
    ],
    "expenses": [
      { "sales_expense_id": 1, "sales_expense_code": "BP01", "sales_expense_name": "Biaya Pengiriman", "notes": "Kirim ke gudang customer", "amount": 250000 }
    ],
    "subtotal": 4000000,
    "dpp": 3800000,
    "ppn": 418000,
    "expense_total": 250000,
    "total": 4468000
  }
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |

## Notes

The detail page exposes actions by state: `pending` and not `locked` → Edit / Hapus / Setujui; `approved`, not invoiced and not `locked` →
Batalkan Persetujuan; `approved` and not invoiced → Buat Invoice (links to the Invoice Penjualan form with `?sales_order_id=<id>`);
`locked` → `ClosingBadge` instead of the write actions. An invoiced order links to its invoice.
