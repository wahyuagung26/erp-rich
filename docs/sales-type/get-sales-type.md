---
type: API Endpoint
title: Get Sales Type
description: Fetch one sales type by id.
method: GET
path: /sales-type/:id
status: mock
tags: [sales-type, read]
resource: /frontend/src/mocks/modules/sales-type.ts
timestamp: 2026-09-05T12:00:00Z
---

# Get Sales Type

Backs `views/sales-type/pages/PageSalesTypeDetail.vue` (read-only view) and
`PageSalesTypeEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesType.id` |

## Response

`200`: `{ "data": { ...SalesType } }` — same shape as one row of [list-sales-type](./list-sales-type.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis penjualan tidak ditemukan" }` |
