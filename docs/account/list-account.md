---
type: API Endpoint
title: List Account
description: Paginated, filterable, sortable list of detail accounts. Soft-deleted rows are excluded.
method: GET
path: /account
status: mock
tags: [account, read, list]
resource: /frontend/src/mocks/modules/account.ts
timestamp: 2026-09-07T16:00:00Z
---

# List Account

Backs `views/account/pages/PageAccountTable.vue` (via the `useTableList` composable).

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
| `type` | enum | no | filter to one account type (`cash_bank` \| `asset` \| `liability` \| `equity` \| `revenue` \| `expense`); used by the Jurnal Pengeluaran cash-account picker |

## Response

`200`:

```json
{
  "data": [
    { "id": 1, "company_id": 1, "sub_account_id": 1, "sub_account_code": "10001", "sub_account_name": "Kas", "code": "1000101", "name": "Kas Kecil", "type": "asset", "deleted_at": null }
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
