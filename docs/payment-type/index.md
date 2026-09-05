---
type: OKF Module
title: Payment Type
description: CRUD for payment-type master data — code + name + account + purchase/sale transaction scope + payment mechanism. Soft-delete, company-scoped.
tags: [payment-type, master-data]
timestamp: 2026-09-05T13:00:00Z
---

# Payment Type

Master data for payment types used by purchase and sale transactions. Each payment type maps to one [Account](../account/index.md)
account it posts to. Consumed by `frontend/src/views/payment-type/`.
Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only. Same immutable-code
contract as [Brand](../brand/index.md) / [ProductCategory](../product-category/index.md) /
[Unit](../unit/index.md) / [Branch](../branch/index.md) / [Department](../department/index.md) /
[Warehouse](../warehouse/index.md) / [SalesType](../sales-type/index.md). Like
SalesType, `account_id` **can** be changed on update — only `code`
is locked.

`account_id` must reference a non-deleted `Account` belonging to the
same active company; its `code`/`name` are denormalized onto the row for display
(same pattern as `Warehouse.branch_code`/`branch_name`).

`transaction_type` scopes which flow the payment type applies to (`purchase` \|
`sale`); `method` is the payment mechanism (`cash` \| `return_deduction` \|
`down_payment`). Both are fixed picklists, no company-specific customization.

## Entity: `PaymentType`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode" |
| `name` | string | required; min 2 — "Nama" |
| `account_id` | number | required; non-deleted `Account` in the same company — "Akun Perkiraan" |
| `account_code` | string | denormalized from `Account.code`, read-only |
| `account_name` | string | denormalized from `Account.name`, read-only |
| `transaction_type` | enum | `purchase` \| `sale` — "Transaksi" |
| `method` | enum | `cash` \| `return_deduction` \| `down_payment` — "Jenis" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/payment-type` | [list-payment-type](./list-payment-type.md) |
| GET | `/payment-type/:id` | [get-payment-type](./get-payment-type.md) |
| POST | `/payment-type` | [create-payment-type](./create-payment-type.md) |
| PUT | `/payment-type/:id` | [update-payment-type](./update-payment-type.md) |
| DELETE | `/payment-type/:id` | [delete-payment-type](./delete-payment-type.md) |
