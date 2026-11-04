---
type: OKF Module
title: Sales Expense (Master Biaya Penjualan)
description: CRUD for sales-expense master data — code + name + expense account + optional notes. Soft-delete, company-scoped.
tags: [sales-expense, master-data]
timestamp: 2026-11-04T14:00:00Z
---

# Sales Expense

Master data for expenses incurred on sales (e.g. shipping, packing). Each sales expense maps to one
[Account](../account/index.md) it posts to ("Akun Biaya"). Consumed by `frontend/src/views/sales-expense/`
(list = "Daftar Biaya Penjualan", form = "Detail Biaya"). Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit form shows it
disabled, and the backend must ignore any `code` sent on update. `code` uniqueness is checked within the
active company only. Same contract as [PaymentType](../payment-type/index.md) /
[Warehouse](../warehouse/index.md); `account_id` **can** be changed on update.

`account_id` must reference a non-deleted `Account` belonging to the same active company; its
`code`/`name` are denormalized onto the row for display (same pattern as `PaymentType.account_code`/`account_name`).

`notes` is optional, like `Warehouse.address`.

## Entity: `SalesExpense`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode" |
| `name` | string | required; min 2 — "Nama Biaya" |
| `account_id` | number | required; non-deleted `Account` in the same company — "Akun Biaya" |
| `account_code` | string | denormalized from `Account.code`, read-only |
| `account_name` | string | denormalized from `Account.name`, read-only |
| `notes` | string | optional — "Catatan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sales-expense` | [list-sales-expense](./list-sales-expense.md) |
| GET | `/sales-expense/:id` | [get-sales-expense](./get-sales-expense.md) |
| POST | `/sales-expense` | [create-sales-expense](./create-sales-expense.md) |
| PUT | `/sales-expense/:id` | [update-sales-expense](./update-sales-expense.md) |
| DELETE | `/sales-expense/:id` | [delete-sales-expense](./delete-sales-expense.md) |
