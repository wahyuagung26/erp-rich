---
type: API Endpoint
title: Update Sales Invoice Approval Status
description: Approve, reject, resubmit or cancel the approval of an invoice through a confirmed detail action.
method: PATCH
path: /sales-invoice/:id/approval
status: mock
tags: [sales-invoice, write]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-13T12:00:00Z
---

# Update Sales Invoice Approval Status

Backs **Setujui**, **Tolak**, **Ajukan Ulang** and **Batalkan Approval** in `PageSalesInvoiceDetail.vue`; the UI confirms first.
Approve moves stock out and posts the journal in the real system (mock: state + history only).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

### Body

```json
{ "status": "approved" }
```

| `status` | From | Meaning |
|---|---|---|
| `approved` | `pending` | Setujui — sets `approved_by` / `approved_at` |
| `rejected` | `pending` | Tolak — sets `rejection_reason`; releases the Sales Order (it may get another invoice) |
| `pending` | `rejected` | Ajukan Ulang — takes the Sales Order again (refused if another invoice took it meanwhile) |
| `pending` | `approved` | Batalkan Approval — clears approval metadata |

## Response

`200`: `{ "data": { ...SalesInvoice }, "message": "Status persetujuan diperbarui" }`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | invalid status or transition | `{ "message": "..." }` |
| `422` | Batalkan Approval with a `kind: receivable` payment, or blocked by a downstream document (Surat Jalan / Retur) | `{ "message": "Invoice sudah memiliki pembayaran piutang, tidak bisa membatalkan approval" }` |
| `422` | Ajukan Ulang but the Sales Order quantity no longer allows it | `{ "message": "..." }` |

**Periode closing:** every change is refused with `422 { "message": "Periode <bulan tahun> sudah closing, invoice penjualan tidak bisa disetujui / ditolak / diajukan ulang / dibatalkan approval-nya" }` when `locked`
([conventions](../conventions.md#closing-period-lock-locked)).
