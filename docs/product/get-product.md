---
type: API Endpoint
title: Get Product
description: Fetch one product by id.
method: GET
path: /product/:id
status: mock
tags: [product, read]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-09-07T00:00:00Z
---

# Get Product

Backs `views/product/pages/PageProductDetail.vue` (read-only view) and
`PageProductEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Product.id` |

## Response

`200`: `{ "data": { ...Product } }` — same shape as one row of
[list-product](./list-product.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Produk tidak ditemukan" }` |
