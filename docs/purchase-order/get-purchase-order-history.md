---
type: API Endpoint
title: Get Purchase Order History
description: Audit timeline of one purchase order, newest event first.
method: GET
path: /purchase-order/:id/history
status: mock
tags: [purchase-order, read, history]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-11-06T02:00:00Z
---

# Get Purchase Order History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu (`PagePurchaseOrderDetail.vue`, `PagePurchaseOrderTable.vue`). Shape and rules: [shared record-history
contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the purchase order |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, supplier, PKP status, department, warehouse, purchase type, address, description, and per-product quantity/price/discount (added/removed products too) |
| Disetujui | `approved` | |
| Ditolak | `rejected` | `summary` = rejection reason |
| Diajukan Ulang | `info` | rejected PO resubmitted as pending |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Purchase order tidak ditemukan" }` |
