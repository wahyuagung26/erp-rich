---
type: API Endpoint
title: Update Tipe Pembayaran
description: Edit an existing payment type's name, account, or classification. Code is immutable.
method: PUT
path: /tipe-pembayaran/:id
status: mock
tags: [tipe-pembayaran, write]
resource: /frontend/src/mocks/modules/tipe-pembayaran.ts
timestamp: 2026-09-05T13:00:00Z
---

# Update Tipe Pembayaran

Backs `views/tipe-pembayaran/pages/PageTipePembayaranEdit.vue`. The form shows
`code` disabled — this endpoint ignores `code` even if sent; `name`,
`akun_perkiraan_id`, `transaksi`, and `jenis` can change.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

```json
{ "name": "Tunai Kasir", "akun_perkiraan_id": 1, "transaksi": "penjualan", "jenis": "tunai" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...TipePembayaran }, "message": "Tipe pembayaran diperbarui" }` —
`akun_perkiraan_code`/`akun_perkiraan_name` are re-resolved from the (possibly
changed) `akun_perkiraan_id`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Tipe pembayaran tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | `akun_perkiraan_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "akun_perkiraan_id": ["Akun perkiraan tidak valid"] } }` |
