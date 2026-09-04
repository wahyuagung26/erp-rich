---
type: API Endpoint
title: Get Departemen
description: Fetch one department by id.
method: GET
path: /departemen/:id
status: mock
tags: [departemen, read]
resource: /frontend/src/mocks/modules/departemen.ts
timestamp: 2026-09-04T14:00:00Z
---

# Get Departemen

Backs `views/departemen/pages/PageDepartemenDetail.vue` (read-only view) and
`PageDepartemenEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Departemen.id` |

## Response

`200`: `{ "data": { ...Departemen } }` — same shape as one row of [list-departemen](./list-departemen.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Departemen tidak ditemukan" }` |
