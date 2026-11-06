---
type: API Endpoint
title: Save Sales Invoice Tax Invoice
description: Create or replace the faktur pajak of a PKP invoice (upsert).
method: PUT
path: /sales-invoice/:id/tax-invoice
status: mock
tags: [sales-invoice, write]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T16:00:00Z
---

# Save Sales Invoice Tax Invoice

Backs the save action of the global `FakturPajakModal`, opened from the **Faktur Pajak** column of `PageSalesInvoiceTable.vue` and the Faktur Pajak section of
`PageSalesInvoiceDetail.vue`. Allowed in **any** state — pending, approved, rejected, and in a closed period (it moves neither stock nor journal).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

### Body

```json
{ "number": "010.000-26.00000001", "date": "2026-09-21", "file": { "name": "faktur.pdf", "type": "application/pdf", "size": 48213, "data_url": "data:application/pdf;base64,..." } }
```

| Field | Type | Rules |
|---|---|---|
| `number` | string | required after trim; max 25 chars; unique across sales invoices |
| `date` | string | required; `YYYY-MM-DD` |
| `file` | object \| null | optional lampiran; full replace — `null`/absent removes it. `type` PDF / JPEG / PNG, `size` ≤ 5 MB |

## Response

`200`: `{ "data": { ...SalesInvoice }, "message": "Faktur pajak disimpan" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | validation failure (duplicate number, bad file) | `{ "message": "Validasi gagal", "errors": { "number": ["Nomor faktur pajak sudah dipakai invoice lain"] } }` — keys `number`, `date`, `file` |
| `422` | invoice is non-PKP | `{ "message": "Invoice non-PKP tidak memiliki faktur pajak" }` |
