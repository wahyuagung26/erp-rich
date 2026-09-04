---
type: API Endpoint
title: Update Kategori
description: Edit an existing product category's name. Code is immutable.
method: PUT
path: /kategori/:id
status: mock
tags: [kategori, write]
resource: /frontend/src/mocks/modules/kategori.ts
timestamp: 2026-09-04T11:00:00Z
---

# Update Kategori

Backs `views/kategori/pages/PageKategoriEdit.vue`. The form shows `code` disabled —
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
{ "name": "Elektronik & Gadget" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Kategori }, "message": "Kategori diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Kategori tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
