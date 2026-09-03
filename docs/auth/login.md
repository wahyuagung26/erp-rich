---
type: API Endpoint
title: Login
description: Exchange username/email + password for a bearer token.
method: POST
path: /auth/login
status: mock
tags: [auth, write]
resource: /frontend/src/mocks/modules/auth.ts
timestamp: 2026-09-03T00:00:00Z
---

# Login

Backs `views/auth/LoginView.vue` → `useUserStore().login()`.

## Request

### Body

```json
{
  "username": "admin@rahadhyan.co.id",
  "password": "password",
  "device_id": "b7f3c2a1-9e4d-4f8a-bc21-0a1b2c3d4e5f"
}
```

| Field | Type | Rules |
|---|---|---|
| `username` | string | required; username **or** email |
| `password` | string | required |
| `device_id` | string | optional; UUID v4 from `localStorage._DEVICEID_`, generated client-side |

## Response

`200`:

```json
{
  "data": {
    "token": "mock.eyJ1IjoidS0xIn0",
    "user": {
      "id": "u-1",
      "name": "Sri Wahyuni",
      "email": "admin@rahadhyan.co.id",
      "roles": [{ "name": "Finance Admin" }]
    }
  },
  "message": "Berhasil masuk"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `401` | wrong username / password | `{ "message": "Username atau password salah" }` |
| `422` | empty field | `{ "message": "...", "errors": { "password": ["Password wajib diisi"] } }` |

## Notes

- Mock accepts `admin@rahadhyan.co.id` / `admin` with password `password`; anything
  else → `401`. The `401` path renders the form's error alert.
- Token is opaque to the frontend — do not parse it.
