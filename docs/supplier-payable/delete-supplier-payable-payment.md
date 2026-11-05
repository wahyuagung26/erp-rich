---
type: API Endpoint
title: Delete Supplier Payable Payment
description: Cancel a payment; also removes the matching return settlement or advance usage row.
method: DELETE
path: /supplier-payable/:id/payments/:paymentId
status: mock
tags: [supplier-payable, write]
resource: /frontend/src/mocks/modules/supplier-payable.ts
timestamp: 2026-11-06T10:00:00Z
---

# Delete Supplier Payable Payment

Backs the delete icon in the payment history of `PageSupplierPayableDetail.vue`; the UI confirms first.

## Response

`200`: `{ "data": { ...SupplierPayable }, "message": "Pembayaran dibatalkan" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | payable or payment not found | `{ "message": "..." }` |
| `422` | the payment's period is closed (`locked = true`) | `{ "message": "Periode September 2026 sudah closing, pembayaran tidak bisa dibatalkan" }` |
