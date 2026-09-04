---
type: API Endpoint
title: Delete Gudang
description: Soft-delete a warehouse — sets `deleted_at`, keeps the row.
method: DELETE
path: /gudang/:id
status: mock
tags: [gudang, write]
resource: /frontend/src/mocks/modules/gudang.ts
timestamp: 2026-09-04T15:00:00Z
---

# Delete Gudang

Backs the delete action in `PageGudangTable.vue` (row) and `PageGudangDetail.vue`,
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
  After this the warehouse is invisible to [list-gudang](./list-gudang.md) and
  [get-gudang](./get-gudang.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /gudang/:id/restore` when the UI needs it.
