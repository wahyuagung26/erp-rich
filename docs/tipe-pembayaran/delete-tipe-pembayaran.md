---
type: API Endpoint
title: Delete Tipe Pembayaran
description: Soft-delete a payment type — sets `deleted_at`, keeps the row.
method: DELETE
path: /tipe-pembayaran/:id
status: mock
tags: [tipe-pembayaran, write]
resource: /frontend/src/mocks/modules/tipe-pembayaran.ts
timestamp: 2026-09-05T13:00:00Z
---

# Delete Tipe Pembayaran

Backs the delete action in `PageTipePembayaranTable.vue` (row) and
`PageTipePembayaranDetail.vue`, both behind a confirm dialog.

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
  After this the payment type is invisible to [list-tipe-pembayaran](./list-tipe-pembayaran.md)
  and [get-tipe-pembayaran](./get-tipe-pembayaran.md), and its `code` frees up for
  reuse within the company.
- No restore endpoint yet — add `POST /tipe-pembayaran/:id/restore` when the UI needs it.
