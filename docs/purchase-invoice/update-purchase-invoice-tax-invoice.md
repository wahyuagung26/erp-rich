---
type: API Endpoint
title: Save Purchase Invoice Tax Invoice
description: Create or replace the faktur pajak of a PKP invoice (upsert).
method: PUT
path: /purchase-invoice/:id/tax-invoice
status: mock
tags: [purchase-invoice, write]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-06T01:00:00Z
---

# Save Purchase Invoice Tax Invoice

Backs the save action of the global `FakturPajakModal`, opened from the **Faktur Pajak** column of
`PagePurchaseInvoiceTable.vue` and the Faktur Pajak section of `PagePurchaseInvoiceDetail.vue`.
Allowed on both `pending` and `approved` invoices (it does not touch prices).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

### Body

```json
{
  "number": "010.000-26.00000001",
  "date": "2026-09-09",
  "file": { "name": "faktur.pdf", "type": "application/pdf", "size": 48213, "data_url": "data:application/pdf;base64,..." }
}
```

| Field | Type | Rules |
|---|---|---|
| `number` | string | required after trim; max 25 chars; unique across purchase invoices |
| `date` | string | required; `YYYY-MM-DD` |
| `file` | object \| null | optional lampiran (`name`, `type`, `size`, `data_url`); full replace — `null`/absent removes it. `type` must be `application/pdf`, `image/jpeg`, or `image/png`; `size` ≤ 5 MB |

## Response

`200`: `{ "data": { ...PurchaseInvoice }, "message": "Faktur pajak disimpan" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
| `422` | validation failure (incl. duplicate number, bad file type/size) | `{ "message": "Validasi gagal", "errors": { "number": ["Nomor faktur pajak sudah dipakai invoice lain"] } }` — field errors use `number`, `date`, or `file` |
| `422` | invoice is non-PKP | `{ "message": "Invoice non-PKP tidak memiliki faktur pajak" }` |
