---
type: API Endpoint
title: Update Kunci Order Pembelian
description: Mengunci atau membuka kunci PO melalui aksi yang dikonfirmasi pengguna.
method: PATCH
path: /purchase-order/:id/lock
status: mock
tags: [purchase-order, write]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Kunci Order Pembelian

Dipakai oleh `PagePurchaseOrderDetail.vue`. Aksi Kunci dan Buka Kunci meminta konfirmasi
sebelum mengirim request.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

### Body

```json
{ "locked": true }
```

| Field | Type | Rules |
|---|---|---|
| `locked` | boolean | `true` untuk mengunci, `false` untuk membuka kunci |

## Response

`200`:

```json
{
  "data": { "...PurchaseOrder": "entity response yang sudah di-resolve" },
  "message": "PO dikunci"
}
```

Jika `locked` false, message menjadi `Kunci PO dibuka` dan `lock_reason` menjadi null.
Jika dikunci, mock mengisi `lock_reason` dengan alasan eksplisit dari pengguna.

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |
| `404` | ID tidak ditemukan | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | mencoba mengunci PO yang belum approved | `{ "message": "PO harus disetujui sebelum dikunci" }` |

Mock hanya mensyaratkan approval saat `locked: true`. Pembukaan kunci dikirim melalui aksi
terpisah setelah PO berada pada state locked.
