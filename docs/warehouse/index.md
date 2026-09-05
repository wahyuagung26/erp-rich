---
type: OKF Module
title: Warehouse (Master Warehouse)
description: CRUD for warehouse master data — code + name + branch + optional address. Soft-delete, company-scoped.
tags: [warehouse, master-data]
timestamp: 2026-09-05T15:00:00Z
---

# Warehouse

Master data for warehouses. Each warehouse belongs to one [Branch](../branch/index.md)
within the same company. Consumed by `frontend/src/views/warehouse/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `GD1` code. Same contract as [Brand](../brand/index.md) /
[ProductCategory](../product-category/index.md) / [Unit](../unit/index.md) / [Branch](../branch/index.md) /
[Department](../department/index.md).

`branch_id` must reference a `Branch` belonging to the **same active company** — a
warehouse can't be assigned to another company's branch. `branch_code`/`branch_name`
are denormalized onto every read for display, resolved fresh from the Branch store on
create/update (same pattern as `JournalLine.account_code`/`account_name`).

`address` is optional, unlike the required fields — same convention as `Branch.address`.

## Entity: `Warehouse`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Gudang" |
| `name` | string | required; min 2 — "Nama Gudang" |
| `branch_id` | number | required; must be a non-deleted `Branch` in the same company — "Cabang" |
| `branch_code` | string | denormalized from `Branch.code`, read-only |
| `branch_name` | string | denormalized from `Branch.name`, read-only |
| `address` | string | optional — "Alamat" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/warehouse` | [list-warehouse](./list-warehouse.md) |
| GET | `/warehouse/:id` | [get-warehouse](./get-warehouse.md) |
| POST | `/warehouse` | [create-warehouse](./create-warehouse.md) |
| PUT | `/warehouse/:id` | [update-warehouse](./update-warehouse.md) |
| DELETE | `/warehouse/:id` | [delete-warehouse](./delete-warehouse.md) |
