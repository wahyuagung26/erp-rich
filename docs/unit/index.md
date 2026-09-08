---
type: OKF Module
title: Unit (Master Unit Produk)
description: CRUD for unit-of-measure master data — code + name. Soft-delete, company-scoped.
tags: [unit, master-data]
timestamp: 2026-09-09T00:00:00Z
---

# Unit

Master data for units of measure (PCS, BOX, KG, …). Consumed by
`frontend/src/views/unit/` (list, detail, tambah, edit) and (later) referenced by
product master data. Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `PCS` code. Same contract as [Brand](../brand/index.md) /
[Product Category](../product-category/index.md).

## Entity: `Unit`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Unit" |
| `name` | string | required; min 2 — "Nama Unit" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/unit` | [list-unit](./list-unit.md) |
| GET | `/unit/:id` | [get-unit](./get-unit.md) |
| POST | `/unit` | [create-unit](./create-unit.md) |
| PUT | `/unit/:id` | [update-unit](./update-unit.md) |
| DELETE | `/unit/:id` | [delete-unit](./delete-unit.md) |
