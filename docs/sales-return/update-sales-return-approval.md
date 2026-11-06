---
type: API Endpoint
title: Update Sales Return Approval Status
description: Approve, reject, resubmit or cancel the approval of a return through a confirmed detail action.
method: PATCH
path: /sales-return/:id/approval
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Update Sales Return Approval Status

Backs **Setujui**, **Tolak**, **Ajukan Ulang** and **Batalkan Approval** in `PageSalesReturnDetail.vue`; the UI confirms first.
Approve moves stock into the receiving warehouse and posts the reversing journal in the real system (mock: state + history only).

## Request

### Body

```json
{ "status": "approved" }
```

| `status` | From | Meaning |
|---|---|---|
| `approved` | `pending` | Setujui — sets `approved_by` / `approved_at`; the source invoice must still be `approved` |
| `rejected` | `pending` | Tolak — sets `rejection_reason`; releases the returned quantity on the invoice |
| `pending` | `rejected` | Ajukan Ulang — the quantity is re-checked against what is still returnable |
| `pending` | `approved` | Batalkan Approval — clears approval metadata; refused once `settlements` exist |

## Response

`200`: `{ "data": { ...SalesReturn }, "message": "Status persetujuan diperbarui" }`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
| `422` | invalid status or transition | `{ "message": "..." }` |
| `422` | Batalkan Approval while `settlements` exist | `{ "message": "Persetujuan tidak bisa dibatalkan karena retur sudah dipakai atau dikembalikan" }` |
| `422` | Ajukan Ulang but the quantity no longer fits | `{ "message": "Jumlah retur melebihi sisa yang bisa diretur, ubah retur terlebih dahulu" }` |

**Periode closing:** every change is refused with `422 { "message": "Periode <bulan tahun> sudah closing, retur penjualan tidak bisa disetujui / ditolak / diajukan ulang / dibatalkan approval-nya" }` when `locked`
([conventions](../conventions.md#closing-period-lock-locked)).
