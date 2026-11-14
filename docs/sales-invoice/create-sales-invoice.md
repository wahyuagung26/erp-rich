---
type: API Endpoint
title: Create Sales Invoice
description: Add an invoice (from a Sales Order or standalone). Server assigns the number and every computed amount, records creation-time payments.
method: POST
path: /sales-invoice
status: mock
tags: [sales-invoice, write]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T20:00:00Z
---

# Create Sales Invoice

Backs `PageSalesInvoiceTambah.vue`. Client validation: `views/sales-invoice/schema.ts` (valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "sales_order_id": 3,
  "date": "2026-09-20",
  "customer_id": 4,
  "sales_id": 2,
  "department_id": 9,
  "top_days": 30,
  "pkp_active": true,
  "description": "Pengiriman tahap pertama",
  "discount_type": "percent",
  "discount_value": 5,
  "lines": [{ "product_id": 1, "warehouse_id": 1, "quantity": 4, "price": 4200000, "discount": 200000, "notes": "" }],
  "expenses": [{ "sales_expense_id": 1, "notes": "", "amount": 250000 }],
  "payments": [
    { "payment_type_id": 1, "reference": "", "amount": 5000000, "deposit_id": null },
    { "payment_type_id": 2, "reference": "", "amount": 2000000, "deposit_id": 1 },
    { "payment_type_id": -1, "reference": "", "amount": 150000, "deposit_id": null, "sales_expense_id": 1 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `sales_order_id` | number \| null | optional; must be an `approved` [Sales Order](../sales-order/index.md). `customer_id` must equal the order's customer; every line product must be on the order |
| `date` | string | required; `YYYY-MM-DD`; not in a closed period |
| `customer_id` `sales_id` `department_id` | number | required; active master rows |
| `top_days` | number | one of `0, 7, 14, 21, 30, 60, 90, 120` |
| `pkp_active` | boolean | required |
| `description` | string | optional |
| `discount_type` `discount_value` | — | same rules as [create-sales-order](../sales-order/create-sales-order.md) |
| `lines` | array | at least one; `product_id` (unique), `warehouse_id`, `quantity` (> 0; with an order: ≤ remaining on the order), `price` (> 0), `discount` (≥ 0, ≤ `price`, per unit), `notes` |
| `expenses` | array | may be empty; `sales_expense_id`, `amount` (> 0), `notes` |
| `payments` | array | may be empty; `payment_type_id` (a `sale` type with `method` `cash_bank` or `down_payment`, or the hard-coded **Biaya** `-1`), `amount` (> 0), `reference` (optional; ignored for Titipan / Biaya), `deposit_id` (required for `down_payment`, else must be `null`), `sales_expense_id` (required for Biaya = an active [Biaya Penjualan](../sales-expense/index.md), else omitted) |

Payments: the sum of `amount` must not exceed the invoice `total`; a `deposit_id` must belong to `customer_id` and the amount may not exceed that
deposit's `remaining` (summed per deposit). **Biaya** (decision 2026-10-14, same as [Piutang Customer](../customer-receivable/index.md)) is not cash / bank: it only reduces `outstanding`, stores `method: "expense"`, `sales_expense_id` and `reference` = the expense name, and counts toward the same `total` ceiling. The client never sends `id`, `number`, `due_date`, status fields, labels, `kind`, or any computed amount.

## Response

`201`: `{ "data": { ...SalesInvoice }, "message": "Invoice penjualan ditambahkan" }` — shape in [get-sales-invoice](./get-sales-invoice.md).
New invoices are `pending`; each payment becomes a `kind: creation` row dated at the invoice `date`.

## Side effects

- With `sales_order_id`: `applyInvoicedQuantity(orderId, lines, 1, number)` (sales order `invoiced_quantity` + history "Invoice Dibuat").
- Each `down_payment` payment adds a `CustomerDepositUsage` row ([contract](../customer-deposit/index.md#contract-for-invoice-penjualan)) and a
  "Dipakai di Invoice Penjualan" event on the deposit.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | `date` in a closed period | `{ "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` |

Error keys: `sales_order_id`, `date`, `customer_id`, `sales_id`, `department_id`, `top_days`, `pkp_active`, `discount_type`, `discount_value`, `lines`, `expenses`, `payments`.
