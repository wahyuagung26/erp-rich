---
type: API Endpoint
title: Get Sales Return History
description: Audit timeline of one sales return, newest event first.
method: GET
path: /sales-return/:id/history
status: mock
tags: [sales-return, read, history]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Get Sales Return History

Backs the global `HistoryModal` (detail header and list row menu). Shape and rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Events

`Dibuat`, `Diubah` (field + line diffs), `Disetujui`, `Ditolak`, `Diajukan Ulang`, `Approval Dibatalkan`, `Potong Piutang Dicatat` / `Diubah` / `Dibatalkan`, `Pengembalian Dana Dicatat` / `Diubah` / `Dibatalkan`,
`Faktur Pajak Disimpan` / `Diubah` / `Diimpor`. A potong piutang also writes `Dibayar dengan Retur Penjualan` / `Pembayaran Retur Penjualan Dibatalkan` on the invoice's own timeline.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
