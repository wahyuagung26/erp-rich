---
type: API Endpoint
title: Delete Satuan
description: Soft-delete a unit of measure — sets `deleted_at`, keeps the row.
method: DELETE
path: /satuan/:id
status: mock
tags: [satuan, write]
resource: /frontend/src/mocks/modules/satuan.ts
timestamp: 2026-09-04T12:00:00Z
---

# Delete Satuan

Backs the delete action in `PageSatuanTable.vue` (row) and `PageSatuanDetail.vue`,
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
{ "message": "Satuan dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Satuan tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the unit is invisible to [list-satuan](./list-satuan.md) and
  [get-satuan](./get-satuan.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /satuan/:id/restore` when the UI needs it.
