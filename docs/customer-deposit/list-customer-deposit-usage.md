---
type: API Endpoint
title: List Customer Deposit Usage
description: Read-only usage/pemakaian history of a customer deposit (invoices paid from it).
method: GET
path: /customer-deposit/:id/usage
status: mock
tags: [customer-deposit, read]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# List Customer Deposit Usage

Backs `views/customer-deposit/components/RiwayatPemakaian.vue`. Usage rows are created by Invoice Penjualan and are
**read-only** here — there is no create/update/delete endpoint. The parent's `used` / `remaining` are the sum of these
`amount`s. Ordered by `date`, then `id`.

## Response

`200`: `{ "data": CustomerDepositUsage[] }` — `{ id, customer_deposit_id, date, invoice_id, invoice_number, note, amount }`.

`404`: `{ "message": "Titipan customer tidak ditemukan" }`
