---
type: API Endpoint
title: Delete Group Akun
description: Soft-delete an account group — sets `deleted_at`, keeps the row.
method: DELETE
path: /group-akun/:id
status: mock
tags: [group-akun, write]
resource: /frontend/src/mocks/modules/group-akun.ts
timestamp: 2026-09-05T09:00:00Z
---

# Delete Group Akun

Backs the delete action in `PageGroupAkunTable.vue` (row) and `PageGroupAkunDetail.vue`,
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
{ "message": "Group akun dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Group akun tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the group akun is invisible to [list-group-akun](./list-group-akun.md) and
  [get-group-akun](./get-group-akun.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /group-akun/:id/restore` when the UI needs it.
