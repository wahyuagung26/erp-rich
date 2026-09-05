---
type: API Endpoint
title: Delete Sub Account
description: Soft-delete a sub-account — sets `deleted_at`, keeps the row.
method: DELETE
path: /sub-account/:id
status: mock
tags: [sub-account, write]
resource: /frontend/src/mocks/modules/sub-account.ts
timestamp: 2026-09-05T10:00:00Z
---

# Delete Sub Account

Backs the delete action in `PageSubAccountTable.vue` (row) and `PageSubAccountDetail.vue`,
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
{ "message": "Sub akun dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Sub akun tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the sub account is invisible to [list-sub-account](./list-sub-account.md) and
  [get-sub-account](./get-sub-account.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /sub-account/:id/restore` when the UI needs it.
