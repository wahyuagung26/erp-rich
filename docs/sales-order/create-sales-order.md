---
type: API Endpoint
title: Create Sales Order
description: Add a new sales order. Server assigns the number and every computed amount.
method: POST
path: /sales-order
status: mock
tags: [sales-order, write]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-13T12:00:00Z
---

# Create Sales Order

Backs `views/sales-order/pages/PageSalesOrderTambah.vue`. Client-side validation: `views/sales-order/schema.ts` (valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "date": "2026-09-10",
  "customer_id": 4,
  "sales_id": 2,
  "department_id": 9,
  "top_days": 30,
  "pkp_active": true,
  "description": "Pesanan rutin bulanan",
  "discount_type": "percent",
  "discount_value": 5,
  "lines": [{ "variant_id": 1, "warehouse_id": 1, "quantity": 1, "price": 4200000, "discount": 200000, "notes": "" }],
  "expenses": [{ "sales_expense_id": 1, "notes": "Kirim ke gudang customer", "amount": 250000 }]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `customer_id` | number | required; active customer |
| `sales_id` | number | required; active Master Sales row |
| `department_id` | number | required; active department |
| `top_days` | number | required; one of `0, 7, 14, 21, 30, 60, 90, 120` |
| `pkp_active` | boolean | required; controls PPN |
| `description` | string | optional |
| `discount_type` | string | required; `nominal` or `percent` |
| `discount_value` | number | ≥ 0; `percent` → 0–100; `nominal` → not greater than the products subtotal |
| `lines` | array | at least one; each `variant_id` (active variant of a live product, see [list-product-variant](../product/list-product-variant.md); **unique per order**), `warehouse_id` (active warehouse), `quantity` (> 0), `price` (> 0), `discount` (≥ 0, ≤ `price`, per unit), `notes` (optional) |
| `expenses` | array | may be empty; each `sales_expense_id` (active Biaya Penjualan), `amount` (> 0), `notes` (optional) |

The client never sends `id`, `number`, `due_date`, status fields, resolved labels, the customer snapshot, or any computed amount.
The server stores the customer snapshot (`customer_name`, `customer_address`, `customer_phone`) and every amount at save.

## Response

`201`: `{ "data": { ...SalesOrder }, "message": "Sales order ditambahkan" }` — shape in [get-sales-order](./get-sales-order.md).
New orders are `pending` / `not_invoiced`.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | `date` in a closed period | `{ "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` |

Error keys: `date`, `customer_id`, `sales_id`, `department_id`, `top_days`, `pkp_active`, `discount_type`, `discount_value`, `lines`, `expenses`.

## Notes

A `date` in a closed period is refused ([conventions](../conventions.md#closing-period-lock-locked)), even though Sales Order moves no stock or journal.
