---
type: API Endpoint
title: Update Purchase Return Settlement (Dana Kembali)
description: Edit a cash / bank refund (date, bank account, amount, description). Refused once its period is closed.
method: PUT
path: /purchase-return/:id/settlements/:settlementId
status: mock
tags: [purchase-return, write]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-06T11:00:00Z
---

# Update Purchase Return Settlement (Dana Kembali)

Backs the pencil icon on `cash_bank` rows of **Riwayat Penyelesaian** in `PagePurchaseReturnDetail.vue`: it loads the refund into the
refund form (**Edit Pengembalian Dana**), and **Simpan Perubahan** calls this endpoint. Not offered for rows with `locked = true`.
`payable_deduction` rows are edited from [Hutang Supplier](../supplier-payable/update-supplier-payable-payment.md).

## Request

### Body

Same shape and rules as [create-purchase-return-settlement](./create-purchase-return-settlement.md):

```json
{ "date": "2026-09-16", "bank_account_id": 1, "description": "Pengembalian dana dari supplier", "amount": 400000 }
```

`amount` must be `> 0` and `≤ remaining_total + this refund's current amount`. `date` must not be after today, not before the return `date`,
and **not in a closed period**.

## Response

`200`: `{ "data": { ...PurchaseReturn }, "message": "Pengembalian dana diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | return or settlement not found | `{ "message": "..." }` |
| `422` | settlement is `payable_deduction` | `{ "message": "Pemakaian untuk potong hutang diubah lewat menu Hutang Supplier" }` |
| `422` | the refund's **current** date is in a closed period | `{ "message": "Periode September 2026 sudah closing, pengembalian dana tidak bisa diubah" }` |
| `422` | validation (incl. the **new** date in a closed period) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
