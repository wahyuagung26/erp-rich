---
type: API Endpoint
title: Update Customer
description: Edit an existing customer.
method: PUT
path: /customer/:id
status: mock
tags: [customer, write]
resource: /frontend/src/mocks/modules/customer.ts
timestamp: 2026-09-03T00:00:00Z
---

# Update Customer

Backs `views/customer/pages/PageCustomerEdit.vue`. Full-object PUT (same body and
rules as [create-customer](./create-customer.md)).

## Request

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

Same shape and rules as [create-customer](./create-customer.md). `code`, `id` and
`deleted_at` are ignored if sent.

## Response

`200`: `{ "data": { ...Customer }, "message": "Customer diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or soft-deleted | `{ "message": "Customer tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { } }` |
