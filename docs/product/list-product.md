---
type: API Endpoint
title: List Product
description: Paginated, filterable, sortable list of products. Soft-deleted rows are excluded.
method: GET
path: /product
status: mock
tags: [product, read, list]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-09-07T10:00:00Z
---

# List Product

Backs `views/product/pages/PageProductTable.vue` (via the `useTableList` composable).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | sent automatically by the frontend, not a user-facing filter; see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `code`, `name` |
| `q` | string | no | matches `code` + `name`, case-insensitive |
| `type` | string | no | exact match on `service` / `raw_material` / `finished_good` |
| `brand_id` | number | no | exact match; used by the [Harga Produk](../product-price/index.md) screen's "Filter Merk" |
| `product_category_id` | number | no | exact match; not scoped to the active company beyond what the row itself already is |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "code": "PRD001",
      "name": "Kulkas 2 Pintu",
      "type": "finished_good",
      "brand_id": 1,
      "brand_code": "SGT",
      "brand_name": "Samsung",
      "product_category_id": 1,
      "product_category_code": "ELK",
      "product_category_name": "Elektronik",
      "sales_type_id": 1,
      "sales_type_code": "RC0007",
      "sales_type_name": "Bahan Baku",
      "supplier_id": 1,
      "supplier_code": "SUP-0001",
      "supplier_name": "PT Sumber Rejeki",
      "unit_id": 1,
      "unit_code": "PCS",
      "unit_name": "Pieces",
      "min_stock": 5,
      "notes": "",
      "last_purchase_price": 3500000,
      "selling_price": 4200000,
      "hpp_avg": 3650000,
      "photo_url": "",
      "deleted_at": null
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 3, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Rows with a non-null `deleted_at` are never returned.
- Default sort when `sort_by` omitted: insertion order (newest first after a create).
- Returns an empty page if the active company hasn't resolved yet (no `X-Company-Id`).
