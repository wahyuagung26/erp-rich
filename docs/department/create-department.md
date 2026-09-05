---
type: API Endpoint
title: Create Department
description: Add a new department. Client supplies `code`; server assigns `id`.
method: POST
path: /department
status: mock
tags: [department, write]
resource: /frontend/src/mocks/modules/department.ts
timestamp: 2026-09-05T00:00:00Z
---

# Create Department

Backs `views/department/pages/PageDepartmentTambah.vue`. Client-side validation:
`frontend/src/views/department/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "FIN", "name": "Finance" }
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
{ "data": { "id": 4, "company_id": 1, "code": "FIN", "name": "Finance", "deleted_at": null }, "message": "Department ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode departemen sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
