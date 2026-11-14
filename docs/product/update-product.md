---
type: API Endpoint
title: Update Product
description: Edit an existing product. Code is immutable; the 5 FKs, type, stock, price, notes and photo can all change.
method: PUT
path: /product/:id
status: mock
tags: [product, write]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-09-07T00:00:00Z
---

# Update Product

Backs `views/product/pages/PageProductEdit.vue`. The form shows `code` disabled
— this endpoint ignores `code` even if sent. All five FK ids are re-validated
and re-denormalized on every update (a product may be reassigned to a different
brand, category, sales type, supplier, or unit).

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

Same shape as [create-product](./create-product.md)'s body, minus `code`.

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Product }, "message": "Produk diperbarui" }`

## Errors

Same set as [create-product](./create-product.md), plus:

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Produk tidak ditemukan" }` |
