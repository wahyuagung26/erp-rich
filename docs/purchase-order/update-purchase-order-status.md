---
type: API Endpoint
title: Update Status Persetujuan Order Pembelian
description: Mengubah status persetujuan PO melalui aksi yang dikonfirmasi pengguna.
method: PATCH
path: /purchase-order/:id/approval
status: mock
tags: [purchase-order, write]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Status Persetujuan Order Pembelian

Dipakai oleh `PagePurchaseOrderDetail.vue`. UI meminta konfirmasi sebelum mengirim aksi
Setujui, Tolak, atau Ajukan Ulang.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

### Body

```json
{ "status": "approved" }
```

| Field | Type | Allowed values |
|---|---|---|
| `status` | string | `pending`, `approved`, `rejected` |

`pending` digunakan UI untuk mengajukan ulang PO yang `rejected`.

## Response

`200`:

```json
{
  "data": { "...PurchaseOrder": "entity response yang sudah di-resolve" },
  "message": "Status persetujuan diperbarui"
}
```

Saat `approved`, mock mengisi `approved_by` dari user lokal dan `approved_at` dengan
timestamp ISO. Saat `rejected`, mock mengisi `rejection_reason`.

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |
| `404` | ID tidak ditemukan | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | status tidak valid, PO locked, atau persetujuan approved dibatalkan | `{ "message": "..." }` |

PO approved tidak dapat diubah menjadi status lain. PO locked tidak dapat mengubah status
persetujuan. Mock menerima nilai status yang terdaftar; pembatasan aksi normal dilakukan
oleh UI sesuai state PO.
