---
type: API Endpoint
title: Get Customer Deposit
description: Get one customer deposit with normalized detail labels.
method: GET
path: /customer-deposit/:id
status: mock
tags: [customer-deposit, read]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# Get Customer Deposit

## Response

`200`: `{ "data": CustomerDeposit }`

Includes resolved department / customer / cash account / cash-flow labels, the computed `used` / `remaining` /
`last_invoice_number`, and `locked`. Backs the detail, edit and print (`PageCustomerDepositPrint.vue`, A4 portrait) pages.

`404`: `{ "message": "Titipan customer tidak ditemukan" }`
