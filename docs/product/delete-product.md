---
type: API Endpoint
title: Delete Product
description: Soft-delete a product — sets `deleted_at`, keeps the row.
method: DELETE
path: /product/:id
status: mock
tags: [product, write]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-09-07T00:00:00Z
---

# Delete Product

Backs the delete action in `PageProductTable.vue` (row) and
`PageProductDetail.vue`, both behind a confirm dialog.

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
{ "message": "Produk dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Produk tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the product is invisible to [list-product](./list-product.md) and
  [get-product](./get-product.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /product/:id/restore` when the UI needs it.
