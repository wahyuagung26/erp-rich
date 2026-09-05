---
type: API Endpoint
title: Get Department
description: Fetch one department by id.
method: GET
path: /department/:id
status: mock
tags: [department, read]
resource: /frontend/src/mocks/modules/department.ts
timestamp: 2026-09-05T00:00:00Z
---

# Get Department

Backs `views/department/pages/PageDepartmentDetail.vue` (read-only view) and
`PageDepartmentEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Department.id` |

## Response

`200`: `{ "data": { ...Department } }` — same shape as one row of [list-departemen](./list-department.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Department tidak ditemukan" }` |
