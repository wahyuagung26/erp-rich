---
type: API Endpoint
title: Create Gudang
description: Add a new warehouse. Client supplies `code` + `cabang_id`; server assigns `id` and resolves `cabang_code`/`cabang_name`.
method: POST
path: /gudang
status: mock
tags: [gudang, write]
resource: /frontend/src/mocks/modules/gudang.ts
timestamp: 2026-09-04T15:00:00Z
---

# Create Gudang

Backs `views/gudang/pages/PageGudangTambah.vue`. Client-side validation:
`frontend/src/views/gudang/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "GD1", "name": "Gudang Pusat", "cabang_id": 1, "address": "Jl. Kaum Kaler, Manonjaya, Tasikmalaya" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `cabang_id` | number | required; must be a non-deleted `Cabang` belonging to the active company |
| `address` | string | optional |

`id`, `company_id`, `cabang_code`, `cabang_name` are **not** accepted from the client —
the server assigns/resolves them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 4, "company_id": 1, "code": "GD1", "name": "Gudang Pusat", "cabang_id": 1, "cabang_code": "PST", "cabang_name": "Kantor Pusat", "address": "Jl. Kaum Kaler, Manonjaya, Tasikmalaya", "deleted_at": null }, "message": "Gudang ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode gudang sudah dipakai"] } }` |
| `422` | `cabang_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "cabang_id": ["Cabang tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
