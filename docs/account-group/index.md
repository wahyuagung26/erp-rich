---
type: OKF Module
title: Account Group (Master Account Group)
description: CRUD for account group master data — code + name + balance_sheet/income_statement category + normal balance. Soft-delete, company-scoped.
tags: [account-group, master-data, akuntansi]
timestamp: 2026-09-05T09:00:00Z
---

# Account Group

Master data for account groups, under the "Akuntansi" menu. Classifies which
financial statement an account group rolls up into (`category`: "Neraca" / "Laba
Rugi") and its normal balance side (`normal_balance`: Debit / Kredit — same field
and values as [`SubAccount.normal_balance`](../sub-account/index.md)). Consumed by
`frontend/src/views/account-group/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` is numeric, 1-2 digits (`^\d{1,2}$`, e.g. `10`, `60`). `code` uniqueness is
checked within the active company only — two companies may each have their own `10`
code. Same contract as [Brand](../brand/index.md) / [ProductCategory](../product-category/index.md) /
[Unit](../unit/index.md) / [Branch](../branch/index.md) / [Department](../department/index.md) /
[Warehouse](../warehouse/index.md), with the added numeric-code constraint.

## Entity: `AccountGroup`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered; numeric, max 2 digits (`^\d{1,2}$`); unique within the company across non-deleted rows; **immutable after create** — "Kode Group Akun" |
| `name` | string | required; min 2 — "Nama Group Akun" |
| `category` | enum | `balance_sheet` \| `income_statement` — "Neraca / Laba Rugi" (displayed) |
| `normal_balance` | enum | `debit` \| `credit` — "Saldo Normal" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/account-group` | [list-account-group](./list-account-group.md) |
| GET | `/account-group/:id` | [get-account-group](./get-account-group.md) |
| POST | `/account-group` | [create-account-group](./create-account-group.md) |
| PUT | `/account-group/:id` | [update-account-group](./update-account-group.md) |
| DELETE | `/account-group/:id` | [delete-account-group](./delete-account-group.md) |
