---
type: API Endpoint
title: Update Customer Receivable Payment
description: Edit a payment recorded here (date, amount, description, bank account or expense item). Refused once the payment's period is closed.
method: PUT
path: /customer-receivable/:id/payments/:paymentId
status: mock
tags: [customer-receivable, write]
resource: /frontend/src/mocks/modules/customer-receivable.ts
timestamp: 2026-11-06T18:00:00Z
---

# Update Customer Receivable Payment

Backs the pencil icon in the payment history of `PageCustomerReceivableDetail.vue`: it loads the payment into the payment form (**Edit Pembayaran**), and
**Simpan Perubahan** calls this endpoint. Only `source: receivable` payments with `locked = false` are offered it.

## Request

### Body

Same shape as [create-customer-receivable-payment](./create-customer-receivable-payment.md); only these fields are read:

```json
{ "date": "2026-11-04", "bank_account_id": 1, "sales_expense_id": null, "amount": 450000, "description": "Termin ketiga" }
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; not after today, not before the invoice `date`, **and not in a closed period** |
| `amount` | number | `> 0`, `≤ outstanding + this payment's current amount`; for a Titipan also `≤` the deposit's `remaining + this payment's current amount` |
| `bank_account_id` | number | required when the payment's `method = cash_bank`; ignored otherwise |
| `sales_expense_id` | number | required when `method = expense`; ignored otherwise |
| `description` | string | optional |

`payment_type_id` and `deposit_id` are **fixed** — sent values are ignored. To change them, cancel the payment ([delete](./delete-customer-receivable-payment.md)) and record a new one.
`number` does not change. For a Titipan, the mirrored usage row on the deposit follows the new date and amount.

## Response

`200`: `{ "data": { ...CustomerReceivable }, "message": "Pembayaran diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | invoice or payment not found | `{ "message": "..." }` |
| `422` | the payment is not `source: receivable` | `{ "message": "Pembayaran ini dikelola dari Retur Penjualan <nomor>" }` / `"…dari Invoice Penjualan"` |
| `422` | the payment's **current** date is in a closed period | `{ "message": "Periode September 2026 sudah closing, pembayaran tidak bisa diubah" }` |
| `422` | validation (incl. the **new** date in a closed period) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
