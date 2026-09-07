---
type: API Endpoint
title: List Purchase Type
description: Paginated, filterable, sortable list of purchase types. Soft-deleted rows are excluded.
method: GET
path: /purchase-type
status: mock
tags: [purchase-type, read, list]
resource: /frontend/src/mocks/modules/purchase-type.ts
timestamp: 2026-09-07T00:00:00Z
---

# List Purchase Type

Backs `views/purchase-type/pages/PagePurchaseTypeTable.vue` (via the
`useTableList` composable).

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
    { "id": 1, "company_id": 1, "code": "LOKAL", "name": "Pembelian Lokal", "notes": "Pembelian dari supplier dalam negeri", "deleted_at": null }
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
