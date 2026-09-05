---
type: API Endpoint
title: Get Warehouse
description: Fetch one warehouse by id.
method: GET
path: /warehouse/:id
status: mock
tags: [warehouse, read]
resource: /frontend/src/mocks/modules/warehouse.ts
timestamp: 2026-09-05T15:00:00Z
---

# Get Warehouse

Backs `views/warehouse/pages/PageWarehouseDetail.vue` (read-only view) and
`PageWarehouseEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Warehouse.id` |

## Response

`200`: `{ "data": { ...Warehouse } }` — same shape as one row of [list-warehouse](./list-warehouse.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Gudang tidak ditemukan" }` |
