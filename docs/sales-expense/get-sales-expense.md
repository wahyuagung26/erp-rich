---
type: API Endpoint
title: Get Sales Expense
description: Fetch one sales expense by id.
method: GET
path: /sales-expense/:id
status: mock
tags: [sales-expense, read]
resource: /frontend/src/mocks/modules/sales-expense.ts
timestamp: 2026-11-04T14:00:00Z
---

# Get Sales Expense

Backs `views/sales-expense/pages/PageSalesExpenseDetail.vue` (read-only view) and
`PageSalesExpenseEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesExpense.id` |

## Response

`200`: `{ "data": { ...SalesExpense } }` — same shape as one row of [list-sales-expense](./list-sales-expense.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Biaya penjualan tidak ditemukan" }` |
