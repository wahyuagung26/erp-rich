---
type: API Endpoint
title: List Supplier
description: Paginated, filterable, sortable list of suppliers. Soft-deleted rows are excluded.
method: GET
path: /supplier
status: mock
tags: [supplier, read, list]
resource: /frontend/src/mocks/modules/supplier.ts
timestamp: 2026-09-03T00:00:00Z
---

# List Supplier

Backs `views/supplier/pages/PageSupplierTable.vue` (via the `useTableList` composable).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `code`, `name`, `city` |
| `q` | string | no | matches `code` + `name` + `contact_person`, case-insensitive |
| `pkp` | boolean | no | `true` / `false` |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "code": "SUP-0001", "name": "PT Sumber Rejeki", "address": "Jl. Merdeka 10",
      "city": "Surabaya", "phone": "031-5551000", "fax": "", "email": "sales@sumberrejeki.co.id",
      "contact_person": "Budi", "npwp": "01.234.567.8-901.000", "pkp": true,
      "bank_name": "BCA", "bank_account": "1234567890", "top_days": 30, "notes": "",
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
