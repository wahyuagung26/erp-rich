---
type: API Endpoint
title: Get Jenis Penjualan
description: Fetch one sales type by id.
method: GET
path: /jenis-penjualan/:id
status: mock
tags: [jenis-penjualan, read]
resource: /frontend/src/mocks/modules/jenis-penjualan.ts
timestamp: 2026-09-05T12:00:00Z
---

# Get Jenis Penjualan

Backs `views/jenis-penjualan/pages/PageJenisPenjualanDetail.vue` (read-only view) and
`PageJenisPenjualanEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `JenisPenjualan.id` |

## Response

`200`: `{ "data": { ...JenisPenjualan } }` — same shape as one row of [list-jenis-penjualan](./list-jenis-penjualan.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis penjualan tidak ditemukan" }` |
