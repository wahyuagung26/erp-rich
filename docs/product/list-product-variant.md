---
type: API Endpoint
title: List Product Variant
description: Searchable SKU picker for transaction lines — active variants of live products in the active company.
method: GET
path: /product-variant
status: mock
tags: [product, read]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-11-13T12:00:00Z
---

# List Product Variant

Backs the product picker (`AsyncSelect endpoint="/product-variant"`) of the Sales Order and Invoice Penjualan line forms.
Returns only `is_active`, non-deleted variants of non-deleted products of the active company.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `q` | string | no | matches SKU, product code, product name, or variant label |

Inherits pagination params from [conventions](../conventions.md). Default sort: `sku`.

## Response

`200`:

```json
{
  "data": [
    { "id": 1001, "sku": "PRD004-S", "label": "S", "product_id": 4, "product_code": "PRD004", "product_name": "Kemeja Seragam SD Putih",
      "brand_name": "Samsung", "unit_name": "Pieces", "selling_price": 65000 }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | number | `ProductVariant.id` — what a transaction line sends as `variant_id` |
| `label` | string | option values joined by ` / `; `Standar` for the default variant |
| `selling_price` | number | the product's selling price, used as the line's default price |

## Notes

- Without a resolvable `X-Company-Id` the list is empty ([conventions](../conventions.md#company-scoping)).
