---
type: API Endpoint
title: Create Akun Perkiraan
description: Add a new detail account. Client supplies `sub_akun_id` + `code_suffix`; server composes `code` and assigns `id`.
method: POST
path: /akun-perkiraan
status: mock
tags: [akun-perkiraan, write]
resource: /frontend/src/mocks/modules/akun-perkiraan.ts
timestamp: 2026-09-05T11:00:00Z
---

# Create Akun Perkiraan

Backs `views/akun-perkiraan/pages/PageAkunPerkiraanTambah.vue`. Client-side validation:
`frontend/src/views/akun-perkiraan/schema.ts` (valibot) — the backend must re-validate.
See [code composition](./index.md#code-composition) for how `code` is built.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "sub_akun_id": 1, "code_suffix": "01", "name": "Kas Kecil", "type": "asset" }
```

| Field | Type | Rules |
|---|---|---|
| `sub_akun_id` | number | required; must be a non-deleted `SubAkun` belonging to the active company |
| `code_suffix` | string | required; numeric, exactly 2 digits (`^\d{2}$`) — becomes the last 2 digits of `code` |
| `name` | string | required; min 2 |
| `type` | enum | required; `cash_bank` \| `asset` \| `liability` \| `equity` \| `revenue` \| `expense` |

`id`, `company_id`, `code`, `sub_akun_code`, `sub_akun_name` are **not** accepted
from the client — the server assigns/composes them (`company_id` from the active
company, `code` from the sub akun's code + `code_suffix`, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 5, "company_id": 1, "sub_akun_id": 1, "sub_akun_code": "10001", "sub_akun_name": "Kas", "code": "1000101", "name": "Kas Kecil", "type": "asset", "deleted_at": null }, "message": "Akun perkiraan ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `sub_akun_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "sub_akun_id": ["Sub akun tidak valid"] } }` |
| `422` | `code_suffix` not numeric or not exactly 2 digits | `{ "message": "...", "errors": { "code_suffix": ["Kode harus angka, tepat 2 digit"] } }` |
| `422` | composed `code` already used within the active company | `{ "message": "...", "errors": { "code_suffix": ["Kode akun perkiraan sudah dipakai"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
