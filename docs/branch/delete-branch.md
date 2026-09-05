---
type: API Endpoint
title: Delete Branch
description: Soft-delete a branch — sets `deleted_at`, keeps the row.
method: DELETE
path: /branch/:id
status: mock
tags: [branch, write]
resource: /frontend/src/mocks/modules/branch.ts
timestamp: 2026-09-05T00:00:00Z
---

# Delete Branch

Backs the delete action in `PageBranchTable.vue` (row) and `PageBranchDetail.vue`,
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
{ "message": "Cabang dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Cabang tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the branch is invisible to [list-branch](./list-branch.md) and
  [get-branch](./get-branch.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /branch/:id/restore` when the UI needs it.
