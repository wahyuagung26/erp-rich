---
type: API Endpoint
title: Get Sub Akun
description: Fetch one sub-account by id.
method: GET
path: /sub-akun/:id
status: mock
tags: [sub-akun, read]
resource: /frontend/src/mocks/modules/sub-akun.ts
timestamp: 2026-09-05T10:00:00Z
---

# Get Sub Akun

Backs `views/sub-akun/pages/PageSubAkunDetail.vue` (read-only view) and
`PageSubAkunEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SubAkun.id` |

## Response

`200`: `{ "data": { ...SubAkun } }` — same shape as one row of [list-sub-akun](./list-sub-akun.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Sub akun tidak ditemukan" }` |
