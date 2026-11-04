---
type: API Endpoint
title: List Sales Expense
description: Paginated, filterable, sortable list of sales expenses. Soft-deleted rows are excluded.
method: GET
path: /bank-account
status: mock
tags: [bank-account, read, list]
resource: /frontend/src/mocks/modules/bank-account.ts
timestamp: 2026-11-04T15:00:00Z
---

# List Sales Expense

Backs `views/bank-account/pages/PageBankAccountTable.vue` (via the `useTableList` composable).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | sent automatically by the frontend, not a user-facing filter; see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `bank_code`, `bank_name` |
| `q` | string | no | matches `bank_code` + `bank_name` + `account_number`, case-insensitive |

## Response

`200`:

```json
{
  "data": [
    { "id": 1, "company_id": 1, "bank_code": "CIMB", "bank_name": "Bank CIMB Niaga - 9200 (IDR)", "account_number": "800204893200", "account_holder": "PT Cakrawala Edukasi Aurora", "account_id": 17, "account_code": "1001302", "account_name": "Bank CIMB Niaga - 9200 (IDR)", "notes": "Rekening operasional", "deleted_at": null }
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
