---
type: API Endpoint
title: Create Purchase Return Settlement (Dana Kembali)
description: Record cash / bank refund received from the supplier for an approved return.
method: POST
path: /purchase-return/:id/settlements
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-06T11:00:00Z
---

# Create Purchase Return Settlement (Dana Kembali)

Backs the "Pengembalian Dana" form in `PagePurchaseReturnDetail.vue`. Creates a `cash_bank` settlement only; `payable_deduction` rows are created by [create-supplier-payable-payment](../supplier-payable/create-supplier-payable-payment.md).

## Request

### Body

```json
{ "date": "2026-09-16", "bank_account_id": 1, "description": "Pengembalian dana dari supplier", "amount": 276000 }
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; not after today, not before the return `date`, **and not in a closed period** |
| `bank_account_id` | number | required; existing bank account ("Akun Cash / Bank") |
| `description` | string | optional |
| `amount` | number | `> 0` and `≤ remaining_total` |

## Response

`201`: `{ "data": { ...PurchaseReturn }, "message": "Pengembalian dana dicatat" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | return not found | `{ "message": "Retur pembelian tidak ditemukan" }` |
| `422` | return not approved | `{ "message": "Retur harus disetujui sebelum dikembalikan" }` |
| `422` | validation | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
