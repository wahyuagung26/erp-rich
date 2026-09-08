---
type: API Endpoint
title: Delete Brand
description: Soft-delete a product brand — sets `deleted_at`, keeps the row.
method: DELETE
path: /brand/:id
status: mock
tags: [brand, write]
resource: /frontend/src/mocks/modules/brand.ts
timestamp: 2026-09-09T00:00:00Z
---

# Delete Brand

Backs the delete action in `PageBrandTable.vue` (row) and `PageBrandDetail.vue`, both
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
  After this the brand is invisible to [list-brand](./list-brand.md) and
  [get-brand](./get-brand.md), and its `code` frees up for reuse.
- No restore endpoint yet — add `POST /brand/:id/restore` when the UI needs it.
