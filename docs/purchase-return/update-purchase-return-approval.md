---
type: API Endpoint
title: Approve / Unapprove Purchase Return
description: Two-way approval: approve a pending return or cancel an approval that has no settlements.
method: PATCH
path: /purchase-return/:id/approval
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-06T12:00:00Z
---

# Approve / Unapprove Purchase Return

Backs **Setujui** and **Batal Approve** in `PagePurchaseReturnDetail.vue`; the UI confirms first.

## Request

### Body

```json
{ "status": "approved" }
```

`status`: `approved` (from `pending`) or `pending` (from `approved`, "Batal Approve").

## Response

`200`: `{ "data": { ...PurchaseReturn }, "message": "Retur disetujui" }` or `"Persetujuan dibatalkan"` — sets/clears `approved_by` and `approved_at`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
| `422` | invalid `status`, already in that state, or unapprove while `settlements` exist | `{ "message": "..." }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, persetujuan retur tidak bisa diubah" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).
