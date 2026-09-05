---
type: API Endpoint
title: List Sub Account
description: Paginated, filterable, sortable list of sub-accounts. Soft-deleted rows are excluded.
method: GET
path: /sub-account
status: mock
tags: [sub-account, read, list]
resource: /frontend/src/mocks/modules/sub-account.ts
timestamp: 2026-09-05T10:00:00Z
---

# List Sub Account

Backs `views/sub-account/pages/PageSubAccountTable.vue` (via the `useTableList` composable).

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
    { "id": 1, "company_id": 1, "account_group_id": 1, "account_group_code": "10", "account_group_name": "Aset", "code": "10001", "name": "Kas", "normal_balance": "debit", "deleted_at": null }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 4, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Rows with a non-null `deleted_at` are never returned.
- Default sort when `sort_by` omitted: insertion order (newest first after a create).
- Returns an empty page if the active company hasn't resolved yet (no `X-Company-Id`).
