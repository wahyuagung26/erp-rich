---
type: API Endpoint
title: Delete Sales Type
description: Soft-delete a sales type — sets `deleted_at`, keeps the row.
method: DELETE
path: /sales-type/:id
status: mock
tags: [sales-type, write]
resource: /frontend/src/mocks/modules/sales-type.ts
timestamp: 2026-09-05T12:00:00Z
---

# Delete Sales Type

Backs the delete action in `PageSalesTypeTable.vue` (row) and
`PageSalesTypeDetail.vue`, both behind a confirm dialog.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

## Response

`200`:

```json
{ "message": "Jenis penjualan dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis penjualan tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the sales type is invisible to [list-sales-type](./list-sales-type.md)
  and [get-sales-type](./get-sales-type.md), and its `code` frees up for
  reuse within the company.
- No restore endpoint yet — add `POST /sales-type/:id/restore` when the UI needs it.
