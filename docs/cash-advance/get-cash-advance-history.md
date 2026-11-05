---
type: API Endpoint
title: Get Cash Advance History
description: Audit timeline of one cash advance (uang muka operasional), newest event first.
method: GET
path: /cash-advance/:id/history
status: mock
tags: [cash-advance, read, history]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-11-06T04:00:00Z
---

# Get Cash Advance History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu
(`PageCashAdvanceDetail.vue`, `PageCashAdvanceTable.vue`). Shape and rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the cash advance (uang muka operasional) |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, voucher, department, recipient, nominal, cash/bank source, advance account, cash flow, description, attachments count |
| Disetujui | `approved` | |
| Ditolak | `rejected` | `summary` = rejection reason |
| Diajukan Ulang | `info` | rejected document resubmitted as `submitted` |
| Penyelesaian Ditambahkan / Diubah / Dihapus | `info` | one per settlement change (see [list-cash-advance-settlement](./list-cash-advance-settlement.md)); `summary` = settlement number and amount |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Uang muka operasional tidak ditemukan" }` |
