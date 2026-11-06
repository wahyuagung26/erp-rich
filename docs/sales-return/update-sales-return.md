---
type: API Endpoint
title: Update Sales Return
description: Edit a pending or rejected sales return (date, warehouse, reason, quantities).
method: PUT
path: /sales-return/:id
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Update Sales Return

Backs `PageSalesReturnEdit.vue`. `sales_invoice_id` is locked: sent but ignored. Quantity limits exclude this return's own previous quantities.

## Request

### Body

Same shape and rules as [create-sales-return](./create-sales-return.md).

## Response

`200`: `{ "data": { ...SalesReturn }, "message": "Retur penjualan diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
| `422` | validation | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | return is `approved` | `{ "message": "Retur yang sudah disetujui tidak boleh diubah" }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, retur penjualan tidak bisa diubah" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
