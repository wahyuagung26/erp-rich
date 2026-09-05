---
type: API Endpoint
title: Get Sub Account
description: Fetch one sub-account by id.
method: GET
path: /sub-account/:id
status: mock
tags: [sub-account, read]
resource: /frontend/src/mocks/modules/sub-account.ts
timestamp: 2026-09-05T10:00:00Z
---

# Get Sub Account

Backs `views/sub-account/pages/PageSubAccountDetail.vue` (read-only view) and
`PageSubAccountEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SubAccount.id` |

## Response

`200`: `{ "data": { ...SubAccount } }` — same shape as one row of [list-sub-account](./list-sub-account.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Sub akun tidak ditemukan" }` |
