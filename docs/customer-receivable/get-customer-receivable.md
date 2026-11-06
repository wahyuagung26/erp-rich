---
type: API Endpoint
title: Get Customer Receivable
description: Fetch one customer receivable with all payments of its invoice.
method: GET
path: /customer-receivable/:id
status: mock
tags: [customer-receivable, read]
resource: /frontend/src/mocks/modules/customer-receivable.ts
timestamp: 2026-11-06T18:00:00Z
---

# Get Customer Receivable

Backs `PageCustomerReceivableDetail.vue` and `PageCustomerReceivablePrint.vue`. `id` = sales invoice id.

## Response

`200`: `{ "data": { ...CustomerReceivable } }` — `payments` contains every payment of the invoice (`source` tells which are read-only).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or the invoice is not approved | `{ "message": "Piutang customer tidak ditemukan" }` |
