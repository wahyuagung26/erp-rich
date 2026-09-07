---
type: API Endpoint
title: Update Product Price
description: Price-only patch of one product — sets selling_price + last_purchase_price. Does not touch hpp_avg or any other field.
method: PATCH
path: /product/:id/price
status: mock
tags: [product, pricing, write]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-09-07T10:00:00Z
---

# Update Product Price

Backs the inline "Simpan" action in
`views/product-price/pages/PageProductPriceTable.vue`. A lightweight alternative
to [update-product](../product/update-product.md) — the pricing screen has only
two editable numbers per row, so it sends only those instead of a full product body.

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
{ "selling_price": 4200000, "last_purchase_price": 3500000 }
```

| Field | Type | Rules |
|---|---|---|
| `selling_price` | number | required; integer (whole Rupiah) >= 0 |
| `last_purchase_price` | number | required; integer (whole Rupiah) >= 0 |

Any other field in the body is ignored — this endpoint never changes `hpp_avg`,
the FKs, `name`, etc.

## Response

`200`: `{ "data": { ...Product }, "message": "Harga produk diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company | `{ "message": "Produk tidak ditemukan" }` |
| `422` | a price is negative or not an integer | `{ "message": "Validasi gagal", "errors": { "selling_price": ["Harga harus bilangan bulat >= 0"] } }` |
| `401` | standard | — |
