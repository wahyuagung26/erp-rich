---
type: API Endpoint
title: Get Tipe Pembayaran
description: Fetch one payment type by id.
method: GET
path: /tipe-pembayaran/:id
status: mock
tags: [tipe-pembayaran, read]
resource: /frontend/src/mocks/modules/tipe-pembayaran.ts
timestamp: 2026-09-05T13:00:00Z
---

# Get Tipe Pembayaran

Backs `views/tipe-pembayaran/pages/PageTipePembayaranDetail.vue` (read-only view) and
`PageTipePembayaranEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `TipePembayaran.id` |

## Response

`200`: `{ "data": { ...TipePembayaran } }` — same shape as one row of [list-tipe-pembayaran](./list-tipe-pembayaran.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Tipe pembayaran tidak ditemukan" }` |
