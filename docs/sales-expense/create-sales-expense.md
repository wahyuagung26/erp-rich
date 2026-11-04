---
type: API Endpoint
title: Create Sales Expense
description: Add a new sales expense. Client supplies `code` + `account_id`; server assigns `id` and resolves `account_code`/`account_name`.
method: POST
path: /sales-expense
status: mock
tags: [sales-expense, write]
resource: /frontend/src/mocks/modules/sales-expense.ts
timestamp: 2026-11-04T14:00:00Z
---

# Create Sales Expense

Backs `views/sales-expense/pages/PageSalesExpenseTambah.vue`. Client-side validation:
`frontend/src/views/sales-expense/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "BP01", "name": "Biaya Pengiriman", "account_id": 2, "notes": "Ongkos kirim ke pelanggan" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `account_id` | number | required; must be a non-deleted `Account` belonging to the active company |
| `notes` | string | optional |

`id`, `company_id`, `account_code`, `account_name` are **not** accepted from the client — the server
assigns/resolves them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 3, "company_id": 1, "code": "BP01", "name": "Biaya Pengiriman", "account_id": 2, "account_code": "6000101", "account_name": "Beban Gaji Pokok", "notes": "Ongkos kirim ke pelanggan", "deleted_at": null }, "message": "Biaya penjualan ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode biaya sudah dipakai"] } }` |
| `422` | `account_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_id": ["Akun biaya tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
