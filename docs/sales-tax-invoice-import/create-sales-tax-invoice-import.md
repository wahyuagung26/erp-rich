---
type: API Endpoint
title: Create Sales Tax Invoice Import
description: Apply a previewed import: set the faktur pajak on every matched / to-be-replaced document.
method: POST
path: /sales-tax-invoice-import
status: mock
tags: [sales-tax-invoice-import, write]
resource: /frontend/src/mocks/modules/sales-tax-invoice-import.ts
timestamp: 2026-11-06T18:00:00Z
---

# Create Sales Tax Invoice Import

Backs "Impor" in `PageSalesTaxInvoiceImport.vue`; the UI confirms first. Not subject to the closing-period lock.

## Request

### Body

```json
{ "token": "<TaxInvoiceImportPreview.token>" }
```

The server re-reads the previewed rows by `token` (it never trusts row data from the client) and re-checks each document: still `approved` + PKP, and the number is
not taken by another document. A row that no longer passes is counted in `skipped`. Each import writes `tax_invoice = { number, date, file: null }` (any old attachment is dropped).

## Response

`200`: `{ "data": { "imported": 2, "skipped": 3 }, "message": "2 faktur pajak berhasil diimpor" }` — each import writes a `Faktur Pajak Diimpor` history event on the document.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | unknown or already-used `token` | `{ "message": "Preview sudah kedaluwarsa, upload ulang file" }` |
