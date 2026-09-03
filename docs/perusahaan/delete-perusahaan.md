---
type: API Endpoint
title: Delete Perusahaan
description: Soft-delete a company — sets `deleted_at`, keeps the row.
method: DELETE
path: /perusahaan/:id
status: mock
tags: [perusahaan, write]
resource: /frontend/src/mocks/modules/perusahaan.ts
timestamp: 2026-09-03T16:00:00Z
---

# Delete Perusahaan

Backs the delete action in `PagePerusahaanTable.vue` (row) and `PagePerusahaanDetail.vue`,
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
  After this the company is invisible to [list-perusahaan](./list-perusahaan.md) and
  [get-perusahaan](./get-perusahaan.md), and its `code` frees up for reuse.
- No restore endpoint yet — add `POST /perusahaan/:id/restore` when the UI needs it.
