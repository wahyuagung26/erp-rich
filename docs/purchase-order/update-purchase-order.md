---
type: API Endpoint
title: Update Order Pembelian
description: Memperbarui PO yang masih dapat ditulis.
method: PUT
path: /purchase-order/:id
status: mock
tags: [purchase-order, write]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Order Pembelian

Dipanggil oleh `PagePurchaseOrderEdit.vue`. Page mengubah response entity menjadi
`PurchaseOrderDraft` melalui `toPurchaseOrderDraft()`, form memvalidasi dan mengirim
`PurchaseOrderRequest`, lalu page mengirim PUT dan kembali ke halaman detail.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

### Body

Body sama dengan [create-purchase-order](./create-purchase-order.md). Request tidak boleh
mengandung label master atau field computed.

## Response

`200`:

```json
{
  "data": { "...PurchaseOrder": "entity response yang sudah di-resolve dan dihitung ulang" },
  "message": "Order pembelian diperbarui"
}
```

Response mempertahankan `number` dan `id` PO yang diedit. Status approval saat ini juga
dipertahankan oleh mock.

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |
| `404` | ID tidak ditemukan | `{ "message": "Purchase order tidak ditemukan" }` |
| `422` | PO tidak boleh ditulis atau body tidak valid | `{ "message": "...", "errors"?: { "field": ["Pesan"] } }` |

PO tidak dapat di-update jika:

- `approval_status` adalah `approved`;
- `is_locked` adalah `true`; atau
- `delivery_status` bukan `not_received`.

Validasi body sama dengan endpoint create. HTTP `422` yang memiliki `errors` dipetakan ke
field form; error guardrail tanpa `errors` ditampilkan melalui toaster.
