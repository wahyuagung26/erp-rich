---
type: API Endpoint
title: Delete Purchase Type
description: Soft-delete a purchase type — sets `deleted_at`, keeps the row.
method: DELETE
path: /purchase-type/:id
status: mock
tags: [purchase-type, write]
resource: /frontend/src/mocks/modules/purchase-type.ts
timestamp: 2026-09-07T00:00:00Z
---

# Delete Purchase Type

Backs the delete action in `PagePurchaseTypeTable.vue` (row) and
`PagePurchaseTypeDetail.vue`, both behind a confirm dialog.

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
{ "message": "Jenis pembelian dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis pembelian tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the purchase type is invisible to
  [list-purchase-type](./list-purchase-type.md) and
  [get-purchase-type](./get-purchase-type.md), and its `code` frees up for reuse
  within the company.
- No restore endpoint yet — add `POST /purchase-type/:id/restore` when the UI needs it.
