---
type: API Endpoint
title: Delete Departemen
description: Soft-delete a department — sets `deleted_at`, keeps the row.
method: DELETE
path: /departemen/:id
status: mock
tags: [departemen, write]
resource: /frontend/src/mocks/modules/departemen.ts
timestamp: 2026-09-04T14:00:00Z
---

# Delete Departemen

Backs the delete action in `PageDepartemenTable.vue` (row) and `PageDepartemenDetail.vue`,
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
{ "message": "Departemen dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Departemen tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the department is invisible to [list-departemen](./list-departemen.md) and
  [get-departemen](./get-departemen.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /departemen/:id/restore` when the UI needs it.
