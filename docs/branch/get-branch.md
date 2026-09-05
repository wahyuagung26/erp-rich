---
type: API Endpoint
title: Get Branch
description: Fetch one branch by id.
method: GET
path: /branch/:id
status: mock
tags: [branch, read]
resource: /frontend/src/mocks/modules/branch.ts
timestamp: 2026-09-05T00:00:00Z
---

# Get Branch

Backs `views/branch/pages/PageBranchDetail.vue` (read-only view) and
`PageBranchEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Branch.id` |

## Response

`200`: `{ "data": { ...Branch } }` — same shape as one row of [list-branch](./list-branch.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Cabang tidak ditemukan" }` |
