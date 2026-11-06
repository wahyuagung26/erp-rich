---
type: API Endpoint
title: Get Customer Deposit History
description: Audit timeline of one customer deposit, newest event first.
method: GET
path: /customer-deposit/:id/history
status: mock
tags: [customer-deposit, read, history]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# Get Customer Deposit History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu. Shape and
rules: [shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | |
| Diubah | `updated` | `changes` covers date, department, customer, nominal, cash account, cash flow, description, attachment |
| Dipakai di Invoice Penjualan | `info` | one per usage row (see [list-customer-deposit-usage](./list-customer-deposit-usage.md)); `summary` = invoice number and amount; `actor` is `Sistem` |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Titipan customer tidak ditemukan" }` |
