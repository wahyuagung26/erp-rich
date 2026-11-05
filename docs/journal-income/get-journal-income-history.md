---
type: API Endpoint
title: Get Journal Income History
description: Audit timeline of one journal income (jurnal pemasukan), newest event first.
method: GET
path: /journal-income/:id/history
status: mock
tags: [journal-income, read, history]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-11-06T04:00:00Z
---

# Get Journal Income History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu
(`PageJournalIncomeDetail.vue`, `PageJournalIncomeTable.vue`). Shape and rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the journal income (jurnal pemasukan) |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, voucher, description, cash/bank account, department, cash flow, attachments count, and per-account income lines |
| Disetujui | `approved` | |
| Ditolak | `rejected` | `summary` = rejection reason |
| Diajukan Ulang | `info` | rejected document resubmitted as `submitted` |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Jurnal pemasukan tidak ditemukan" }` |
