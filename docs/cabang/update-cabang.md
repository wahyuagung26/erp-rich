---
type: API Endpoint
title: Update Cabang
description: Edit an existing branch's name/address. Code is immutable.
method: PUT
path: /cabang/:id
status: mock
tags: [cabang, write]
resource: /frontend/src/mocks/modules/cabang.ts
timestamp: 2026-09-04T13:00:00Z
---

# Update Cabang

Backs `views/cabang/pages/PageCabangEdit.vue`. The form shows `code` disabled — this
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

`200`: `{ "data": { ...Cabang }, "message": "Cabang diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Cabang tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
