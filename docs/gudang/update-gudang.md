---
type: API Endpoint
title: Update Gudang
description: Edit an existing warehouse's name, cabang, or address. Code is immutable.
method: PUT
path: /gudang/:id
status: mock
tags: [gudang, write]
resource: /frontend/src/mocks/modules/gudang.ts
timestamp: 2026-09-04T15:00:00Z
---

# Update Gudang

Backs `views/gudang/pages/PageGudangEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; `name`, `cabang_id`, and `address` can change.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

```json
{ "name": "Gudang Pusat 2", "cabang_id": 1, "address": "Jl. Baru No. 10" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint. `cabang_id` is re-validated the same as on create.

## Response

`200`: `{ "data": { ...Gudang }, "message": "Gudang diperbarui" }` — `cabang_code`/`cabang_name`
are re-resolved from the (possibly changed) `cabang_id`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Gudang tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | `cabang_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "cabang_id": ["Cabang tidak valid"] } }` |
