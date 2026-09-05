---
type: API Endpoint
title: Delete Department
description: Soft-delete a department — sets `deleted_at`, keeps the row.
method: DELETE
path: /department/:id
status: mock
tags: [department, write]
resource: /frontend/src/mocks/modules/department.ts
timestamp: 2026-09-05T00:00:00Z
---

# Delete Department

Backs the delete action in `PageDepartmentTable.vue` (row) and `PageDepartmentDetail.vue`,
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
{ "message": "Department dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Department tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the department is invisible to [list-departemen](./list-department.md) and
  [get-departemen](./get-department.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /departemen/:id/restore` when the UI needs it.
