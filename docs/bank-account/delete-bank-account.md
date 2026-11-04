---
type: API Endpoint
title: Delete Sales Expense
description: Soft-delete a sales expense — sets `deleted_at`, keeps the row.
method: DELETE
path: /bank-account/:id
status: mock
tags: [bank-account, write]
resource: /frontend/src/mocks/modules/bank-account.ts
timestamp: 2026-11-04T15:00:00Z
---

# Delete Sales Expense

Backs the delete action in `PageBankAccountTable.vue` (row) and `PageBankAccountDetail.vue`, both
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
{ "message": "Rekening bank dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Rekening bank tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp. After this the
  sales expense is invisible to [list-bank-account](./list-bank-account.md) and
  [get-bank-account](./get-bank-account.md).
- No restore endpoint yet — add `POST /bank-account/:id/restore` when the UI needs it.
