---
type: API Endpoint
title: Update Departemen
description: Edit an existing department's name. Code is immutable.
method: PUT
path: /departemen/:id
status: mock
tags: [departemen, write]
resource: /frontend/src/mocks/modules/departemen.ts
timestamp: 2026-09-04T14:00:00Z
---

# Update Departemen

Backs `views/departemen/pages/PageDepartemenEdit.vue`. The form shows `code` disabled —
this endpoint ignores `code` even if sent; only `name` can change.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

```json
{ "name": "Human Resources & Development" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Departemen }, "message": "Departemen diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Departemen tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
