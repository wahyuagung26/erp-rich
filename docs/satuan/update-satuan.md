---
type: API Endpoint
title: Update Satuan
description: Edit an existing unit of measure's name. Code is immutable.
method: PUT
path: /satuan/:id
status: mock
tags: [satuan, write]
resource: /frontend/src/mocks/modules/satuan.ts
timestamp: 2026-09-04T12:00:00Z
---

# Update Satuan

Backs `views/satuan/pages/PageSatuanEdit.vue`. The form shows `code` disabled — this
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

`200`: `{ "data": { ...Satuan }, "message": "Satuan diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Satuan tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
