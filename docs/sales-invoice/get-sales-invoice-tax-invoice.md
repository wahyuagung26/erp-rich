---
type: API Endpoint
title: Get Sales Invoice Tax Invoice
description: Read the current faktur pajak of a PKP invoice (always fresh, used to fill the shared modal).
method: GET
path: /sales-invoice/:id/tax-invoice
status: mock
tags: [sales-invoice, read, tax-invoice]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T16:00:00Z
---

# Get Sales Invoice Tax Invoice

Backs the global `FakturPajakModal` (shared contract: [purchase-invoice index](../purchase-invoice/index.md#faktur-pajak-modal-bersama)).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

## Response

`200`: `{ "data": { "number": "010.000-26.00000001", "date": "2026-09-21", "file": { "name": "faktur.pdf", "type": "application/pdf", "size": 48213, "data_url": "data:application/pdf;base64,..." } } }` — `data` is `null` when none has been saved; `file` is `null` without attachment.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | invoice is non-PKP | `{ "message": "Invoice non-PKP tidak memiliki faktur pajak" }` |
