---
type: API Endpoint
title: Get Delivery Note History
description: Audit timeline of one surat jalan, newest event first.
method: GET
path: /delivery-note/:id/history
status: mock
tags: [delivery-note, read, history]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-06T17:00:00Z
---

# Get Delivery Note History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu. Shape and rules:
[shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the surat jalan |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, alamat pengiriman, penerima, driver, kendaraan, keterangan, per-product quantity |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Surat jalan tidak ditemukan" }` |
