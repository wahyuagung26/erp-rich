---
type: API Endpoint
title: Create Account
description: Add a new detail account. Client supplies `sub_account_id` + `code_suffix`; server composes `code` and assigns `id`.
method: POST
path: /account
status: mock
tags: [account, write]
resource: /frontend/src/mocks/modules/account.ts
timestamp: 2026-09-05T11:00:00Z
---

# Create Account

Backs `views/account/pages/PageAccountTambah.vue`. Client-side validation:
`frontend/src/views/account/schema.ts` (valibot) — the backend must re-validate.
See [code composition](./index.md#code-composition) for how `code` is built.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "sub_account_id": 1, "code_suffix": "01", "name": "Kas Kecil", "type": "asset" }
```

| Field | Type | Rules |
|---|---|---|
| `sub_account_id` | number | required; must be a non-deleted `SubAccount` belonging to the active company |
| `code_suffix` | string | required; numeric, exactly 2 digits (`^\d{2}$`) — becomes the last 2 digits of `code` |
| `name` | string | required; min 2 |
| `type` | enum | required; `cash_bank` \| `asset` \| `liability` \| `equity` \| `revenue` \| `expense` |

`id`, `company_id`, `code`, `sub_account_code`, `sub_account_name` are **not** accepted
from the client — the server assigns/composes them (`company_id` from the active
company, `code` from the sub account's code + `code_suffix`, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 5, "company_id": 1, "sub_account_id": 1, "sub_account_code": "10001", "sub_account_name": "Kas", "code": "1000101", "name": "Kas Kecil", "type": "asset", "deleted_at": null }, "message": "Akun perkiraan ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `sub_account_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "sub_account_id": ["Sub akun tidak valid"] } }` |
| `422` | `code_suffix` not numeric or not exactly 2 digits | `{ "message": "...", "errors": { "code_suffix": ["Kode harus angka, tepat 2 digit"] } }` |
| `422` | composed `code` already used within the active company | `{ "message": "...", "errors": { "code_suffix": ["Kode akun perkiraan sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
