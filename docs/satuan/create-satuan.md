---
type: API Endpoint
title: Create Satuan
description: Add a new unit of measure. Client supplies `code`; server assigns `id`.
method: POST
path: /satuan
status: mock
tags: [satuan, write]
resource: /frontend/src/mocks/modules/satuan.ts
timestamp: 2026-09-04T12:00:00Z
---

# Create Satuan

Backs `views/satuan/pages/PageSatuanTambah.vue`. Client-side validation:
`frontend/src/views/satuan/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "PCS", "name": "Pieces" }
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
{ "data": { "id": 4, "company_id": 1, "code": "PCS", "name": "Pieces", "deleted_at": null }, "message": "Satuan ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode satuan sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
