---
type: API Endpoint
title: Update Sales
description: Edit an existing sales rep's name/address. Code is immutable.
method: PUT
path: /sales/:id
status: mock
tags: [sales, write]
resource: /frontend/src/mocks/modules/sales.ts
timestamp: 2026-09-07T00:00:00Z
---

# Update Sales

Backs `views/sales/pages/PageSalesEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; `name` and `address` can change.

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

```json
{ "name": "Budi Santoso", "address": "Jl. Merdeka No. 12, Bandung" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Sales }, "message": "Sales diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Sales tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
