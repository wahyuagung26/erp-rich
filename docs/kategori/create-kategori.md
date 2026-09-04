---
type: API Endpoint
title: Create Kategori
description: Add a new product category. Client supplies `code`; server assigns `id`.
method: POST
path: /kategori
status: mock
tags: [kategori, write]
resource: /frontend/src/mocks/modules/kategori.ts
timestamp: 2026-09-04T11:00:00Z
---

# Create Kategori

Backs `views/kategori/pages/PageKategoriTambah.vue`. Client-side validation:
`frontend/src/views/kategori/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "ELK", "name": "Elektronik" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |

`id` and `company_id` are **not** accepted from the client — the server assigns
them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 4, "company_id": 1, "code": "ELK", "name": "Elektronik", "deleted_at": null }, "message": "Kategori ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode kategori sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
