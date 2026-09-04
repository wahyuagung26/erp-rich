---
type: API Endpoint
title: Delete Jenis Penjualan
description: Soft-delete a sales type — sets `deleted_at`, keeps the row.
method: DELETE
path: /jenis-penjualan/:id
status: mock
tags: [jenis-penjualan, write]
resource: /frontend/src/mocks/modules/jenis-penjualan.ts
timestamp: 2026-09-05T12:00:00Z
---

# Delete Jenis Penjualan

Backs the delete action in `PageJenisPenjualanTable.vue` (row) and
`PageJenisPenjualanDetail.vue`, both behind a confirm dialog.

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
  After this the sales type is invisible to [list-jenis-penjualan](./list-jenis-penjualan.md)
  and [get-jenis-penjualan](./get-jenis-penjualan.md), and its `code` frees up for
  reuse within the company.
- No restore endpoint yet — add `POST /jenis-penjualan/:id/restore` when the UI needs it.
