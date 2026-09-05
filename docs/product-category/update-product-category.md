---
type: API Endpoint
title: Update Product Category
description: Edit an existing product category's name. Code is immutable.
method: PUT
path: /product-category/:id
status: mock
tags: [product-category, write]
resource: /frontend/src/mocks/modules/product-category.ts
timestamp: 2026-09-05T00:00:00Z
---

# Update Product Category

Backs `views/product-category/pages/PageProductCategoryEdit.vue`. The form shows `code` disabled —
this endpoint ignores `code` even if sent; only `name` can change.

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
{ "name": "Elektronik & Gadget" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...ProductCategory }, "message": "Kategori diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Kategori tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
