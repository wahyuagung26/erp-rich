---
type: API Endpoint
title: Get Sales Order History
description: Audit timeline of one sales order, newest event first.
method: GET
path: /sales-order/:id/history
status: mock
tags: [sales-order, read, history]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-06T15:00:00Z
---

# Get Sales Order History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu. Shape and rules:
[shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the sales order |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, customer, sales, department, termin, PKP status, description, diskon global, per-product quantity/price/discount/gudang (added/removed products too) and biaya penjualan |
| Disetujui | `approved` | |
| Ditolak | `rejected` | `summary` = rejection reason |
| Diajukan Ulang | `info` | rejected order resubmitted as pending |
| Invoice Dibuat / Invoice Dibatalkan | `info` | written by Invoice Penjualan through `applyInvoicedQuantity` (`summary` = invoice number) |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
