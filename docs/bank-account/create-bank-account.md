---
type: API Endpoint
title: Create Sales Expense
description: Add a new sales expense. Client supplies the bank fields + `account_id`; server assigns `id` and resolves `account_code`/`account_name`.
method: POST
path: /bank-account
status: mock
tags: [bank-account, write]
resource: /frontend/src/mocks/modules/bank-account.ts
timestamp: 2026-11-04T15:00:00Z
---

# Create Sales Expense

Backs `views/bank-account/pages/PageBankAccountTambah.vue`. Client-side validation:
`frontend/src/views/bank-account/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "bank_code": "CIMB", "bank_name": "Bank CIMB Niaga - 9200 (IDR)", "account_number": "800204893200", "account_holder": "PT Cakrawala Edukasi Aurora", "account_id": 17, "notes": "Rekening operasional" }
```

| Field | Type | Rules |
|---|---|---|
| `bank_code` | string | required; trimmed; max 12 |
| `bank_name` | string | required; trimmed; max 50 |
| `account_number` | string | required; trimmed; max 50 |
| `account_holder` | string | optional; max 100 |
| `account_id` | number | required; must be a non-deleted `Account` belonging to the active company |
| `notes` | string | required; max 100 |

`id`, `company_id`, `account_code`, `account_name` are **not** accepted from the client — the server
assigns/resolves them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 2, "company_id": 1, "bank_code": "CIMB", "bank_name": "Bank CIMB Niaga - 9200 (IDR)", "account_number": "800204893200", "account_holder": "PT Cakrawala Edukasi Aurora", "account_id": 17, "account_code": "1001302", "account_name": "Bank CIMB Niaga - 9200 (IDR)", "notes": "Rekening operasional", "deleted_at": null }, "message": "Rekening bank ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation | `{ "message": "...", "errors": { "bank_code": ["Kode bank wajib diisi"] } }` |
| `422` | `account_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_id": ["Akun perkiraan tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
