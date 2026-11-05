---
type: API Endpoint
title: Get Purchase Invoice History
description: Audit timeline of one purchase invoice, newest event first.
method: GET
path: /purchase-invoice/:id/history
status: mock
tags: [purchase-invoice, read, history]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-06T02:00:00Z
---

# Get Purchase Invoice History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu (`PagePurchaseInvoiceDetail.vue`, `PagePurchaseInvoiceTable.vue`). Shape and rules: [shared record-history
contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the purchase invoice |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | `summary` = source receipt number |
| Diubah | `updated` | `changes` covers date, supplier invoice number, description, and per-product unit price |
| Faktur Pajak Disimpan / Diubah | `info` | `changes` shows number, date, and file when edited |
| Disetujui | `approved` | `summary` = kontrabon number |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
