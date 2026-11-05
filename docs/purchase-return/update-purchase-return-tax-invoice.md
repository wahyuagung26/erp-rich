---
type: API Endpoint
title: Update Purchase Return Tax Invoice
description: Upsert the faktur pajak of an approved PKP return (shared modal contract).
method: PUT
path: /purchase-return/:id/tax-invoice
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Update Purchase Return Tax Invoice

Same body, rules and errors as [update-purchase-invoice-tax-invoice](../purchase-invoice/update-purchase-invoice-tax-invoice.md), plus:

| Status | When | Body |
|---|---|---|
| `422` | return is not `approved` | `{ "message": "Faktur pajak hanya bisa diisi untuk retur yang sudah disetujui" }` |
| `422` | `number` already used by another invoice or return | `{ "errors": { "number": ["Nomor faktur pajak sudah dipakai dokumen lain"] } }` |

## Response

`200`: `{ "data": { ...PurchaseReturn }, "message": "Faktur pajak disimpan" }`
