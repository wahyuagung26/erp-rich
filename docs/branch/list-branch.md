---
type: API Endpoint
title: List Branch
description: Paginated, filterable, sortable list of branches. Soft-deleted rows are excluded.
method: GET
path: /branch
status: mock
tags: [branch, read, list]
resource: /frontend/src/mocks/modules/branch.ts
timestamp: 2026-09-05T00:00:00Z
---

# List Branch

Backs `views/branch/pages/PageBranchTable.vue` (via the `useTableList` composable).

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
    { "id": 1, "company_id": 1, "code": "PST", "name": "Kantor Pusat", "address": "Jl. Kaum Kaler, Manonjaya, Tasikmalaya", "deleted_at": null }
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
