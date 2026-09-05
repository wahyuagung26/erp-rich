---
type: API Endpoint
title: Delete Account Group
description: Soft-delete an account group — sets `deleted_at`, keeps the row.
method: DELETE
path: /account-group/:id
status: mock
tags: [account-group, write]
resource: /frontend/src/mocks/modules/account-group.ts
timestamp: 2026-09-05T09:00:00Z
---

# Delete Account Group

Backs the delete action in `PageAccountGroupTable.vue` (row) and `PageAccountGroupDetail.vue`,
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
  After this the account group is invisible to [list-account-group](./list-account-group.md) and
  [get-account-group](./get-account-group.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /account-group/:id/restore` when the UI needs it.
