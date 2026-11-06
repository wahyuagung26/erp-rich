---
type: API Endpoint
title: Delete Customer Deposit
description: Delete a customer deposit that has no usage.
method: DELETE
path: /customer-deposit/:id
status: mock
tags: [customer-deposit, write]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# Delete Customer Deposit

Removes the row (and its history) from the in-memory store.

`200`: `{ "message": "Titipan customer dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Titipan customer tidak ditemukan" }` |
| `422` | the deposit has usage rows | `{ "message": "Titipan yang sudah dipakai di Invoice Penjualan tidak boleh dihapus" }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, titipan customer tidak bisa dihapus" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).
