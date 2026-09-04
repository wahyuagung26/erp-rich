---
type: API Endpoint
title: List Jenis Penjualan
description: Paginated, filterable, sortable list of sales types. Soft-deleted rows are excluded.
method: GET
path: /jenis-penjualan
status: mock
tags: [jenis-penjualan, read, list]
resource: /frontend/src/mocks/modules/jenis-penjualan.ts
timestamp: 2026-09-05T12:00:00Z
---

# List Jenis Penjualan

Backs `views/jenis-penjualan/pages/PageJenisPenjualanTable.vue` (via the `useTableList` composable).

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
      "akun_pendapatan_id": 5, "akun_pendapatan_code": "4000101", "akun_pendapatan_name": "Penjualan Produk",
      "akun_hpp_id": 6, "akun_hpp_code": "6000102", "akun_hpp_name": "Biaya Bahan Baku",
      "akun_persediaan_id": 7, "akun_persediaan_code": "1000102", "akun_persediaan_name": "Persediaan Bahan Baku",
      "akun_biaya_id": 2, "akun_biaya_code": "6000101", "akun_biaya_name": "Beban Gaji Pokok",
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
