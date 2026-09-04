---
type: API Endpoint
title: Update Group Akun
description: Edit an existing account group's name, category, or position. Code is immutable.
method: PUT
path: /group-akun/:id
status: mock
tags: [group-akun, write]
resource: /frontend/src/mocks/modules/group-akun.ts
timestamp: 2026-09-05T09:00:00Z
---

# Update Group Akun

Backs `views/group-akun/pages/PageGroupAkunEdit.vue`. The form shows `code` disabled —
this endpoint ignores `code` even if sent; `name`, `category`, and `normal_balance` can change.

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
{ "name": "Aset Lancar", "category": "neraca", "normal_balance": "debit" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...GroupAkun }, "message": "Group akun diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Group akun tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
