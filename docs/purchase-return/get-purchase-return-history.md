---
type: API Endpoint
title: Get Purchase Return History
description: Audit timeline of one purchase return, newest event first.
method: GET
path: /purchase-return/:id/history
status: mock
tags: [purchase-return, read, history]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Get Purchase Return History

Backs the global `HistoryModal` (detail header and list row menu). Shape and rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Events

`Dibuat`, `Diubah` (field + line diffs), `Disetujui`, `Persetujuan Dibatalkan`, `Pengembalian Dana Dicatat` / `Dibatalkan`, `Dipakai Potong Hutang`, `Faktur Pajak Disimpan` / `Diubah` / `Diimpor`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
