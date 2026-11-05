---
type: API Endpoint
title: Update Purchase Receipt
description: Edit an existing purchase receipt while it is not yet invoiced.
method: PUT
path: /purchase-receipt/:id
status: mock
tags: [purchase-receipt, write]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-11-06T13:00:00Z
---

# Update Purchase Receipt

Backs `views/purchase-receipt/pages/PagePurchaseReceiptEdit.vue`. Full-object PUT (same body
and rules as [create-purchase-receipt](./create-purchase-receipt.md)). `purchase_order_id`
cannot be changed; the body's value is ignored and the existing one is kept.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseReceipt.id` |

### Body

Same shape and rules as [create-purchase-receipt](./create-purchase-receipt.md), except
`remaining_quantity` for the guard is computed excluding this receipt itself.

## Response

`200`: `{ "data": { ...PurchaseReceipt }, "message": "Penerimaan pembelian diperbarui" }`.
The existing `id`, `number`, `purchase_order_id`, and `created_by` are retained.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Penerimaan pembelian tidak ditemukan" }` |
| `422` | write guard or body validation failure | `{ "message": "...", "errors"?: { "<field>": ["..."] } }` |

## Notes

The mock rejects update when `invoice_status` is `invoiced`.

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, penerimaan pembelian tidak bisa diubah" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
