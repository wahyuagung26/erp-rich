---
type: API Endpoint
title: Delete Unit
description: Soft-delete a unit of measure — sets `deleted_at`, keeps the row.
method: DELETE
path: /unit/:id
status: mock
tags: [unit, write]
resource: /frontend/src/mocks/modules/unit.ts
timestamp: 2026-09-09T00:00:00Z
---

# Delete Unit

Backs the delete action in `PageUnitTable.vue` (row) and `PageUnitDetail.vue`,
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
{ "message": "Unit dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Unit tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the unit is invisible to [list-unit](./list-unit.md) and
  [get-unit](./get-unit.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /unit/:id/restore` when the UI needs it.
