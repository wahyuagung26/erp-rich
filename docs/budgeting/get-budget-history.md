---
type: OKF Endpoint
title: Get Budget History
description: Status log of one budget, newest event first, in the shared record-history shape.
method: GET
path: /budgeting/budgets/:id/history
status: mock
tags: [budgeting, read, history]
resource: budgeting
timestamp: 2026-11-17T10:00:00Z
---

# Get Budget History

Backs the global `HistoryModal`, opened from the **Riwayat** button in the detail header (`PageBudgetDetail.vue`). Shape and rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first. Built from the document's status log (`history` on [get-budget](./get-budget.md)): `title` = action, `actor` = who, `summary` = note.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat, Import dibuat | `created` | no previous status |
| Diperbarui, Import diperbarui | `updated` | status unchanged, so `changes` is empty |
| Disetujui | `approved` | `changes`: Status |
| Ditolak | `rejected` | `summary` = rejection reason; `changes`: Status |
| Diajukan, Dibatalkan, Persetujuan dibatalkan | `info` | `summary` = note; `changes`: Status old → new |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, other company or inaccessible department | `{ "message": "Dokumen tidak ditemukan. Periksa kembali pilihan Anda." }` |
