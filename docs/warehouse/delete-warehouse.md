---
type: API Endpoint
title: Delete Warehouse
description: Soft-delete a warehouse — sets `deleted_at`, keeps the row.
method: DELETE
path: /warehouse/:id
status: mock
tags: [warehouse, write]
resource: /frontend/src/mocks/modules/warehouse.ts
timestamp: 2026-09-05T15:00:00Z
---

# Delete Warehouse

Backs the delete action in `PageWarehouseTable.vue` (row) and `PageWarehouseDetail.vue`,
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
{ "message": "Gudang dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Gudang tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the warehouse is invisible to [list-warehouse](./list-warehouse.md) and
  [get-warehouse](./get-warehouse.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /warehouse/:id/restore` when the UI needs it.
