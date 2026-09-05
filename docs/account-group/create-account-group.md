---
type: API Endpoint
title: Create Account Group
description: Add a new account group. Client supplies `code`; server assigns `id`.
method: POST
path: /account-group
status: mock
tags: [account-group, write]
resource: /frontend/src/mocks/modules/account-group.ts
timestamp: 2026-09-05T09:00:00Z
---

# Create Account Group

Backs `views/account-group/pages/PageAccountGroupTambah.vue`. Client-side validation:
`frontend/src/views/account-group/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "10", "name": "Aset", "category": "balance_sheet", "normal_balance": "debit" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; numeric, max 2 digits (`^\d{1,2}$`); unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `category` | enum | required; `balance_sheet` \| `income_statement` |
| `normal_balance` | enum | required; `debit` \| `credit` |

`id` and `company_id` are **not** accepted from the client — the server assigns
them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 5, "company_id": 1, "code": "10", "name": "Aset", "category": "balance_sheet", "normal_balance": "debit", "deleted_at": null }, "message": "Group akun ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `code` not numeric or longer than 2 digits | `{ "message": "...", "errors": { "code": ["Kode harus angka, maksimal 2 digit"] } }` |
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode group akun sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
