---
type: API Endpoint
title: Get Customer
description: Fetch one customer by id.
method: GET
path: /customer/:id
status: mock
tags: [customer, read]
resource: /frontend/src/mocks/modules/customer.ts
timestamp: 2026-09-03T00:00:00Z
---

# Get Customer

Backs `views/customer/pages/PageCustomerDetail.vue` (read-only view) and
`PageCustomerEdit.vue` (loads the record into the form).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Customer.id` |

## Response

`200`: `{ "data": { ...Customer } }` — same shape as one row of [list-customer](./list-customer.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or the customer is soft-deleted | `{ "message": "Customer tidak ditemukan" }` |
