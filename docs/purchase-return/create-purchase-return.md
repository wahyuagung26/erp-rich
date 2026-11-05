---
type: API Endpoint
title: Create Purchase Return
description: Add a purchase return against an approved invoice; starts `pending`.
method: POST
path: /purchase-return
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Create Purchase Return

Backs `PagePurchaseReturnTambah.vue`. Client validation: `views/purchase-return/schema.ts`; the backend must re-validate.

## Request

### Body

```json
{
  "purchase_invoice_id": 1,
  "date": "2026-09-12",
  "warehouse_id": 1,
  "reason": "Barang rusak saat diterima",
  "lines": [ { "product_id": 2, "quantity": 2 } ]
}
```

| Field | Type | Rules |
|---|---|---|
| `purchase_invoice_id` | number | required; invoice must be `approved` |
| `date` | string | required; `YYYY-MM-DD`; not after today, not before the invoice date |
| `warehouse_id` | number | required; existing warehouse |
| `reason` | string | required; max 250 |
| `lines[].product_id` | number | must belong to the invoice; unique |
| `lines[].quantity` | number | `≥ 0` and `≤ quantity_purchased − quantity_returned_before`; lines with `0` are dropped; at least one line `> 0` |

`price`, amounts and labels are never accepted from the client.

## Response

`201`: `{ "data": { ...PurchaseReturn }, "message": "Retur pembelian ditambahkan" }` — `approval_status: pending`, `number` `RB-RICH/<seq>/<MM>/<YYYY>`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
| `422` | validation (`purchase_invoice_id`, `date`, `warehouse_id`, `reason`, `lines`) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
