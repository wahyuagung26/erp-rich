---
type: API Endpoint
title: Get Company
description: Fetch one company by id.
method: GET
path: /company/:id
status: mock
tags: [company, read]
resource: /frontend/src/mocks/modules/company.ts
timestamp: 2026-09-05T00:00:00Z
---

# Get Company

Backs `views/company/pages/PageCompanyDetail.vue` (read-only view) and
`PageCompanyEdit.vue` (loads the record into the form).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Company.id` |

## Response

`200`: `{ "data": { ...Company } }` — same shape as one row of [list-company](./list-company.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, or the company is soft-deleted | `{ "message": "Perusahaan tidak ditemukan" }` |
