---
type: API Endpoint
title: Get Unit
description: Fetch one unit of measure by id.
method: GET
path: /unit/:id
status: mock
tags: [unit, read]
resource: /frontend/src/mocks/modules/unit.ts
timestamp: 2026-09-09T00:00:00Z
---

# Get Unit

Backs `views/unit/pages/PageUnitDetail.vue` (read-only view) and
`PageUnitEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Unit.id` |

## Response

`200`: `{ "data": { ...Unit } }` — same shape as one row of [list-unit](./list-unit.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Unit tidak ditemukan" }` |
