---
type: API Endpoint
title: List Tipe Pembayaran
description: Paginated, filterable, sortable list of payment types. Soft-deleted rows are excluded.
method: GET
path: /tipe-pembayaran
status: mock
tags: [tipe-pembayaran, read, list]
resource: /frontend/src/mocks/modules/tipe-pembayaran.ts
timestamp: 2026-09-05T13:00:00Z
---

# List Tipe Pembayaran

Backs `views/tipe-pembayaran/pages/PageTipePembayaranTable.vue` (via the `useTableList` composable).

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
      "id": 1, "company_id": 1, "code": "TP01", "name": "Tunai",
      "akun_perkiraan_id": 1, "akun_perkiraan_code": "1000101", "akun_perkiraan_name": "Kas Kecil",
      "transaksi": "penjualan", "jenis": "tunai", "deleted_at": null
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 2, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Rows with a non-null `deleted_at` are never returned.
- Default sort when `sort_by` omitted: insertion order (newest first after a create).
- Returns an empty page if the active company hasn't resolved yet (no `X-Company-Id`).
