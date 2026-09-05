---
type: OKF Module
title: Sub Account (Master Sub Account)
description: CRUD for sub-account master data under an Account Group — server-composed code, name, normal balance. Soft-delete, company-scoped.
tags: [sub-account, master-data, akuntansi]
timestamp: 2026-09-05T10:00:00Z
---

# Sub Account

Master data for sub-accounts, under the "Akuntansi" menu, each belonging to one
[Account Group](../account-group/index.md) within the same company. Consumed by
`frontend/src/views/sub-account/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

## Code composition

`code` is **server-composed**, not sent whole by the client:

- The first 2 digits are the owning `AccountGroup.code`, zero-padded to 2 (e.g. group
  code `5` → prefix `05`; group code `10` → prefix `10`).
- The last 3 digits are `code_suffix`, entered by the user (exactly 3 digits,
  `^\d{3}$`) — the UI only asks for these, since the prefix is implied by the
  chosen group.
- The resulting `code` is always exactly 5 numeric characters, satisfying the
  "max 5 karakter numeric" rule.

Both `account_group_id` and the resulting `code` are **immutable after create** — the
edit form disables the group picker and shows the full code disabled (same
immutable-identifier convention as [Brand](../brand/index.md) / [ProductCategory](../product-category/index.md) /
[Unit](../unit/index.md) / [Branch](../branch/index.md) / [Department](../department/index.md) /
[Warehouse](../warehouse/index.md) / [AccountGroup](../account-group/index.md), extended here to the group
reference too since it determines the code prefix).

`account_group_code`/`account_group_name` are denormalized onto every read for display,
resolved fresh from the AccountGroup store on create (same pattern as
`Warehouse.branch_code`/`branch_name`).

## Entity: `SubAccount`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `account_group_id` | number | required; must be a non-deleted `AccountGroup` in the same company; **immutable after create** — "Group Perkiraan" |
| `account_group_code` | string | denormalized from `AccountGroup.code`, read-only |
| `account_group_name` | string | denormalized from `AccountGroup.name`, read-only |
| `code` | string | server-composed (`account_group_code` zero-padded to 2 + 3-digit suffix), exactly 5 numeric digits; **immutable after create** — "Kode Sub Akun" |
| `name` | string | required; min 2 — "Nama Sub Akun" |
| `normal_balance` | enum | `debit` \| `credit` — "Saldo Normal" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sub-account` | [list-sub-account](./list-sub-account.md) |
| GET | `/sub-account/:id` | [get-sub-account](./get-sub-account.md) |
| POST | `/sub-account` | [create-sub-account](./create-sub-account.md) |
| PUT | `/sub-account/:id` | [update-sub-account](./update-sub-account.md) |
| DELETE | `/sub-account/:id` | [delete-sub-account](./delete-sub-account.md) |
