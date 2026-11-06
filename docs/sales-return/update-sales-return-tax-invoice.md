---
type: API Endpoint
title: Update Sales Return Tax Invoice
description: Upsert the faktur pajak of an approved PKP return (shared modal contract). Allowed in a closed period.
method: PUT
path: /sales-return/:id/tax-invoice
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Update Sales Return Tax Invoice

Same body, rules and errors as [update-purchase-invoice-tax-invoice](../purchase-invoice/update-purchase-invoice-tax-invoice.md), plus:

| Status | When | Body |
|---|---|---|
| `422` | return is not `approved` | `{ "message": "Faktur pajak hanya bisa diisi untuk retur yang sudah disetujui" }` |
| `422` | `number` already used by another invoice or return | `{ "errors": { "number": ["Nomor faktur pajak sudah dipakai dokumen lain"] } }` |

**Not locked by the closing period** — it does not touch jurnal or stok ([conventions](../conventions.md#closing-period-lock-locked)).

## Response

`200`: `{ "data": { ...SalesReturn }, "message": "Faktur pajak disimpan" }`
