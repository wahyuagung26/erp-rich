---
type: API Endpoint
title: Update Sales Expense
description: Edit an existing sales expense's name, account, or notes. Code is immutable.
method: PUT
path: /sales-expense/:id
status: mock
tags: [sales-expense, write]
resource: /frontend/src/mocks/modules/sales-expense.ts
timestamp: 2026-11-04T14:00:00Z
---

# Update Sales Expense

Backs `views/sales-expense/pages/PageSalesExpenseEdit.vue`. The form shows `code` disabled — this endpoint
ignores `code` even if sent; `name`, `account_id`, and `notes` can change.

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
{ "name": "Biaya Pengiriman Ekspres", "account_id": 2, "notes": "" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to another company via this
endpoint. `account_id` is re-validated the same as on create.

## Response

`200`: `{ "data": { ...SalesExpense }, "message": "Biaya penjualan diperbarui" }` — `account_code`/`account_name`
are re-resolved from the (possibly changed) `account_id`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Biaya penjualan tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | `account_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_id": ["Akun biaya tidak valid"] } }` |
