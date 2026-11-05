---
type: API Endpoint
title: Create Supplier Payable Payment
description: Record a payment (cash / bank, offset against an approved purchase return, or paid from a supplier advance).
method: POST
path: /supplier-payable/:id/payments
status: mock
tags: [supplier-payable, write]
resource: /frontend/src/mocks/modules/supplier-payable.ts
timestamp: 2026-11-06T10:00:00Z
---

# Create Supplier Payable Payment

Backs the payment form in `PageSupplierPayableDetail.vue`.

## Request

### Body

```json
{ "date": "2026-09-14", "payment_type_id": 4, "bank_account_id": null, "purchase_return_id": 1, "supplier_advance_id": null, "amount": 500000, "description": "Potong retur" }
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; not after today, not before the payable `date`, **and not in a closed period** |
| `payment_type_id` | number | required; `transaction_type = purchase`, `method` = `cash_bank`, `return_deduction` or `down_payment` |
| `bank_account_id` | number \| null | required when `method = cash_bank` |
| `purchase_return_id` | number \| null | required when `method = return_deduction`; approved, same supplier |
| `supplier_advance_id` | number \| null | required when `method = down_payment`; same supplier, `amount ≤` the advance's `remaining` |
| `amount` | number | `> 0`, `≤ remaining_total`; for returns also `≤` the return's `remaining_total` |
| `description` | string | optional |

A `down_payment` also writes a usage row on the advance ([`GET /supplier-advance/:id/usage`](../supplier-advance/list-supplier-advance-usage.md)).

## Response

`201`: `{ "data": { ...SupplierPayable }, "message": "Pembayaran hutang dicatat" }` — `number` `BYR-RICH/<seq>/<MM>/<YYYY>`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | payable not found | `{ "message": "Hutang supplier tidak ditemukan" }` |
| `422` | validation | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
