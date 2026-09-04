---
type: API Endpoint
title: Get Gudang
description: Fetch one warehouse by id.
method: GET
path: /gudang/:id
status: mock
tags: [gudang, read]
resource: /frontend/src/mocks/modules/gudang.ts
timestamp: 2026-09-04T15:00:00Z
---

# Get Gudang

Backs `views/gudang/pages/PageGudangDetail.vue` (read-only view) and
`PageGudangEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Gudang.id` |

## Response

`200`: `{ "data": { ...Gudang } }` — same shape as one row of [list-gudang](./list-gudang.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Gudang tidak ditemukan" }` |
