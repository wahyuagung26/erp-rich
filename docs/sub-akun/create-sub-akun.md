---
type: API Endpoint
title: Create Sub Akun
description: Add a new sub-account. Client supplies `group_akun_id` + `code_suffix`; server composes `code` and assigns `id`.
method: POST
path: /sub-akun
status: mock
tags: [sub-akun, write]
resource: /frontend/src/mocks/modules/sub-akun.ts
timestamp: 2026-09-05T10:00:00Z
---

# Create Sub Akun

Backs `views/sub-akun/pages/PageSubAkunTambah.vue`. Client-side validation:
`frontend/src/views/sub-akun/schema.ts` (valibot) — the backend must re-validate.
See [code composition](./index.md#code-composition) for how `code` is built.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "group_akun_id": 1, "code_suffix": "001", "name": "Kas", "normal_balance": "debit" }
```

| Field | Type | Rules |
|---|---|---|
| `group_akun_id` | number | required; must be a non-deleted `GroupAkun` belonging to the active company |
| `code_suffix` | string | required; numeric, exactly 3 digits (`^\d{3}$`) — becomes the last 3 digits of `code` |
| `name` | string | required; min 2 |
| `normal_balance` | enum | required; `debit` \| `credit` |

`id`, `company_id`, `code`, `group_akun_code`, `group_akun_name` are **not** accepted
from the client — the server assigns/composes them (`company_id` from the active
company, `code` from the group's zero-padded code + `code_suffix`, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 5, "company_id": 1, "group_akun_id": 1, "group_akun_code": "10", "group_akun_name": "Aset", "code": "10001", "name": "Kas", "normal_balance": "debit", "deleted_at": null }, "message": "Sub akun ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `group_akun_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "group_akun_id": ["Group perkiraan tidak valid"] } }` |
| `422` | `code_suffix` not numeric or not exactly 3 digits | `{ "message": "...", "errors": { "code_suffix": ["Kode harus angka, tepat 3 digit"] } }` |
| `422` | composed `code` already used within the active company | `{ "message": "...", "errors": { "code_suffix": ["Kode sub akun sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
