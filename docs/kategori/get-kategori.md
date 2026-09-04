---
type: API Endpoint
title: Get Kategori
description: Fetch one product category by id.
method: GET
path: /kategori/:id
status: mock
tags: [kategori, read]
resource: /frontend/src/mocks/modules/kategori.ts
timestamp: 2026-09-04T11:00:00Z
---

# Get Kategori

Backs `views/kategori/pages/PageKategoriDetail.vue` (read-only view) and
`PageKategoriEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Kategori.id` |

## Response

`200`: `{ "data": { ...Kategori } }` — same shape as one row of [list-kategori](./list-kategori.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Kategori tidak ditemukan" }` |
