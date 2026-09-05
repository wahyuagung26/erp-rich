---
type: API Endpoint
title: Create Branch
description: Add a new branch. Client supplies `code`; server assigns `id`.
method: POST
path: /branch
status: mock
tags: [branch, write]
resource: /frontend/src/mocks/modules/branch.ts
timestamp: 2026-09-05T00:00:00Z
---

# Create Branch

Backs `views/branch/pages/PageBranchTambah.vue`. Client-side validation:
`frontend/src/views/branch/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "PST", "name": "Kantor Pusat", "address": "Jl. Kaum Kaler, Manonjaya, Tasikmalaya" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `address` | string | optional |

`id` and `company_id` are **not** accepted from the client — the server assigns
them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 4, "company_id": 1, "code": "PST", "name": "Kantor Pusat", "address": "...", "deleted_at": null }, "message": "Cabang ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode cabang sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
