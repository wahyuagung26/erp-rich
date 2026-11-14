---
type: API Endpoint
title: Delete Sales Invoice
description: Delete an invoice that is not approved and not in a closed period.
method: DELETE
path: /sales-invoice/:id
status: mock
tags: [sales-invoice, write]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T16:00:00Z
---

# Delete Sales Invoice

Backs the delete action in `PageSalesInvoiceTable.vue` and `PageSalesInvoiceDetail.vue`, both behind a confirm dialog.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

## Response

`200`: `{ "message": "Invoice penjualan dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | approved | `{ "message": "Invoice yang sudah disetujui tidak boleh dihapus" }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, invoice penjualan tidak bisa dihapus" }` when `locked` ([conventions](../conventions.md#closing-period-lock-locked)).

## Notes

Hard delete; history is deleted with it. Side effects: the source Sales Order quantity is released (`applyInvoicedQuantity(…, −1, number)` unless the invoice was
`rejected`), the payments and the deposit usage rows are removed, and each used deposit gets a history event "Pemakaian Invoice Dibatalkan".
