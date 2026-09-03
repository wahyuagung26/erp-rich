---
type: API Convention
title: Shared API Conventions
description: Response envelope, pagination, sorting, auth, and error shape inherited by every endpoint in this bundle.
tags: [api, convention]
timestamp: 2026-09-03T00:00:00Z
---

# Shared API Conventions

Base URL comes from `VITE_APP_API_URL`. Every endpoint file below assumes these.

## Response envelope

| Case | Shape |
|---|---|
| Single item | `{ "data": { ... }, "message"?: string }` |
| List | `{ "data": [ ... ], "meta": { "pagination": { ... } }, "message"?: string }` |
| Error | `{ "message": string, "errors"?: { "<field>": string[] } }` |

Frontend always reads the payload from `.data` (and `.meta.pagination` for lists).

## Pagination (list endpoints)

Request query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | 1 | 1-based |
| `per_page` | int | 10 | |
| `sort_by` | string | — | column field name |
| `sort_order` | `asc` \| `desc` | `asc` | |

`meta.pagination`:

```json
{ "page": 1, "per_page": 10, "total": 18, "last_page": 2 }
```

## Auth

`Authorization: Bearer <token>` on every request (frontend reads `localStorage.token`).
`401` → frontend clears the token and redirects to `/signin`. Not yet enforced in mock.

## Status field

Each endpoint file carries `status:` in frontmatter:

- `mock` — only the mock implements it; contract may still change.
- `implemented` — backend implements it and matches this file.
