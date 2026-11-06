---
type: API Endpoint
title: Preview Sales Tax Invoice Import
description: Upload the exported Laporan Pajak file (sisi penjualan) and get a per-row preview; nothing is saved.
method: POST
path: /sales-tax-invoice-import/preview
status: mock
tags: [sales-tax-invoice-import, write]
resource: /frontend/src/mocks/modules/sales-tax-invoice-import.ts
timestamp: 2026-11-06T18:00:00Z
---

# Preview Sales Tax Invoice Import

Backs "Upload & Preview" in `PageSalesTaxInvoiceImport.vue`.

## Request

`multipart/form-data`:

| Field | Type | Rules |
|---|---|---|
| `source` | string | required; `sales_invoice` \| `sales_return` |
| `file` | file | required; `.xlsx` / `.xls` / `.csv`, max 10 MB |

## Response

`200`: `{ "data": { ...TaxInvoiceImportPreview } }` (see [index](./index.md)). Only `approved` + PKP documents match; an unknown, unapproved or non-PKP reference is `unmatched`.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | bad `source`, missing / wrong-type / oversize `file`, or the file is not the expected Laporan Pajak export | `{ "message": "Validasi gagal", "errors": { "file": ["..."] } }` |
