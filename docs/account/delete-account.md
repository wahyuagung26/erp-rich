---
type: API Endpoint
title: Delete Account
description: Soft-delete a detail account — sets `deleted_at`, keeps the row.
method: DELETE
path: /account/:id
status: mock
tags: [account, write]
resource: /frontend/src/mocks/modules/account.ts
timestamp: 2026-09-05T11:00:00Z
---

# Delete Account

Backs the delete action in `PageAccountTable.vue` (row) and
`PageAccountDetail.vue`, both behind a confirm dialog.

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
{ "message": "Akun perkiraan dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Akun perkiraan tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the account is invisible to [list-account](./list-account.md)
  and [get-account](./get-account.md), and its `code` frees up for
  reuse within the company.
- No restore endpoint yet — add `POST /account/:id/restore` when the UI needs it.
