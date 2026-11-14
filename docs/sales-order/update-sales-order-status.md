---
type: API Endpoint
title: Update Sales Order Approval Status
description: Approve a sales order, or cancel its approval while no invoice was made from it.
method: PATCH
path: /sales-order/:id/approval
status: mock
tags: [sales-order, write]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-13T12:00:00Z
---

# Update Sales Order Approval Status

Backs the Setujui / Batalkan Persetujuan actions in `PageSalesOrderDetail.vue`; the UI confirms first.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesOrder.id` |

### Body

```json
{ "status": "approved" }
```

| Field | Type | Allowed values |
|---|---|---|
| `status` | string | `approved` (Setujui) or `pending` (Batalkan Persetujuan) |

## Response

`200`: `{ "data": { ...SalesOrder }, "message": "Status persetujuan diperbarui" }`. Approved → sets `approved_by` / `approved_at`; pending → clears both.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Sales order tidak ditemukan" }` |
| `422` | invalid status, or the same status as now | `{ "message": "..." }` |
| `422` | `date` in a closed period | `{ "message": "Periode <bulan tahun> sudah closing, sales order tidak bisa disetujui / dibatalkan persetujuannya" }` |
| `422` | cancelling the approval of an order that already has a (non-rejected) invoice | `{ "message": "Sales order sudah dibuatkan invoice <nomor>, persetujuan tidak bisa dibatalkan" }` |

## Notes

Same toggle as legacy `sq/approve` (`pending` ↔ `approve` while `RefSO` is empty). There is no rejected status.
