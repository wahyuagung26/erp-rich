---
type: API Endpoint
title: Delete Sales
description: Soft-delete a sales rep — sets `deleted_at`, keeps the row.
method: DELETE
path: /sales/:id
status: mock
tags: [sales, write]
resource: /frontend/src/mocks/modules/sales.ts
timestamp: 2026-09-07T00:00:00Z
---

# Delete Sales

Backs the delete action in `PageSalesTable.vue` (row) and `PageSalesDetail.vue`,
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
{ "message": "Sales dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Sales tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the sales rep is invisible to [list-sales](./list-sales.md) and
  [get-sales](./get-sales.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /sales/:id/restore` when the UI needs it.
