---
type: API Endpoint
title: Create Sales
description: Add a new sales rep. Client supplies `code`; server assigns `id`.
method: POST
path: /sales
status: mock
tags: [sales, write]
resource: /frontend/src/mocks/modules/sales.ts
timestamp: 2026-09-07T00:00:00Z
---

# Create Sales

Backs `views/sales/pages/PageSalesTambah.vue`. Client-side validation:
`frontend/src/views/sales/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "SL01", "name": "Budi Santoso", "address": "Jl. Merdeka No. 10, Bandung" }
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
{ "data": { "id": 4, "company_id": 1, "code": "SL01", "name": "Budi Santoso", "address": "...", "deleted_at": null }, "message": "Sales ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode sales sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
