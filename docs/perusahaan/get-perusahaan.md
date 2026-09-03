---
type: API Endpoint
title: Get Perusahaan
description: Fetch one company by id.
method: GET
path: /perusahaan/:id
status: mock
tags: [perusahaan, read]
resource: /frontend/src/mocks/modules/perusahaan.ts
timestamp: 2026-09-03T16:00:00Z
---

# Get Perusahaan

Backs `views/perusahaan/pages/PagePerusahaanDetail.vue` (read-only view) and
`PagePerusahaanEdit.vue` (loads the record into the form).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Perusahaan.id` |

## Response

`200`: `{ "data": { ...Perusahaan } }` — same shape as one row of [list-perusahaan](./list-perusahaan.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or the company is soft-deleted | `{ "message": "Perusahaan tidak ditemukan" }` |
