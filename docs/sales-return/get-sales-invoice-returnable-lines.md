---
type: API Endpoint
title: Get Sales Invoice Returnable Lines
description: Lines of an approved sales invoice with how much of each can still be returned.
method: GET
path: /sales-invoice/:id/returnable-lines
status: mock
tags: [sales-return, read]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Get Sales Invoice Returnable Lines

Owned by Retur Penjualan (handler lives in `mocks/modules/sales-return.ts`). Backs the invoice picker of the return form (`FormSalesReturn.vue`): after an invoice is picked, its products are loaded with `quantity = 0`.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `exclude_return_id` | number | no | on edit: ignore this return's own quantities when computing `quantity_returned_before` |

## Response

`200`:

```json
{
  "data": {
    "sales_invoice": { "id": 1, "number": "RIN.INV260920/001", "date": "2026-09-20", "customer_id": 4, "customer_code": "CUST-0004", "customer_name": "...", "department_code": "...", "department_name": "...", "pkp_active": true, "outstanding": 8122000 },
    "lines": [ { "product_id": 1, "quantity_sold": 4, "quantity_returned_before": 1, "quantity": 0, "price": 4200000, "discount": 200000, "dpp": 0, "ppn": 0, "total": 0 } ]
  }
}
```

`lines` are [`SalesReturnLine`](./index.md#entity-salesreturnline) (resolved labels included). `quantity_returned_before` counts returns that are not `rejected`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | invoice not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | invoice not `approved` | `{ "message": "Hanya invoice yang sudah disetujui yang bisa diretur" }` |
