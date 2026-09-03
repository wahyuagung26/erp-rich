---
type: API Endpoint
title: Delete Supplier
description: Soft-delete a supplier — sets `deleted_at`, keeps the row.
method: DELETE
path: /supplier/:id
status: mock
tags: [supplier, write]
resource: /frontend/src/mocks/modules/supplier.ts
timestamp: 2026-09-03T13:30:00Z
---

# Delete Supplier

Backs the delete action in `PageSupplierTable.vue` (row) and `PageSupplierDetail.vue`,
both behind a confirm dialog.

## Request

### Path params

| Name | Type |
|---|---|
| `id` | number |

## Response

`200`:

```json
{ "message": "Supplier dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or already soft-deleted | `{ "message": "Supplier tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO
  timestamp. After this the supplier is invisible to [list-supplier](./list-supplier.md)
  and [get-supplier](./get-supplier.md).
- No restore endpoint yet — soft-deleted rows are recoverable only at the DB
  level. Add `POST /supplier/:id/restore` when the UI needs it.
