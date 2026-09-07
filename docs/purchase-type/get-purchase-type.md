---
type: API Endpoint
title: Get Purchase Type
description: Fetch one purchase type by id.
method: GET
path: /purchase-type/:id
status: mock
tags: [purchase-type, read]
resource: /frontend/src/mocks/modules/purchase-type.ts
timestamp: 2026-09-07T00:00:00Z
---

# Get Purchase Type

Backs `views/purchase-type/pages/PagePurchaseTypeDetail.vue` (read-only view)
and `PagePurchaseTypeEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseType.id` |

## Response

`200`: `{ "data": { ...PurchaseType } }` — same shape as one row of
[list-purchase-type](./list-purchase-type.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis pembelian tidak ditemukan" }` |
