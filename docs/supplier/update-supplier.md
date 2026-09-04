---
type: API Endpoint
title: Update Supplier
description: Edit an existing supplier.
method: PUT
path: /supplier/:id
status: mock
tags: [supplier, write]
resource: /frontend/src/mocks/modules/supplier.ts
timestamp: 2026-09-04T10:00:00Z
---

# Update Supplier

Backs `views/supplier/pages/PageSupplierEdit.vue`. Full-object PUT (same body and
rules as [create-supplier](./create-supplier.md)).

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

Same shape and rules as [create-supplier](./create-supplier.md). `code`, `id`,
`company_id` and `deleted_at` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Supplier }, "message": "Supplier diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Supplier tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { } }` |
