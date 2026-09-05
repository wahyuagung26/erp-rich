---
type: API Endpoint
title: Update Account
description: Edit an existing detail account's name or type. Sub account and code are immutable.
method: PUT
path: /account/:id
status: mock
tags: [account, write]
resource: /frontend/src/mocks/modules/account.ts
timestamp: 2026-09-05T11:00:00Z
---

# Update Account

Backs `views/account/pages/PageAccountEdit.vue`. The form shows both
the sub account picker and the code disabled — this endpoint ignores `sub_account_id`
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

`sub_account_id`, `code_suffix`, `code`, `id`, and `company_id` are ignored if sent —
a detail account can't be reassigned to another sub account (which would change its
code prefix) or moved to another company via this endpoint.

## Response

`200`: `{ "data": { ...Account }, "message": "Akun perkiraan diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Akun perkiraan tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
