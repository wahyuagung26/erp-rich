---
type: API Endpoint
title: Get Payment Type
description: Fetch one payment type by id.
method: GET
path: /payment-type/:id
status: mock
tags: [payment-type, read]
resource: /frontend/src/mocks/modules/payment-type.ts
timestamp: 2026-09-05T13:00:00Z
---

# Get Payment Type

Backs `views/payment-type/pages/PagePaymentTypeDetail.vue` (read-only view) and
`PagePaymentTypeEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PaymentType.id` |

## Response

`200`: `{ "data": { ...PaymentType } }` — same shape as one row of [list-payment-type](./list-payment-type.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Tipe pembayaran tidak ditemukan" }` |
