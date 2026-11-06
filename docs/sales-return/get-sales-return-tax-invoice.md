---
type: API Endpoint
title: Get Sales Return Tax Invoice
description: Read the faktur pajak of a return (shared modal contract).
method: GET
path: /sales-return/:id/tax-invoice
status: mock
tags: [sales-return, read]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Get Sales Return Tax Invoice

Backs the global `FakturPajakModal`. Contract: [Faktur Pajak (modal bersama)](../purchase-invoice/index.md#faktur-pajak-modal-bersama).

## Response

`200`: `{ "data": { "number", "date", "file" } | null }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
| `422` | non-PKP return | `{ "message": "Retur non-PKP tidak memiliki faktur pajak" }` |
