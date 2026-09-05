---
type: API Endpoint
title: Update Sub Account
description: Edit an existing sub-account's name or position. Group and code are immutable.
method: PUT
path: /sub-account/:id
status: mock
tags: [sub-account, write]
resource: /frontend/src/mocks/modules/sub-account.ts
timestamp: 2026-09-05T10:00:00Z
---

# Update Sub Account

Backs `views/sub-account/pages/PageSubAccountEdit.vue`. The form shows both the group
picker and the code disabled — this endpoint ignores `account_group_id` and
`code_suffix` even if sent; only `name` and `normal_balance` can change.

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
{ "name": "Kas Kecil", "normal_balance": "debit" }
```

`account_group_id`, `code_suffix`, `code`, `id`, and `company_id` are ignored if sent —
a sub-account can't be reassigned to another group (which would change its code
prefix) or moved to another company via this endpoint.

## Response

`200`: `{ "data": { ...SubAccount }, "message": "Sub akun diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Sub akun tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
