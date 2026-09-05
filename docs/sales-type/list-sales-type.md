---
type: API Endpoint
title: List Sales Type
description: Paginated, filterable, sortable list of sales types. Soft-deleted rows are excluded.
method: GET
path: /sales-type
status: mock
tags: [sales-type, read, list]
resource: /frontend/src/mocks/modules/sales-type.ts
timestamp: 2026-09-05T12:00:00Z
---

# List Sales Type

Backs `views/sales-type/pages/PageSalesTypeTable.vue` (via the `useTableList` composable).

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

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "company_id": 1, "code": "RC0007", "name": "Bahan Baku",
      "revenue_account_id": 5, "revenue_account_code": "4000101", "revenue_account_name": "Penjualan Produk",
      "cogs_account_id": 6, "cogs_account_code": "6000102", "cogs_account_name": "Biaya Bahan Baku",
      "inventory_account_id": 7, "inventory_account_code": "1000102", "inventory_account_name": "Persediaan Bahan Baku",
      "expense_account_id": 2, "expense_account_code": "6000101", "expense_account_name": "Beban Gaji Pokok",
      "deleted_at": null
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 1, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Rows with a non-null `deleted_at` are never returned.
- Default sort when `sort_by` omitted: insertion order (newest first after a create).
- Returns an empty page if the active company hasn't resolved yet (no `X-Company-Id`).
