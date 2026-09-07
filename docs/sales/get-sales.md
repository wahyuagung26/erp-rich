---
type: API Endpoint
title: Get Sales
description: Fetch one sales rep by id.
method: GET
path: /sales/:id
status: mock
tags: [sales, read]
resource: /frontend/src/mocks/modules/sales.ts
timestamp: 2026-09-07T00:00:00Z
---

# Get Sales

Backs `views/sales/pages/PageSalesDetail.vue` (read-only view) and
`PageSalesEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Sales.id` |

## Response

`200`: `{ "data": { ...Sales } }` — same shape as one row of [list-sales](./list-sales.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Sales tidak ditemukan" }` |
