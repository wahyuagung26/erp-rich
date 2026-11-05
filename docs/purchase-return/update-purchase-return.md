---
type: API Endpoint
title: Update Purchase Return
description: Edit a pending purchase return (date, warehouse, reason, quantities).
method: PUT
path: /purchase-return/:id
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-06T13:00:00Z
---

# Update Purchase Return

Backs `PagePurchaseReturnEdit.vue`. `purchase_invoice_id` is locked: sent but ignored. Quantity limits exclude this return's own previous quantities.

## Request

### Body

```json
{
  "purchase_invoice_id": 1,
  "date": "2026-09-12",
  "warehouse_id": 1,
  "reason": "Barang rusak saat diterima",
  "lines": [ { "product_id": 2, "quantity": 2 } ]
}
```

| Field | Type | Rules |
|---|---|---|
| `purchase_invoice_id` | number | required; invoice must be `approved` |
| `date` | string | required; `YYYY-MM-DD`; not after today, not before the invoice date |
| `warehouse_id` | number | required; existing warehouse |
| `reason` | string | required; max 250 |
| `lines[].product_id` | number | must belong to the invoice; unique |
| `lines[].quantity` | number | `≥ 0` and `≤ quantity_purchased − quantity_returned_before`; lines with `0` are dropped; at least one line `> 0` |

`price`, amounts and labels are never accepted from the client.

## Response

`200`: `{ "data": { ...PurchaseReturn }, "message": "Retur pembelian diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
| `422` | validation (`purchase_invoice_id`, `date`, `warehouse_id`, `reason`, `lines`) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | return is `approved` | `{ "message": "Retur yang sudah disetujui tidak boleh diubah" }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, retur pembelian tidak bisa diubah" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
