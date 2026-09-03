---
type: API Endpoint
title: Update Akun
description: Edit an existing account.
method: PUT
path: /akun/:id
status: mock
tags: [akun, write]
resource: /frontend/src/mocks/modules/akun.ts
timestamp: 2026-09-03T09:00:00Z
---

# Update Akun

Backs `views/akun/pages/PageAkunEdit.vue`. Full-object PUT (same body as
[create-akun](./create-akun.md)).

## Request

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

Same shape and rules as [create-akun](./create-akun.md).

## Response

`200`:

```json
{ "data": { "id": 1, "code": "1-1000", "name": "Kas & Setara Kas", "type": "asset", "normal_balance": "debit", "active": true }, "message": "Akun diperbarui" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Akun tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { } }` |

## Notes

- Changing `code` on an account that already has journal entries: backend
  decision (block, or cascade). Not modelled in mock.
