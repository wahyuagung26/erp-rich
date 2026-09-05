---
type: API Endpoint
title: Update Sales Type
description: Edit an existing sales type's name or its four account references. Code is immutable.
method: PUT
path: /sales-type/:id
status: mock
tags: [sales-type, write]
resource: /frontend/src/mocks/modules/sales-type.ts
timestamp: 2026-09-05T12:00:00Z
---

# Update Sales Type

Backs `views/sales-type/pages/PageSalesTypeEdit.vue`. The form shows
`code` disabled — this endpoint ignores `code` even if sent. Unlike `code`, the
four account references **are** editable here — re-validated the same as on create.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

```json
{ "name": "Bahan Baku Impor", "revenue_account_id": 5, "cogs_account_id": 6, "inventory_account_id": 7, "expense_account_id": 2 }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...SalesType }, "message": "Jenis penjualan diperbarui" }` —
`*_account_code`/`*_account_name` are re-resolved from the (possibly changed) ids.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis penjualan tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | any `*_account_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "revenue_account_id": ["Akun pendapatan tidak valid"] } }` |
