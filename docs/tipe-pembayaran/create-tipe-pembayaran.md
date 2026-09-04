---
type: API Endpoint
title: Create Tipe Pembayaran
description: Add a new payment type. Client supplies `code` + account id + enums; server assigns `id` and resolves the account's code/name.
method: POST
path: /tipe-pembayaran
status: mock
tags: [tipe-pembayaran, write]
resource: /frontend/src/mocks/modules/tipe-pembayaran.ts
timestamp: 2026-09-05T13:00:00Z
---

# Create Tipe Pembayaran

Backs `views/tipe-pembayaran/pages/PageTipePembayaranTambah.vue`. Client-side
validation: `frontend/src/views/tipe-pembayaran/schema.ts` (valibot) — the backend
must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "TP01", "name": "Tunai", "akun_perkiraan_id": 1, "transaksi": "penjualan", "jenis": "tunai" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `akun_perkiraan_id` | number | required; must be a non-deleted `AkunPerkiraan` belonging to the active company |
| `transaksi` | enum | required; `pembelian` \| `penjualan` |
| `jenis` | enum | required; `tunai` \| `potong_retur` \| `uang_muka` |

`id`, `company_id`, `akun_perkiraan_code`, `akun_perkiraan_name` are **not**
accepted from the client — the server assigns/resolves them (`company_id` from
the active company, see [conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{
  "data": {
    "id": 3, "company_id": 1, "code": "TP01", "name": "Tunai",
    "akun_perkiraan_id": 1, "akun_perkiraan_code": "1000101", "akun_perkiraan_name": "Kas Kecil",
    "transaksi": "penjualan", "jenis": "tunai", "deleted_at": null
  },
  "message": "Tipe pembayaran ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode tipe pembayaran sudah dipakai"] } }` |
| `422` | `akun_perkiraan_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "akun_perkiraan_id": ["Akun perkiraan tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
