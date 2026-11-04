---
type: API Endpoint
title: Get Sales Expense
description: Fetch one sales expense by id.
method: GET
path: /bank-account/:id
status: mock
tags: [bank-account, read]
resource: /frontend/src/mocks/modules/bank-account.ts
timestamp: 2026-11-04T15:00:00Z
---

# Get Sales Expense

Backs `views/bank-account/pages/PageBankAccountDetail.vue` (read-only view) and
`PageBankAccountEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `BankAccount.id` |

## Response

`200`: `{ "data": { ...BankAccount } }` — same shape as one row of [list-bank-account](./list-bank-account.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Rekening bank tidak ditemukan" }` |
