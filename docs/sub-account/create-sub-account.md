---
type: API Endpoint
title: Create Sub Account
description: Add a new sub-account. Client supplies `account_group_id` + `code_suffix`; server composes `code` and assigns `id`.
method: POST
path: /sub-account
status: mock
tags: [sub-account, write]
resource: /frontend/src/mocks/modules/sub-account.ts
timestamp: 2026-09-05T10:00:00Z
---

# Create Sub Account

Backs `views/sub-account/pages/PageSubAccountTambah.vue`. Client-side validation:
`frontend/src/views/sub-account/schema.ts` (valibot) — the backend must re-validate.
See [code composition](./index.md#code-composition) for how `code` is built.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "account_group_id": 1, "code_suffix": "001", "name": "Kas", "normal_balance": "debit" }
```

| Field | Type | Rules |
|---|---|---|
| `account_group_id` | number | required; must be a non-deleted `AccountGroup` belonging to the active company |
| `code_suffix` | string | required; numeric, exactly 3 digits (`^\d{3}$`) — becomes the last 3 digits of `code` |
| `name` | string | required; min 2 |
| `normal_balance` | enum | required; `debit` \| `credit` |

`id`, `company_id`, `code`, `account_group_code`, `account_group_name` are **not** accepted
from the client — the server assigns/composes them (`company_id` from the active
company, `code` from the group's zero-padded code + `code_suffix`, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 5, "company_id": 1, "account_group_id": 1, "account_group_code": "10", "account_group_name": "Aset", "code": "10001", "name": "Kas", "normal_balance": "debit", "deleted_at": null }, "message": "Sub akun ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `account_group_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_group_id": ["Group perkiraan tidak valid"] } }` |
| `422` | `code_suffix` not numeric or not exactly 3 digits | `{ "message": "...", "errors": { "code_suffix": ["Kode harus angka, tepat 3 digit"] } }` |
| `422` | composed `code` already used within the active company | `{ "message": "...", "errors": { "code_suffix": ["Kode sub akun sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
