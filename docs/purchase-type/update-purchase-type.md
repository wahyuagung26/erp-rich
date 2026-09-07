---
type: API Endpoint
title: Update Purchase Type
description: Edit an existing purchase type's name/notes. Code is immutable.
method: PUT
path: /purchase-type/:id
status: mock
tags: [purchase-type, write]
resource: /frontend/src/mocks/modules/purchase-type.ts
timestamp: 2026-09-07T00:00:00Z
---

# Update Purchase Type

Backs `views/purchase-type/pages/PagePurchaseTypeEdit.vue`. The form shows
`code` disabled — this endpoint ignores `code` even if sent; `name` and `notes`
can change.

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
{ "name": "Pembelian Impor", "notes": "Pembelian dari supplier luar negeri, term L/C" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...PurchaseType }, "message": "Jenis pembelian diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis pembelian tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
