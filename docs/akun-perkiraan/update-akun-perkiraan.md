---
type: API Endpoint
title: Update Akun Perkiraan
description: Edit an existing detail account's name or type. Sub akun and code are immutable.
method: PUT
path: /akun-perkiraan/:id
status: mock
tags: [akun-perkiraan, write]
resource: /frontend/src/mocks/modules/akun-perkiraan.ts
timestamp: 2026-09-05T11:00:00Z
---

# Update Akun Perkiraan

Backs `views/akun-perkiraan/pages/PageAkunPerkiraanEdit.vue`. The form shows both
the sub akun picker and the code disabled — this endpoint ignores `sub_akun_id`
and `code_suffix` even if sent; only `name` and `type` can change.

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
{ "name": "Kas Kecil Kantor Pusat", "type": "asset" }
```

`sub_akun_id`, `code_suffix`, `code`, `id`, and `company_id` are ignored if sent —
a detail account can't be reassigned to another sub akun (which would change its
code prefix) or moved to another company via this endpoint.

## Response

`200`: `{ "data": { ...AkunPerkiraan }, "message": "Akun perkiraan diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Akun perkiraan tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
