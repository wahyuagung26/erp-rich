---
type: API Endpoint
title: Get Supplier Payable
description: Fetch one supplier payable with its payments.
method: GET
path: /supplier-payable/:id
status: mock
tags: [supplier-payable, read]
resource: /frontend/src/mocks/modules/supplier-payable.ts
timestamp: 2026-11-05T12:00:00Z
---

# Get Supplier Payable

Backs `PageSupplierPayableDetail.vue`.

## Response

`200`: `{ "data": { ...SupplierPayable } }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or the invoice is not approved | `{ "message": "Hutang supplier tidak ditemukan" }` |
