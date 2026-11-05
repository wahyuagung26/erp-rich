---
type: API Endpoint
title: Update Supplier Payable Payment
description: Edit a payment (date, amount, description, and the bank account for cash / bank). Refused once the payment's period is closed.
method: PUT
path: /supplier-payable/:id/payments/:paymentId
status: mock
tags: [supplier-payable, write]
resource: /frontend/src/mocks/modules/supplier-payable.ts
timestamp: 2026-11-06T10:00:00Z
---

# Update Supplier Payable Payment

Backs the pencil icon in the payment history of `PageSupplierPayableDetail.vue`: it loads the payment into the payment form
(**Edit Pembayaran**), and **Simpan Perubahan** calls this endpoint. Not offered for payments with `locked = true`.

## Request

### Body

Same shape as [create-supplier-payable-payment](./create-supplier-payable-payment.md); only these fields are read:

```json
{ "date": "2026-09-11", "bank_account_id": 1, "amount": 3200000, "description": "Pembayaran termin pertama" }
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; not after today, not before the payable `date`, **and not in a closed period** |
| `amount` | number | `> 0`, `≤ remaining_total + this payment's current amount`; for return / advance payments also `≤` the return's / advance's remaining + this payment's current amount |
| `bank_account_id` | number | required when the payment's `method = cash_bank`; ignored otherwise |
| `description` | string | optional |

`payment_type_id`, `purchase_return_id` and `supplier_advance_id` are **fixed** — sent values are ignored. To change them, cancel the
payment ([delete](./delete-supplier-payable-payment.md)) and record a new one. `number` does not change.

For `return_deduction` / `down_payment`, the mirrored settlement on the return / usage row on the advance follow the new date and amount.

## Response

`200`: `{ "data": { ...SupplierPayable }, "message": "Pembayaran diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | payable or payment not found | `{ "message": "..." }` |
| `422` | the payment's **current** date is in a closed period | `{ "message": "Periode September 2026 sudah closing, pembayaran tidak bisa diubah" }` |
| `422` | validation (incl. the **new** date in a closed period) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
