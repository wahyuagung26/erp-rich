---
type: API Endpoint
title: Update Payment Type
description: Edit an existing payment type's name, account, or classification. Code is immutable.
method: PUT
path: /payment-type/:id
status: mock
tags: [payment-type, write]
resource: /frontend/src/mocks/modules/payment-type.ts
timestamp: 2026-09-05T13:00:00Z
---

# Update Payment Type

Backs `views/payment-type/pages/PagePaymentTypeEdit.vue`. The form shows
`code` disabled — this endpoint ignores `code` even if sent; `name`,
`account_id`, `transaction_type`, and `method` can change.

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
{ "name": "Tunai Kasir", "account_id": 1, "transaction_type": "sale", "method": "cash" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...PaymentType }, "message": "Tipe pembayaran diperbarui" }` —
`account_code`/`account_name` are re-resolved from the (possibly
changed) `account_id`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Tipe pembayaran tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | `account_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "account_id": ["Akun perkiraan tidak valid"] } }` |
