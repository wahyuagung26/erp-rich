---
type: API Endpoint
title: Delete Sales Expense
description: Soft-delete a sales expense — sets `deleted_at`, keeps the row.
method: DELETE
path: /sales-expense/:id
status: mock
tags: [sales-expense, write]
resource: /frontend/src/mocks/modules/sales-expense.ts
timestamp: 2026-11-04T14:00:00Z
---

# Delete Sales Expense

Backs the delete action in `PageSalesExpenseTable.vue` (row) and `PageSalesExpenseDetail.vue`, both
behind a confirm dialog.

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
{ "message": "Biaya penjualan dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Biaya penjualan tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp. After this the
  sales expense is invisible to [list-sales-expense](./list-sales-expense.md) and
  [get-sales-expense](./get-sales-expense.md), and its `code` frees up for reuse within the company.
- No restore endpoint yet — add `POST /sales-expense/:id/restore` when the UI needs it.
