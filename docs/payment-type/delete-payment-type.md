---
type: API Endpoint
title: Delete Payment Type
description: Soft-delete a payment type — sets `deleted_at`, keeps the row.
method: DELETE
path: /payment-type/:id
status: mock
tags: [payment-type, write]
resource: /frontend/src/mocks/modules/payment-type.ts
timestamp: 2026-09-05T13:00:00Z
---

# Delete Payment Type

Backs the delete action in `PagePaymentTypeTable.vue` (row) and
`PagePaymentTypeDetail.vue`, both behind a confirm dialog.

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
{ "message": "Tipe pembayaran dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Tipe pembayaran tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the payment type is invisible to [list-payment-type](./list-payment-type.md)
  and [get-payment-type](./get-payment-type.md), and its `code` frees up for
  reuse within the company.
- No restore endpoint yet — add `POST /payment-type/:id/restore` when the UI needs it.
