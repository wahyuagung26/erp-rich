---
type: OKF Module
title: Sales Type (Master Sales Type)
description: CRUD for sales-type master data — maps a sales type to its revenue, COGS, inventory, and expense accounts. Soft-delete, company-scoped.
tags: [sales-type, master-data]
timestamp: 2026-09-05T12:00:00Z
---

# Sales Type

Master data for sales types (e.g. "Bahan Baku", "Jasa"). Each sales type maps to
four [Account](../account/index.md) accounts — revenue, COGS
("HPP"), inventory, and expense ("Biaya") — so a future sales module can
auto-fill journal entries per transaction without the user picking accounts every
time. Consumed by `frontend/src/views/sales-type/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only. Same immutable-code
contract as [Brand](../brand/index.md) / [ProductCategory](../product-category/index.md) /
[Unit](../unit/index.md) / [Branch](../branch/index.md) / [Department](../department/index.md) /
[Warehouse](../warehouse/index.md). Unlike those, the four account references
(`revenue_account_id`, `cogs_account_id`, `inventory_account_id`, `expense_account_id`) **can**
be changed on update — only `code` is locked.

Each `*_account_id` must reference a non-deleted `Account` belonging to the same
active company; its `code`/`name` are denormalized onto the row for display
(same pattern as `Warehouse.branch_code`/`branch_name`). The UI does not restrict
which account `type` can be picked for which slot (e.g. nothing stops picking an
`expense` account as "Akun Pendapatan") — that validation is left for later if
the sales module needs it.

## Entity: `SalesType`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Jenis" |
| `name` | string | required; min 2 — "Jenis" |
| `revenue_account_id` | number | required; non-deleted `Account` in the same company — "Akun Pendapatan" |
| `revenue_account_code` | string | denormalized from `Account.code`, read-only |
| `revenue_account_name` | string | denormalized from `Account.name`, read-only |
| `cogs_account_id` | number | required; non-deleted `Account` in the same company — "Akun HPP" |
| `cogs_account_code` | string | denormalized, read-only |
| `cogs_account_name` | string | denormalized, read-only |
| `inventory_account_id` | number | required; non-deleted `Account` in the same company — "Akun Persediaan" |
| `inventory_account_code` | string | denormalized, read-only |
| `inventory_account_name` | string | denormalized, read-only |
| `expense_account_id` | number | required; non-deleted `Account` in the same company — "Akun Biaya" |
| `expense_account_code` | string | denormalized, read-only |
| `expense_account_name` | string | denormalized, read-only |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sales-type` | [list-sales-type](./list-sales-type.md) |
| GET | `/sales-type/:id` | [get-sales-type](./get-sales-type.md) |
| POST | `/sales-type` | [create-sales-type](./create-sales-type.md) |
| PUT | `/sales-type/:id` | [update-sales-type](./update-sales-type.md) |
| DELETE | `/sales-type/:id` | [delete-sales-type](./delete-sales-type.md) |
