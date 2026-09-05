---
type: API Endpoint
title: Create Warehouse
description: Add a new warehouse. Client supplies `code` + `branch_id`; server assigns `id` and resolves `branch_code`/`branch_name`.
method: POST
path: /warehouse
status: mock
tags: [warehouse, write]
resource: /frontend/src/mocks/modules/warehouse.ts
timestamp: 2026-09-05T15:00:00Z
---

# Create Warehouse

Backs `views/warehouse/pages/PageWarehouseTambah.vue`. Client-side validation:
`frontend/src/views/warehouse/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "GD1", "name": "Gudang Pusat", "branch_id": 1, "address": "Jl. Kaum Kaler, Manonjaya, Tasikmalaya" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `branch_id` | number | required; must be a non-deleted `Branch` belonging to the active company |
| `address` | string | optional |

`id`, `company_id`, `branch_code`, `branch_name` are **not** accepted from the client —
the server assigns/resolves them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 4, "company_id": 1, "code": "GD1", "name": "Gudang Pusat", "branch_id": 1, "branch_code": "PST", "branch_name": "Kantor Pusat", "address": "Jl. Kaum Kaler, Manonjaya, Tasikmalaya", "deleted_at": null }, "message": "Gudang ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode gudang sudah dipakai"] } }` |
| `422` | `branch_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "branch_id": ["Cabang tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
