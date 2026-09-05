---
type: OKF Module
title: Branch (Master Branch)
description: CRUD for branch master data — code + name + address. Soft-delete, company-scoped.
tags: [branch, master-data]
timestamp: 2026-09-05T00:00:00Z
---

# Branch

Master data for company branches. Consumed by `frontend/src/views/branch/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `PST` code. Same contract as [Brand](../brand/index.md) /
[ProductCategory](../product-category/index.md) / [Unit](../unit/index.md), plus an `address` field.

## Entity: `Branch`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Cabang" |
| `name` | string | required; min 2 — "Nama Cabang" |
| `address` | string | optional — "Alamat" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/branch` | [list-branch](./list-branch.md) |
| GET | `/branch/:id` | [get-branch](./get-branch.md) |
| POST | `/branch` | [create-branch](./create-branch.md) |
| PUT | `/branch/:id` | [update-branch](./update-branch.md) |
| DELETE | `/branch/:id` | [delete-branch](./delete-branch.md) |
