---
type: API Endpoint
title: Update Customer
description: Edit an existing customer.
method: PUT
path: /customer/:id
status: mock
tags: [customer, write]
resource: /frontend/src/mocks/modules/customer.ts
timestamp: 2026-09-04T10:00:00Z
---

# Update Customer

Backs `views/customer/pages/PageCustomerEdit.vue`. Full-object PUT (same body and
rules as [create-customer](./create-customer.md)).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

Same shape and rules as [create-customer](./create-customer.md). `code`, `id`,
`company_id` and `deleted_at` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Customer }, "message": "Customer diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Customer tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { } }` |
