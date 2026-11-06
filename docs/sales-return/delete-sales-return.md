---
type: API Endpoint
title: Delete Sales Return
description: Delete a pending or rejected sales return (with its history).
method: DELETE
path: /sales-return/:id
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Delete Sales Return

Backs the row menu in `PageSalesReturnTable.vue` and the detail header.

## Response

`200`: `{ "message": "Retur penjualan dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
| `422` | return is `approved` | `{ "message": "Retur yang sudah disetujui tidak boleh dihapus" }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, retur penjualan tidak bisa dihapus" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).
