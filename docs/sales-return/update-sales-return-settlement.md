---
type: API Endpoint
title: Update Sales Return Settlement
description: Edit a settlement (date, bank account, amount, description); its invoice payment row follows. Refused once its period is closed.
method: PUT
path: /sales-return/:id/settlements/:settlementId
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Update Sales Return Settlement

Backs the pencil icon on **Riwayat Penyelesaian** in `PageSalesReturnDetail.vue`: it loads the row into the settlement form, and **Simpan Perubahan** calls this endpoint.
Not offered for rows with `locked = true`. The `type` of a settlement never changes.

## Request

### Body

Same shape and rules as [create-sales-return-settlement](./create-sales-return-settlement.md) (`type` is ignored):

```json
{ "type": "cash_bank", "date": "2026-10-12", "bank_account_id": 1, "description": "Pengembalian dana ke customer", "amount": 400000 }
```

`amount` must be `> 0` and `≤ remaining_total + this settlement's current amount`; a `receivable_deduction` must also fit `invoice_outstanding + its current amount`.
`date` must not be after today, not before the return `date`, and **not in a closed period**. For `receivable_deduction` the invoice payment row's `date` / `amount` are updated in the same call.

## Response

`200`: `{ "data": { ...SalesReturn }, "message": "Potong piutang diperbarui" | "Pengembalian dana diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | return or settlement not found | `{ "message": "..." }` |
| `422` | the settlement's **current** date is in a closed period | `{ "message": "Periode September 2026 sudah closing, potong piutang tidak bisa diubah" }` |
| `422` | validation (incl. the **new** date in a closed period) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
