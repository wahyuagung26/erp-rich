---
type: API Endpoint
title: Delete Customer Receivable Payment
description: Cancel a payment recorded here; also removes the matching deposit usage row.
method: DELETE
path: /customer-receivable/:id/payments/:paymentId
status: mock
tags: [customer-receivable, write]
resource: /frontend/src/mocks/modules/customer-receivable.ts
timestamp: 2026-11-06T18:00:00Z
---

# Delete Customer Receivable Payment

Backs the delete icon in the payment history of `PageCustomerReceivableDetail.vue`; the UI confirms first.

## Response

`200`: `{ "data": { ...CustomerReceivable }, "message": "Pembayaran dibatalkan" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | invoice or payment not found | `{ "message": "..." }` |
| `422` | the payment is not `source: receivable` | `{ "message": "Pembayaran ini dikelola dari Retur Penjualan <nomor>" }` / `"…dari Invoice Penjualan"` |
| `422` | the payment's period is closed (`locked = true`) | `{ "message": "Periode September 2026 sudah closing, pembayaran tidak bisa dibatalkan" }` |
