---
type: API Endpoint
title: Update Warehouse
description: Edit an existing warehouse's name, branch, or address. Code is immutable.
method: PUT
path: /warehouse/:id
status: mock
tags: [warehouse, write]
resource: /frontend/src/mocks/modules/warehouse.ts
timestamp: 2026-09-05T15:00:00Z
---

# Update Warehouse

Backs `views/warehouse/pages/PageWarehouseEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; `name`, `branch_id`, and `address` can change.

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
{ "name": "Gudang Pusat 2", "branch_id": 1, "address": "Jl. Baru No. 10" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint. `branch_id` is re-validated the same as on create.

## Response

`200`: `{ "data": { ...Warehouse }, "message": "Gudang diperbarui" }` — `branch_code`/`branch_name`
are re-resolved from the (possibly changed) `branch_id`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Gudang tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | `branch_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "branch_id": ["Cabang tidak valid"] } }` |
