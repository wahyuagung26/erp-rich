---
type: API Endpoint
title: Get Group Akun
description: Fetch one account group by id.
method: GET
path: /group-akun/:id
status: mock
tags: [group-akun, read]
resource: /frontend/src/mocks/modules/group-akun.ts
timestamp: 2026-09-05T09:00:00Z
---

# Get Group Akun

Backs `views/group-akun/pages/PageGroupAkunDetail.vue` (read-only view) and
`PageGroupAkunEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `GroupAkun.id` |

## Response

`200`: `{ "data": { ...GroupAkun } }` — same shape as one row of [list-group-akun](./list-group-akun.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Group akun tidak ditemukan" }` |
