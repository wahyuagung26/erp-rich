---
type: OKF Module
title: Sales (Master Sales)
description: CRUD for sales rep master data — code + name + address. Soft-delete, company-scoped.
tags: [sales, master-data]
timestamp: 2026-09-07T00:00:00Z
---

# Sales

Master data for sales reps. Consumed by `frontend/src/views/sales/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `SL01` code. Same contract as [Branch](../branch/index.md),
plus an optional `address` field.

## Entity: `Sales`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Sales" |
| `name` | string | required; min 2 — "Nama Sales" |
| `address` | string | optional — "Alamat" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sales` | [list-sales](./list-sales.md) |
| GET | `/sales/:id` | [get-sales](./get-sales.md) |
| POST | `/sales` | [create-sales](./create-sales.md) |
| PUT | `/sales/:id` | [update-sales](./update-sales.md) |
| DELETE | `/sales/:id` | [delete-sales](./delete-sales.md) |
