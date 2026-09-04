---
type: API Endpoint
title: Get Akun Perkiraan
description: Fetch one detail account by id.
method: GET
path: /akun-perkiraan/:id
status: mock
tags: [akun-perkiraan, read]
resource: /frontend/src/mocks/modules/akun-perkiraan.ts
timestamp: 2026-09-05T11:00:00Z
---

# Get Akun Perkiraan

Backs `views/akun-perkiraan/pages/PageAkunPerkiraanDetail.vue` (read-only view) and
`PageAkunPerkiraanEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `AkunPerkiraan.id` |

## Response

`200`: `{ "data": { ...AkunPerkiraan } }` — same shape as one row of [list-akun-perkiraan](./list-akun-perkiraan.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Akun perkiraan tidak ditemukan" }` |
