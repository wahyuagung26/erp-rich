---
type: API Endpoint
title: Get Product Category
description: Fetch one product category by id.
method: GET
path: /product-category/:id
status: mock
tags: [product-category, read]
resource: /frontend/src/mocks/modules/product-category.ts
timestamp: 2026-09-05T00:00:00Z
---

# Get Product Category

Backs `views/product-category/pages/PageProductCategoryDetail.vue` (read-only view) and
`PageProductCategoryEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `ProductCategory.id` |

## Response

`200`: `{ "data": { ...ProductCategory } }` — same shape as one row of [list-product-category](./list-product-category.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Kategori tidak ditemukan" }` |
