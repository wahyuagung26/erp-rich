---
type: API Endpoint
title: Delete Product Category
description: Soft-delete a product category — sets `deleted_at`, keeps the row.
method: DELETE
path: /product-category/:id
status: mock
tags: [product-category, write]
resource: /frontend/src/mocks/modules/product-category.ts
timestamp: 2026-09-05T00:00:00Z
---

# Delete Product Category

Backs the delete action in `PageProductCategoryTable.vue` (row) and `PageProductCategoryDetail.vue`,
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
  After this the category is invisible to [list-product-category](./list-product-category.md) and
  [get-product-category](./get-product-category.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /product-category/:id/restore` when the UI needs it.
