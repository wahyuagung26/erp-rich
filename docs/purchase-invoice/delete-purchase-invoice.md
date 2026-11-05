---
type: API Endpoint
title: Delete Purchase Invoice
description: Delete a pending invoice and release its source receipt.
method: DELETE
path: /purchase-invoice/:id
status: mock
tags: [purchase-invoice, write]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-06T12:00:00Z
---

# Delete Purchase Invoice

Backs the delete action in `PagePurchaseInvoiceTable.vue` and `PagePurchaseInvoiceDetail.vue`,
both behind a confirm dialog.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

## Response

`200`: `{ "message": "Invoice pembelian dihapus" }`

Side effect: the source receipt returns to `invoice_status: "not_invoiced"`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
| `422` | invoice already approved | `{ "message": "Invoice yang sudah disetujui tidak boleh dihapus" }` |

## Notes

The mock performs a hard delete; it does not set a soft-delete timestamp.

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, invoice pembelian tidak bisa dihapus" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).
