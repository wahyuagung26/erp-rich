---
type: API Endpoint
title: List Customer
description: Paginated, filterable, sortable list of customers. Soft-deleted rows are excluded.
method: GET
path: /customer
status: mock
tags: [customer, read, list]
resource: /frontend/src/mocks/modules/customer.ts
timestamp: 2026-09-04T10:00:00Z
---

# List Customer

Backs `views/customer/pages/PageCustomerTable.vue` (via the `useTableList` composable).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | sent automatically by the frontend, not a user-facing filter; see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `code`, `name`, `city` |
| `q` | string | no | matches `code` + `name`, case-insensitive |
| `pkp` | boolean | no | `true` / `false` |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "company_id": 1, "code": "CUST-0001", "name": "PT Samudra Edukasi Raya",
      "phone": "0812-3456-7890", "email": "akuntansi@sera.co.id",
      "address": "Perum Griya Sakinah Al Kautsar Blok C No 30, Jiwan", "city": "Madiun",
      "bank_name": "BCA", "bank_account": "1234567890",
      "npwp": "1000-0000-0746-8535", "pkp": false, "top_days": 30, "notes": "",
      "deleted_at": null
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 6, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Rows with a non-null `deleted_at` are never returned.
- Default sort when `sort_by` omitted: insertion order (newest first after a create).
- Returns an empty page if the active company hasn't resolved yet (no `X-Company-Id`).
