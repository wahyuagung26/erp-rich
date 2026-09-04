---
type: API Endpoint
title: Delete Customer
description: Soft-delete a customer — sets `deleted_at`, keeps the row.
method: DELETE
path: /customer/:id
status: mock
tags: [customer, write]
resource: /frontend/src/mocks/modules/customer.ts
timestamp: 2026-09-04T10:00:00Z
---

# Delete Customer

Backs the delete action in `PageCustomerTable.vue` (row) and `PageCustomerDetail.vue`,
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
{ "message": "Customer dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Customer tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO
  timestamp. After this the customer is invisible to [list-customer](./list-customer.md)
  and [get-customer](./get-customer.md).
- No restore endpoint yet — soft-deleted rows are recoverable only at the DB
  level. Add `POST /customer/:id/restore` when the UI needs it.
