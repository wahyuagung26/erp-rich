---
type: API Endpoint
title: Delete Company
description: Soft-delete a company — sets `deleted_at`, keeps the row.
method: DELETE
path: /company/:id
status: mock
tags: [company, write]
resource: /frontend/src/mocks/modules/company.ts
timestamp: 2026-09-05T00:00:00Z
---

# Delete Company

Backs the delete action in `PageCompanyTable.vue` (row) and `PageCompanyDetail.vue`,
both behind a confirm dialog.

## Request

### Path params

| Name | Type |
|---|---|
| `id` | number |

## Response

`200`:

```json
{ "message": "Perusahaan dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or already soft-deleted | `{ "message": "Perusahaan tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the company is invisible to [list-company](./list-company.md) and
  [get-company](./get-company.md), and its `code` frees up for reuse.
- No restore endpoint yet — add `POST /company/:id/restore` when the UI needs it.
