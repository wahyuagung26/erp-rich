---
type: API Endpoint
title: Create Payment Type
description: Add a new payment type. Client supplies `code` + account id + enums; server assigns `id` and resolves the account's code/name.
method: POST
path: /payment-type
status: mock
tags: [payment-type, write]
resource: /frontend/src/mocks/modules/payment-type.ts
timestamp: 2026-09-05T13:00:00Z
---

# Create Payment Type

Backs `views/payment-type/pages/PagePaymentTypeTambah.vue`. Client-side
validation: `frontend/src/views/payment-type/schema.ts` (valibot) — the backend
must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "TP01", "name": "Tunai", "account_id": 1, "transaction_type": "sale", "method": "cash" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `account_id` | number | required; must be a non-deleted `Account` belonging to the active company |
| `transaction_type` | enum | required; `purchase` \| `sale` |
| `method` | enum | required; `cash` \| `return_deduction` \| `down_payment` |

`id`, `company_id`, `account_code`, `account_name` are **not**
accepted from the client — the server assigns/resolves them (`company_id` from
the active company, see [conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{
  "data": {
    "id": 3, "company_id": 1, "code": "TP01", "name": "Tunai",
    "account_id": 1, "account_code": "1000101", "account_name": "Kas Kecil",
    "transaction_type": "sale", "method": "cash", "deleted_at": null
  },
  "message": "Tipe pembayaran ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode tipe pembayaran sudah dipakai"] } }` |
| `422` | `account_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_id": ["Akun perkiraan tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
