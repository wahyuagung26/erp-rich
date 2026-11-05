---
type: API Endpoint
title: Get Purchase Invoice Tax Invoice
description: Read the current faktur pajak of a PKP invoice (always fresh, used to fill the shared modal).
method: GET
path: /purchase-invoice/:id/tax-invoice
status: mock
tags: [purchase-invoice, read, tax-invoice]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-06T01:00:00Z
---

# Get Purchase Invoice Tax Invoice

Backs the global `FakturPajakModal`: every time the modal opens it reads this endpoint instead of
trusting the list row, so it never shows a stale value (same as Legacy `faktur_pajak/get`). Follows the
shared contract described in [index](./index.md#faktur-pajak-modal-bersama).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

## Response

`200`:

```json
{
  "data": {
    "number": "010.000-26.00000001",
    "date": "2026-09-09",
    "file": { "name": "faktur.pdf", "type": "application/pdf", "size": 48213, "data_url": "data:application/pdf;base64,..." }
  }
}
```

`data` is `null` when no faktur pajak has been saved yet (the modal then opens in edit mode); `file`
is `null` when no attachment was uploaded.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
| `422` | invoice is non-PKP | `{ "message": "Invoice non-PKP tidak memiliki faktur pajak" }` |
