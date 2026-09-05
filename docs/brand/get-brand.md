---
type: API Endpoint
title: Get Brand
description: Fetch one product brand by id.
method: GET
path: /brand/:id
status: mock
tags: [brand, read]
resource: /frontend/src/mocks/modules/brand.ts
timestamp: 2026-09-05T00:00:00Z
---

# Get Merk

Backs `views/brand/pages/PageBrandDetail.vue` (read-only view) and `PageMerkEdit.vue`
(loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Merk.id` |

## Response

`200`: `{ "data": { ...Merk } }` — same shape as one row of [list-merk](./list-brand.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Merk tidak ditemukan" }` |
