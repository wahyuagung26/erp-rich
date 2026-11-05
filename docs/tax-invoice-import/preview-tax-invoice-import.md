---
type: API Endpoint
title: Preview Tax Invoice Import
description: Upload the exported Laporan Pajak file and get a per-row preview; nothing is saved.
method: POST
path: /tax-invoice-import/preview
status: mock
tags: [tax-invoice-import, write]
resource: /frontend/src/mocks/modules/tax-invoice-import.ts
timestamp: 2026-11-05T12:00:00Z
---

# Preview Tax Invoice Import

Backs "Upload & Preview" in `PageTaxInvoiceImport.vue`.

## Request

`multipart/form-data`:

| Field | Type | Rules |
|---|---|---|
| `source` | string | required; `purchase_invoice` \| `purchase_return` |
| `file` | file | required; `.xlsx` / `.xls` / `.csv`, max 10 MB |

## Response

`200`: `{ "data": { ...TaxInvoiceImportPreview } }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | bad `source`, missing / wrong-type / oversize `file`, or the file is not the expected Laporan Pajak export | `{ "message": "Validasi gagal", "errors": { "file": ["..."] } }` |
