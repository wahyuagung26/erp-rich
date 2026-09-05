---
type: API Endpoint
title: Update Unit
description: Edit an existing unit of measure's name. Code is immutable.
method: PUT
path: /unit/:id
status: mock
tags: [unit, write]
resource: /frontend/src/mocks/modules/unit.ts
timestamp: 2026-09-05T00:00:00Z
---

# Update Unit

Backs `views/unit/pages/PageUnitEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; only `name` can change.

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
{ "name": "Kotak" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Unit }, "message": "Unit diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Unit tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
