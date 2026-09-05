---
type: API Endpoint
title: Get Account
description: Fetch one detail account by id.
method: GET
path: /account/:id
status: mock
tags: [account, read]
resource: /frontend/src/mocks/modules/account.ts
timestamp: 2026-09-05T11:00:00Z
---

# Get Account

Backs `views/account/pages/PageAccountDetail.vue` (read-only view) and
`PageAccountEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Account.id` |

## Response

`200`: `{ "data": { ...Account } }` — same shape as one row of [list-account](./list-account.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Akun perkiraan tidak ditemukan" }` |
