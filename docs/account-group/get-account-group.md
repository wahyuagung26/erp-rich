---
type: API Endpoint
title: Get Account Group
description: Fetch one account group by id.
method: GET
path: /account-group/:id
status: mock
tags: [account-group, read]
resource: /frontend/src/mocks/modules/account-group.ts
timestamp: 2026-09-05T09:00:00Z
---

# Get Account Group

Backs `views/account-group/pages/PageAccountGroupDetail.vue` (read-only view) and
`PageAccountGroupEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `AccountGroup.id` |

## Response

`200`: `{ "data": { ...AccountGroup } }` — same shape as one row of [list-account-group](./list-account-group.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Group akun tidak ditemukan" }` |
