---
type: API Endpoint
title: Update Company
description: Edit an existing company.
method: PUT
path: /company/:id
status: mock
tags: [company, write]
resource: /frontend/src/mocks/modules/company.ts
timestamp: 2026-09-05T00:00:00Z
---

# Update Company

Backs `views/company/pages/PageCompanyEdit.vue`. Full-object PUT (same body and
rules as [create-company](./create-company.md)).

## Request

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

Same shape and rules as [create-company](./create-company.md). `id` and
`deleted_at` are ignored if sent. `code` may change but must stay unique (excluding
this row). An empty `logo_url` keeps the current logo.

## Response

`200`: `{ "data": { ...Company }, "message": "Perusahaan diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or soft-deleted | `{ "message": "Perusahaan tidak ditemukan" }` |
| `422` | validation, or `code` collides with another row | `{ "message": "...", "errors": { } }` |
