---
type: API Endpoint
title: Delete Purchase Return
description: Delete a pending purchase return (with its history).
method: DELETE
path: /purchase-return/:id
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# Delete Purchase Return

Backs the row menu in `PagePurchaseReturnTable.vue` and the detail header.

## Response

`200`: `{ "message": "Retur pembelian dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
| `422` | return is `approved` | `{ "message": "Retur yang sudah disetujui tidak boleh dihapus" }` |
