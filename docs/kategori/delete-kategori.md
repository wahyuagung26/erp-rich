---
type: API Endpoint
title: Delete Kategori
description: Soft-delete a product category — sets `deleted_at`, keeps the row.
method: DELETE
path: /kategori/:id
status: mock
tags: [kategori, write]
resource: /frontend/src/mocks/modules/kategori.ts
timestamp: 2026-09-04T11:00:00Z
---

# Delete Kategori

Backs the delete action in `PageKategoriTable.vue` (row) and `PageKategoriDetail.vue`,
both behind a confirm dialog.

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
{ "message": "Kategori dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Kategori tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the category is invisible to [list-kategori](./list-kategori.md) and
  [get-kategori](./get-kategori.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /kategori/:id/restore` when the UI needs it.
