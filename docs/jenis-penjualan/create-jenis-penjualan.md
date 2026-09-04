---
type: API Endpoint
title: Create Jenis Penjualan
description: Add a new sales type. Client supplies `code` + four account ids; server assigns `id` and resolves each account's code/name.
method: POST
path: /jenis-penjualan
status: mock
tags: [jenis-penjualan, write]
resource: /frontend/src/mocks/modules/jenis-penjualan.ts
timestamp: 2026-09-05T12:00:00Z
---

# Create Jenis Penjualan

Backs `views/jenis-penjualan/pages/PageJenisPenjualanTambah.vue`. Client-side
validation: `frontend/src/views/jenis-penjualan/schema.ts` (valibot) — the backend
must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "RC0007", "name": "Bahan Baku", "akun_pendapatan_id": 5, "akun_hpp_id": 6, "akun_persediaan_id": 7, "akun_biaya_id": 2 }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `akun_pendapatan_id` | number | required; must be a non-deleted `AkunPerkiraan` belonging to the active company |
| `akun_hpp_id` | number | required; same rule as `akun_pendapatan_id` |
| `akun_persediaan_id` | number | required; same rule as `akun_pendapatan_id` |
| `akun_biaya_id` | number | required; same rule as `akun_pendapatan_id` |

`id`, `company_id`, and every `akun_*_code`/`akun_*_name` are **not** accepted from
the client — the server assigns/resolves them (`company_id` from the active
company, see [conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{
  "data": {
    "id": 2, "company_id": 1, "code": "RC0007", "name": "Bahan Baku",
    "akun_pendapatan_id": 5, "akun_pendapatan_code": "4000101", "akun_pendapatan_name": "Penjualan Produk",
    "akun_hpp_id": 6, "akun_hpp_code": "6000102", "akun_hpp_name": "Biaya Bahan Baku",
    "akun_persediaan_id": 7, "akun_persediaan_code": "1000102", "akun_persediaan_name": "Persediaan Bahan Baku",
    "akun_biaya_id": 2, "akun_biaya_code": "6000101", "akun_biaya_name": "Beban Gaji Pokok",
    "deleted_at": null
  },
  "message": "Jenis penjualan ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode jenis sudah dipakai"] } }` |
| `422` | `akun_pendapatan_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "akun_pendapatan_id": ["Akun pendapatan tidak valid"] } }` |
| `422` | `akun_hpp_id` invalid (same conditions) | `{ "message": "...", "errors": { "akun_hpp_id": ["Akun HPP tidak valid"] } }` |
| `422` | `akun_persediaan_id` invalid (same conditions) | `{ "message": "...", "errors": { "akun_persediaan_id": ["Akun persediaan tidak valid"] } }` |
| `422` | `akun_biaya_id` invalid (same conditions) | `{ "message": "...", "errors": { "akun_biaya_id": ["Akun biaya tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
