---
type: API Endpoint
title: Delete Order Pembelian
description: Menghapus PO yang masih writable menurut guardrail mock.
method: DELETE
path: /purchase-order/:id
status: mock
tags: [purchase-order, write]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Delete Order Pembelian

Dipakai oleh aksi hapus di `PagePurchaseOrderTable.vue` dan
`PagePurchaseOrderDetail.vue`. Kedua aksi memerlukan konfirmasi eksplisit.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

Tidak ada request body.

## Response

`200`:

```json
{ "message": "Order pembelian dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |
| `404` | ID tidak ditemukan | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | PO approved, locked, atau sudah memiliki penerimaan | `{ "message": "..." }` |

## Guardrail

Penghapusan ditolak jika:

- `approval_status === approved`;
- `is_locked === true`; atau
- `delivery_status !== not_received`.

Jika berhasil, row dihapus dari database mock, bukan soft-delete. UI menampilkan toaster
sukses dan memuat ulang daftar atau kembali ke halaman list.
