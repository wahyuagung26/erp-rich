---
type: API Endpoint
title: Delete Akun Perkiraan
description: Soft-delete a detail account — sets `deleted_at`, keeps the row.
method: DELETE
path: /akun-perkiraan/:id
status: mock
tags: [akun-perkiraan, write]
resource: /frontend/src/mocks/modules/akun-perkiraan.ts
timestamp: 2026-09-05T11:00:00Z
---

# Delete Akun Perkiraan

Backs the delete action in `PageAkunPerkiraanTable.vue` (row) and
`PageAkunPerkiraanDetail.vue`, both behind a confirm dialog.

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
  After this the account is invisible to [list-akun-perkiraan](./list-akun-perkiraan.md)
  and [get-akun-perkiraan](./get-akun-perkiraan.md), and its `code` frees up for
  reuse within the company.
- No restore endpoint yet — add `POST /akun-perkiraan/:id/restore` when the UI needs it.
