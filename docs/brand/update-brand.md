---
type: API Endpoint
title: Update Brand
description: Edit an existing product brand's name. Code is immutable.
method: PUT
path: /brand/:id
status: mock
tags: [brand, write]
resource: /frontend/src/mocks/modules/brand.ts
timestamp: 2026-09-09T00:00:00Z
---

# Update Brand

Backs `views/brand/pages/PageBrandEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; only `name` can change.

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
{ "name": "Samsung Electronics" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Brand }, "message": "Merk diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Merk tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
