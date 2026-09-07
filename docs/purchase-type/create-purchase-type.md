---
type: API Endpoint
title: Create Purchase Type
description: Add a new purchase type. Client supplies `code`; server assigns `id`.
method: POST
path: /purchase-type
status: mock
tags: [purchase-type, write]
resource: /frontend/src/mocks/modules/purchase-type.ts
timestamp: 2026-09-07T00:00:00Z
---

# Create Purchase Type

Backs `views/purchase-type/pages/PagePurchaseTypeTambah.vue`. Client-side
validation: `frontend/src/views/purchase-type/schema.ts` (valibot) — the backend
must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "IMPOR", "name": "Pembelian Impor", "notes": "Pembelian dari supplier luar negeri" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; **uppercase `A-Z` only, 1-5 characters** (`/^[A-Z]{1,5}$/`); unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `notes` | string | optional |

`id` and `company_id` are **not** accepted from the client — the server assigns
them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 4, "company_id": 1, "code": "IMPOR", "name": "Pembelian Impor", "notes": "...", "deleted_at": null }, "message": "Jenis pembelian ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `code` is not 1-5 uppercase letters | `{ "message": "...", "errors": { "code": ["Kode harus huruf kapital A-Z, maksimal 5 karakter"] } }` |
| `422` | `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode jenis pembelian sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
