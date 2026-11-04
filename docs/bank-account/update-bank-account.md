---
type: API Endpoint
title: Update Sales Expense
description: Edit an existing sales expense's name, account, or notes. Code is immutable.
method: PUT
path: /bank-account/:id
status: mock
tags: [bank-account, write]
resource: /frontend/src/mocks/modules/bank-account.ts
timestamp: 2026-11-04T15:00:00Z
---

# Update Sales Expense

Backs `views/bank-account/pages/PageBankAccountEdit.vue`. All fields from [create-bank-account](./create-bank-account.md) can change.

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
{ "bank_code": "CIMB", "bank_name": "Bank CIMB Niaga - 9200 (IDR)", "account_number": "800204893200", "account_holder": "PT Cakrawala", "account_id": 17, "notes": "Rekening operasional" }
```

`id` and `company_id` are ignored if sent — a row can't be moved to another company via this
endpoint. `account_id` is re-validated the same as on create.

## Response

`200`: `{ "data": { ...BankAccount }, "message": "Rekening bank diperbarui" }` — `account_code`/`account_name`
are re-resolved from the (possibly changed) `account_id`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Rekening bank tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "bank_name": ["..."] } }` |
| `422` | `account_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_id": ["Akun perkiraan tidak valid"] } }` |
