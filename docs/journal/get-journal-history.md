---
type: API Endpoint
title: Get Journal History
description: Audit timeline of one journal entry, newest event first.
method: GET
path: /journal/:id/history
status: mock
tags: [journal, read, history]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-11-06T04:00:00Z
---

# Get Journal History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu
(`PageJournalDetail.vue`, `PageJournalTable.vue`). Shape and rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the journal entry |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, voucher, description, attachments count, and per-account lines (debit, credit, department, cash flow, line description; added/removed accounts too) |
| Disetujui | `approved` | |
| Ditolak | `rejected` | `summary` = rejection reason |
| Diajukan Ulang | `info` | rejected document resubmitted as `submitted` |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Jurnal tidak ditemukan" }` |
