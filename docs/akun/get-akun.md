---
type: API Endpoint
title: Get Akun
description: Fetch one account by id.
method: GET
path: /akun/:id
status: mock
tags: [akun, read]
resource: /frontend/src/mocks/modules/akun.ts
timestamp: 2026-09-03T09:00:00Z
---

# Get Akun

Backs `views/akun/pages/PageAkunEdit.vue` — loads the record into the form.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Akun.id` |

## Response

`200`:

```json
{ "data": { "id": 1, "code": "1-1000", "name": "Kas", "type": "asset", "normal_balance": "debit", "active": true } }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Akun tidak ditemukan" }` |
