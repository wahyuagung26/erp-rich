---
type: API Endpoint
title: Create Akun
description: Add a new chart-of-accounts entry.
method: POST
path: /akun
status: mock
tags: [akun, write]
resource: /frontend/src/mocks/modules/akun.ts
timestamp: 2026-09-03T09:00:00Z
---

# Create Akun

Backs `views/akun/pages/PageAkunTambah.vue`. Client-side validation:
`frontend/src/views/akun/schema.ts` (valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "code": "1-1600",
  "name": "Kas Kecil",
  "type": "asset",
  "normal_balance": "debit",
  "active": true
}
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; `^\d[-\d]*$`; unique |
| `name` | string | required; min 3 |
| `type` | enum | required; `asset\|liability\|equity\|revenue\|expense` |
| `normal_balance` | enum | `debit\|credit` |
| `active` | boolean | default `true` |

## Response

`201`:

```json
{ "data": { "id": 19, "code": "1-1600", "name": "Kas Kecil", "type": "asset", "normal_balance": "debit", "active": true }, "message": "Akun ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation / duplicate `code` | `{ "message": "...", "errors": { "code": ["Kode sudah dipakai"] } }` |

## Notes

- Mock does not enforce `code` uniqueness yet; backend must.
