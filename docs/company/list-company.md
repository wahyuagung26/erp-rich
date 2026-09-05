---
type: API Endpoint
title: List Company
description: Paginated, filterable, sortable list of companies. Soft-deleted rows are excluded.
method: GET
path: /company
status: mock
tags: [company, read, list]
resource: /frontend/src/mocks/modules/company.ts
timestamp: 2026-09-05T00:00:00Z
---

# List Company

Backs `views/company/pages/PageCompanyTable.vue` (via the `useTableList` composable).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `code`, `short_name`, `company_type` |
| `q` | string | no | matches `code` + `short_name` + `legal_name`, case-insensitive |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "code": "RIN", "short_name": "PT RIN",
      "legal_name": "PT Rahadhyan Integrasi Nusantara",
      "npwp": "31.234.567.8-421.000", "logo_url": "",
      "address": "Jalan Kaum Kaler, RT.023/RW.003, Manonjaya, Kab. Tasikmalaya, Jawa Barat",
      "company_type": "pt", "hr_enabled": true,
      "report_header_color": "#B0F2B1", "deleted_at": null
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 3, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Rows with a non-null `deleted_at` are never returned.
- Default sort when `sort_by` omitted: insertion order (newest first after a create).
