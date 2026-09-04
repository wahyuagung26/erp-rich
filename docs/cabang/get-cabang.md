---
type: API Endpoint
title: Get Cabang
description: Fetch one branch by id.
method: GET
path: /cabang/:id
status: mock
tags: [cabang, read]
resource: /frontend/src/mocks/modules/cabang.ts
timestamp: 2026-09-04T13:00:00Z
---

# Get Cabang

Backs `views/cabang/pages/PageCabangDetail.vue` (read-only view) and
`PageCabangEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Cabang.id` |

## Response

`200`: `{ "data": { ...Cabang } }` — same shape as one row of [list-cabang](./list-cabang.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Cabang tidak ditemukan" }` |
