---
type: API Endpoint
title: Create Sales Type
description: Add a new sales type. Client supplies `code` + four account ids; server assigns `id` and resolves each account's code/name.
method: POST
path: /sales-type
status: mock
tags: [sales-type, write]
resource: /frontend/src/mocks/modules/sales-type.ts
timestamp: 2026-09-05T12:00:00Z
---

# Create Sales Type

Backs `views/sales-type/pages/PageSalesTypeTambah.vue`. Client-side
validation: `frontend/src/views/sales-type/schema.ts` (valibot) — the backend
must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{ "code": "RC0007", "name": "Bahan Baku", "revenue_account_id": 5, "cogs_account_id": 6, "inventory_account_id": 7, "expense_account_id": 2 }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `revenue_account_id` | number | required; must be a non-deleted `Account` belonging to the active company |
| `cogs_account_id` | number | required; same rule as `revenue_account_id` |
| `inventory_account_id` | number | required; same rule as `revenue_account_id` |
| `expense_account_id` | number | required; same rule as `revenue_account_id` |

`id`, `company_id`, and every `*_account_code`/`*_account_name` are **not** accepted from
the client — the server assigns/resolves them (`company_id` from the active
company, see [conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{
  "data": {
    "id": 2, "company_id": 1, "code": "RC0007", "name": "Bahan Baku",
    "revenue_account_id": 5, "revenue_account_code": "4000101", "revenue_account_name": "Penjualan Produk",
    "cogs_account_id": 6, "cogs_account_code": "6000102", "cogs_account_name": "Biaya Bahan Baku",
    "inventory_account_id": 7, "inventory_account_code": "1000102", "inventory_account_name": "Persediaan Bahan Baku",
    "expense_account_id": 2, "expense_account_code": "6000101", "expense_account_name": "Beban Gaji Pokok",
    "deleted_at": null
  },
  "message": "Jenis penjualan ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode jenis sudah dipakai"] } }` |
| `422` | `revenue_account_id` missing, not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "revenue_account_id": ["Akun pendapatan tidak valid"] } }` |
| `422` | `cogs_account_id` invalid (same conditions) | `{ "message": "...", "errors": { "cogs_account_id": ["Akun HPP tidak valid"] } }` |
| `422` | `inventory_account_id` invalid (same conditions) | `{ "message": "...", "errors": { "inventory_account_id": ["Akun persediaan tidak valid"] } }` |
| `422` | `expense_account_id` invalid (same conditions) | `{ "message": "...", "errors": { "expense_account_id": ["Akun biaya tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
