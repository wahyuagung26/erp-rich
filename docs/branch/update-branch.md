---
type: API Endpoint
title: Update Branch
description: Edit an existing branch's name/address. Code is immutable.
method: PUT
path: /branch/:id
status: mock
tags: [branch, write]
resource: /frontend/src/mocks/modules/branch.ts
timestamp: 2026-09-05T00:00:00Z
---

# Update Branch

Backs `views/branch/pages/PageBranchEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; `name` and `address` can change.

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
{ "name": "Kantor Pusat", "address": "Jl. Kaum Kaler No. 12, Manonjaya, Tasikmalaya" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Branch }, "message": "Cabang diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Cabang tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
