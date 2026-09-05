---
type: API Endpoint
title: Create Brand
description: Add a new product brand. Client supplies `code`; server assigns `id`.
method: POST
path: /brand
status: mock
tags: [brand, write]
resource: /frontend/src/mocks/modules/brand.ts
timestamp: 2026-09-05T00:00:00Z
---

# Create Brand

Backs `views/brand/pages/PageBrandTambah.vue`. Client-side validation:
`frontend/src/views/brand/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "SGT", "name": "Samsung" }
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
{ "data": { "id": 4, "company_id": 1, "code": "SGT", "name": "Samsung", "deleted_at": null }, "message": "Merk ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode merk sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
