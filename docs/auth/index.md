---
type: OKF Module
title: Auth
description: Session lifecycle — login exchanges credentials for a bearer token; the token is sent on every subsequent request.
tags: [auth, session]
timestamp: 2026-09-03T09:00:00Z
---

# Auth

Consumed by `frontend/src/views/auth/` and `frontend/src/stores/user.ts`.

## Entity: `AuthUser`

Returned on login, held in the user store, drives route guards.

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment |
| `name` | string | display name |
| `email` | string | |
| `roles` | `{ name: string }[]` | checked against `route.meta.roles` |

## Session model

- Login returns `{ token, user }`. Frontend stores `token` in `localStorage` and
  sends it as `Authorization: Bearer <token>` (see [conventions](../conventions.md#auth)).
- No refresh-token flow in the prototype. A `401` on any request clears the token
  and redirects to `/login`.
- Logout is client-only for now (drop the token); no server call.

## Endpoints

| Method | Path | File |
|---|---|---|
| POST | `/auth/login` | [login](./login.md) |

Planned (add when a caller exists): `GET /auth/me` (restore session on reload),
`POST /auth/logout` (server-side token revocation).
