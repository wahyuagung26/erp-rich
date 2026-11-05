---
type: API Endpoint
title: Get Supplier Advance History
description: Audit timeline of one supplier advance, newest event first.
method: GET
path: /supplier-advance/:id/history
status: mock
tags: [supplier-advance, read, history]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-11-06T02:00:00Z
---

# Get Supplier Advance History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu (`PageSupplierAdvanceDetail.vue`, `PageSupplierAdvanceTable.vue`). Shape and rules: [shared record-history
contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the supplier advance |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, department, supplier, nominal, cash account, advance type, cash flow, description, attachment |
| Dipakai di Hutang Supplier | `info` | one per usage row (see [list-supplier-advance-usage](./list-supplier-advance-usage.md)); `summary` = payable number and amount; `actor` is `Sistem` |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Uang muka supplier tidak ditemukan" }` |
