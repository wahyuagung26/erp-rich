---
type: API Endpoint
title: Update Account Group
description: Edit an existing account group's name, category, or position. Code is immutable.
method: PUT
path: /account-group/:id
status: mock
tags: [account-group, write]
resource: /frontend/src/mocks/modules/account-group.ts
timestamp: 2026-09-05T09:00:00Z
---

# Update Account Group

Backs `views/account-group/pages/PageAccountGroupEdit.vue`. The form shows `code` disabled —
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
{ "name": "Aset Lancar", "category": "balance_sheet", "normal_balance": "debit" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...AccountGroup }, "message": "Group akun diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Group akun tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
