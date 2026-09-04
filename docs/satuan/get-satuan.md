---
type: API Endpoint
title: Get Satuan
description: Fetch one unit of measure by id.
method: GET
path: /satuan/:id
status: mock
tags: [satuan, read]
resource: /frontend/src/mocks/modules/satuan.ts
timestamp: 2026-09-04T12:00:00Z
---

# Get Satuan

Backs `views/satuan/pages/PageSatuanDetail.vue` (read-only view) and
`PageSatuanEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Satuan.id` |

## Response

`200`: `{ "data": { ...Satuan } }` — same shape as one row of [list-satuan](./list-satuan.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Satuan tidak ditemukan" }` |
