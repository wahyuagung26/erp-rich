---
type: API Endpoint
title: Update Purchase Invoice
description: Edit a pending invoice's date, supplier invoice number, description, and line prices.
method: PUT
path: /purchase-invoice/:id
status: mock
tags: [purchase-invoice, write]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-05T23:30:00Z
---

# Update Purchase Invoice

Backs `PagePurchaseInvoiceEdit.vue`.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

### Body

Same shape and rules as [create-purchase-invoice](./create-purchase-invoice.md). `purchase_receipt_id`
is **locked** — the server ignores the sent value and keeps the stored receipt.

## Response

`200`: `{ "data": { ...PurchaseInvoice }, "message": "Invoice pembelian diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | invoice already approved | `{ "message": "Invoice yang sudah disetujui tidak boleh diubah" }` |
