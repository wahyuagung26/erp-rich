---
type: API Endpoint
title: List Daftar Harga
description: Paginated, filterable, sortable list of products with their harga jual and available stock (all gudang, or one).
method: GET
path: /price-list
status: mock
tags: [price-list, read, list]
resource: /frontend/src/mocks/modules/price-list.ts
timestamp: 2026-11-15T12:00:00Z
---

# List Daftar Harga

Backs `views/price-list/pages/PagePriceListTable.vue` (via `useTableList`). Read-only — there is no create / update / delete.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | sent automatically; see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `code`, `name`, `selling_price`, `stock_qty` |
| `q` | string | no | matches product `code` + `name`, case-insensitive |
| `brand_id` | number | no | exact match |
| `product_category_id` | number | no | exact match |
| `warehouse_id` | number | no | stock is counted for this gudang only; omitted = sum of all gudang of the active company |
| `price_status` | `unset` | no | only products with an active SKU whose harga jual is not set (`has_price = false`) |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 2,
      "code": "PRD002",
      "name": "Kompresor AC 1 PK",
      "type": "raw_material",
      "brand_id": 1,
      "brand_code": "SGT",
      "brand_name": "Samsung",
      "product_category_id": 1,
      "product_category_code": "ELK",
      "product_category_name": "Elektronik",
      "unit_name": "Pieces",
      "selling_price": 0,
      "selling_price_max": 0,
      "has_price": false,
      "stock_qty": 3,
      "min_stock": 10,
      "stock_warning": "low"
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 3, "last_page": 1 }
}
```

Field notes: see the [module index](./index.md#row-shape).

## Errors

Standard only (`401`).

## Notes

- Soft-deleted products are never returned.
- Returns an empty page if the active company hasn't resolved yet (no `X-Company-Id`).
- Stock never changes here; it is the running total of stock movements per gudang (mock: a static seed in `mocks/fixtures/price-list.ts`).
