---
type: API Endpoint
title: List Akun
description: Paginated, filterable, sortable list of chart-of-accounts entries.
method: GET
path: /akun
status: mock
tags: [akun, read, list]
resource: /frontend/src/mocks/modules/akun.ts
timestamp: 2026-09-03T09:00:00Z
---

# List Akun

Backs `views/akun/pages/PageAkunTable.vue` (via the `useTableList` composable).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `code`, `name` |
| `q` | string | no | matches `code` + `name`, case-insensitive |
| `type` | enum | no | one of the `Akun.type` values |
| `active` | boolean | no | `true` / `false` |

## Response

`200`:

```json
{
  "data": [
    { "id": 1, "code": "1-1000", "name": "Kas", "type": "asset", "normal_balance": "debit", "active": true }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 18, "last_page": 2 }
}
```

## Errors

Standard only (`401`).

## Notes

- Default sort when `sort_by` omitted: insertion order (newest first after a create).
