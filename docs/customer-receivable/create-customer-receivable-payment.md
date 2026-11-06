---
type: API Endpoint
title: Create Customer Receivable Payment
description: Record a payment on an approved sales invoice (cash / bank, from a customer deposit, or settled with a sales expense).
method: POST
path: /customer-receivable/:id/payments
status: mock
tags: [customer-receivable, write]
resource: /frontend/src/mocks/modules/customer-receivable.ts
timestamp: 2026-11-06T17:00:00Z
---

# Create Customer Receivable Payment

Backs the payment form in `PageCustomerReceivableDetail.vue`. Writes a `kind: receivable` row to `db.salesInvoicePayment`.

## Request

### Body

```json
{ "date": "2026-11-05", "payment_type_id": 1, "bank_account_id": 1, "deposit_id": null, "sales_expense_id": null, "amount": 500000, "description": "Termin ketiga" }
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; not after today, not before the invoice `date`, **and not in a closed period** |
| `payment_type_id` | number | required; a master sale type with `method` `cash_bank` / `down_payment`, or `-1` (Biaya) |
| `bank_account_id` | number \| null | required when `method = cash_bank` |
| `deposit_id` | number \| null | required when `method = down_payment`; deposit of the same customer, `amount ≤` its `remaining` |
| `sales_expense_id` | number \| null | required when `method = expense` (Biaya); active Biaya Penjualan |
| `amount` | number | `> 0`, `≤ outstanding` |
| `description` | string | optional, max 250 |

A `down_payment` also writes a usage row on the deposit ([`GET /customer-deposit/:id/usage`](../customer-deposit/list-customer-deposit-usage.md)) and a deposit history event.

## Response

`201`: `{ "data": { ...CustomerReceivable }, "message": "Pembayaran piutang dicatat" }` — `number` `AR-<nomor invoice>-BY<nn>`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | invoice not found | `{ "message": "Piutang customer tidak ditemukan" }` |
| `422` | invoice not approved | `{ "message": "Invoice belum disetujui, pembayaran piutang tidak bisa dicatat" }` |
| `422` | validation | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
