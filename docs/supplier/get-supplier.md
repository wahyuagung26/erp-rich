---
type: API Endpoint
title: Get Supplier
description: Fetch one supplier by id.
method: GET
path: /supplier/:id
status: mock
tags: [supplier, read]
resource: /frontend/src/mocks/modules/supplier.ts
timestamp: 2026-09-03T00:00:00Z
---

# Get Supplier

Backs `views/supplier/pages/PageSupplierEdit.vue` — loads the record into the form.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Supplier.id` |

## Response

`200`: `{ "data": { ...Supplier } }` — same shape as one row of [list-supplier](./list-supplier.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or the supplier is soft-deleted | `{ "message": "Supplier tidak ditemukan" }` |
