---
type: API Endpoint
title: Create Tax Invoice Import
description: Apply a previewed import: set the faktur pajak on every matched / to-be-replaced row.
method: POST
path: /tax-invoice-import
status: mock
tags: [tax-invoice-import, write]
resource: /frontend/src/mocks/modules/tax-invoice-import.ts
timestamp: 2026-11-06T13:00:00Z
---

# Create Tax Invoice Import

Backs "Impor" in `PageTaxInvoiceImport.vue`; the UI confirms first.

## Request

### Body

```json
{ "token": "<TaxInvoiceImportPreview.token>" }
```

The server re-reads the previewed rows by `token` (it never trusts row data from the client).

## Response

`200`: `{ "data": { "imported": 2, "skipped": 3 }, "message": "2 faktur pajak berhasil diimpor" }` — each import writes a `Faktur Pajak Diimpor` history event on the document.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | unknown or already-used `token` | `{ "message": "Preview sudah kedaluwarsa, upload ulang file" }` |

Locked (closed-period) documents are skipped, so they count toward `skipped`.
