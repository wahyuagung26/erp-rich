---
type: API Endpoint
title: Get Purchase Receipt History
description: Audit timeline of one purchase receipt, newest event first.
method: GET
path: /purchase-receipt/:id/history
status: mock
tags: [purchase-receipt, read, history]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-11-06T02:00:00Z
---

# Get Purchase Receipt History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu (`PagePurchaseReceiptDetail.vue`, `PagePurchaseReceiptTable.vue`). Shape and rules: [shared record-history
contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the purchase receipt |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, delivery note, description, department, and per-product received quantity / warehouse |
| Invoice Dibuat | `info` | written by [create-purchase-invoice](../purchase-invoice/create-purchase-invoice.md); `summary` = invoice number |
| Invoice Dihapus | `info` | written by [delete-purchase-invoice](../purchase-invoice/delete-purchase-invoice.md) |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Penerimaan pembelian tidak ditemukan" }` |
