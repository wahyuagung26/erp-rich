---
type: API Endpoint
title: Update Sales Invoice
description: Edit an invoice that is not approved and not in a closed period.
method: PUT
path: /sales-invoice/:id
status: mock
tags: [sales-invoice, write]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T20:00:00Z
---

# Update Sales Invoice

Backs `PageSalesInvoiceEdit.vue`. Full-object PUT — same body and rules as [create-sales-invoice](./create-sales-invoice.md);
`sales_order_id` is **locked**: the server ignores the sent value and keeps the stored order.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

## Response

`200`: `{ "data": { ...SalesInvoice }, "message": "Invoice penjualan diperbarui" }`. `id`, `number`, `approval_status`, approval metadata, `tax_invoice` and
`created_by` are retained. `payments` replaces every `kind: creation` row (and its deposit usage); `kind: receivable` rows are untouched and count toward the
`total` check.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | approved | `{ "message": "Invoice yang sudah disetujui tidak boleh diubah" }` |
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, invoice penjualan tidak bisa diubah" }` when the record's `date` is in a closed period (`locked`);
moving `date` into a closed period gives the same `errors.date` as create ([conventions](../conventions.md#closing-period-lock-locked)).

## Side effects

Sales order quantity follows the change (`−1` old lines, `+1` new lines, skipped while the invoice is `rejected`); the quantity limit is
`ordered − invoiced by other invoices`. Deposit usage rows are rebuilt; the deposit gets a history event only for usage that is new.
