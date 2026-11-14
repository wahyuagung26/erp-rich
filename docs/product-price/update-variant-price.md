---
type: API Endpoint
title: Update Product Variant Price
description: Sets one SKU's selling price from the Harga Produk screen. Touches nothing else.
method: PATCH
path: /product-variant/:id/price
status: mock
tags: [product, pricing, write]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-11-15T12:00:00Z
---

# Update Product Variant Price

Backs the per-SKU inline edits of a product with variants in `views/product-price/pages/PageProductPriceTable.vue`. Products
without variants keep using [update-price](./update-price.md).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `ProductVariant.id` |

### Body

```json
{ "selling_price": 70000 }
```

| Field | Type | Rules |
|---|---|---|
| `selling_price` | number | required; integer (whole Rupiah) >= 0 |

Editing the default variant also updates `Product.selling_price` (they mirror each other).

## Response

`200`: `{ "data": { ...Product }, "message": "Harga varian diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | variant not found, soft-deleted, or its product is deleted / in another company | `{ "message": "Varian produk tidak ditemukan" }` |
| `422` | price negative or not an integer | `{ "message": "Validasi gagal", "errors": { "selling_price": ["Harga harus bilangan bulat >= 0"] } }` |
| `401` | standard | — |
