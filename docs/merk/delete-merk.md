---
type: API Endpoint
title: Delete Merk
description: Soft-delete a product brand — sets `deleted_at`, keeps the row.
method: DELETE
path: /merk/:id
status: mock
tags: [merk, write]
resource: /frontend/src/mocks/modules/merk.ts
timestamp: 2026-09-04T10:00:00Z
---

# Delete Merk

Backs the delete action in `PageMerkTable.vue` (row) and `PageMerkDetail.vue`, both
behind a confirm dialog.

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
{ "message": "Merk dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Merk tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the brand is invisible to [list-merk](./list-merk.md) and
  [get-merk](./get-merk.md), and its `code` frees up for reuse.
- No restore endpoint yet — add `POST /merk/:id/restore` when the UI needs it.
