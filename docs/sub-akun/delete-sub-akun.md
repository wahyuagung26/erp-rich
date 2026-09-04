---
type: API Endpoint
title: Delete Sub Akun
description: Soft-delete a sub-account — sets `deleted_at`, keeps the row.
method: DELETE
path: /sub-akun/:id
status: mock
tags: [sub-akun, write]
resource: /frontend/src/mocks/modules/sub-akun.ts
timestamp: 2026-09-05T10:00:00Z
---

# Delete Sub Akun

Backs the delete action in `PageSubAkunTable.vue` (row) and `PageSubAkunDetail.vue`,
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
  After this the sub akun is invisible to [list-sub-akun](./list-sub-akun.md) and
  [get-sub-akun](./get-sub-akun.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /sub-akun/:id/restore` when the UI needs it.
