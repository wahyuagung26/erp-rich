---
type: API Endpoint
title: Get Purchase Receipt
description: Fetch one purchase receipt with resolved PO/master data and per-line quantity breakdown.
method: GET
path: /purchase-receipt/:id
status: mock
tags: [purchase-receipt, read]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-11-05T14:00:00Z
---

# Get Purchase Receipt

Backs `views/purchase-receipt/pages/PagePurchaseReceiptDetail.vue` (read-only view) and
`PagePurchaseReceiptEdit.vue` (loads the record into the form) and
`PagePurchaseReceiptPrint.vue` (print view, A4 portrait; prints only lines with `quantity` > 0).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseReceipt.id` |

## Response

`200`: `{ "data": { ...PurchaseReceipt } }` — response includes resolved PO, supplier,
department, and line-level product/warehouse display fields. `received_quantity` and
`remaining_quantity` on each line exclude this receipt itself (see
[get-purchase-order-receivable-lines](./get-purchase-order-receivable-lines.md)).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Penerimaan pembelian tidak ditemukan" }` |

## Notes

The detail page shows Edit/Hapus only while `invoice_status` is `not_invoiced`.
