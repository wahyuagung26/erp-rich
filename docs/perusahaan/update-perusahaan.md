---
type: API Endpoint
title: Update Perusahaan
description: Edit an existing company.
method: PUT
path: /perusahaan/:id
status: mock
tags: [perusahaan, write]
resource: /frontend/src/mocks/modules/perusahaan.ts
timestamp: 2026-09-03T16:00:00Z
---

# Update Perusahaan

Backs `views/perusahaan/pages/PagePerusahaanEdit.vue`. Full-object PUT (same body and
rules as [create-perusahaan](./create-perusahaan.md)).

## Request

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

Same shape and rules as [create-perusahaan](./create-perusahaan.md). `id` and
`deleted_at` are ignored if sent. `code` may change but must stay unique (excluding
this row). An empty `logo_url` keeps the current logo.

## Response

`200`: `{ "data": { ...Perusahaan }, "message": "Perusahaan diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or soft-deleted | `{ "message": "Perusahaan tidak ditemukan" }` |
| `422` | validation, or `code` collides with another row | `{ "message": "...", "errors": { } }` |
