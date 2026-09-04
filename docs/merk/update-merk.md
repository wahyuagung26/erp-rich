---
type: API Endpoint
title: Update Merk
description: Edit an existing product brand's name. Code is immutable.
method: PUT
path: /merk/:id
status: mock
tags: [merk, write]
resource: /frontend/src/mocks/modules/merk.ts
timestamp: 2026-09-04T10:00:00Z
---

# Update Merk

Backs `views/merk/pages/PageMerkEdit.vue`. The form shows `code` disabled — this
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
{ "name": "Samsung Electronics" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Merk }, "message": "Merk diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Merk tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
