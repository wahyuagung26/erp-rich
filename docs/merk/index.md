---
type: OKF Module
title: Merk (Master Merk Produk)
description: CRUD for product brand master data — code + name. Soft-delete.
tags: [merk, master-data]
timestamp: 2026-09-04T10:00:00Z
---

# Merk

Master data for product brands. Consumed by `frontend/src/views/merk/` (list, detail,
tambah, edit) and (later) referenced by product master data. Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `SGT` code.

## Entity: `Merk`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Merk" |
| `name` | string | required; min 2 — "Nama Merk" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/merk` | [list-merk](./list-merk.md) |
| GET | `/merk/:id` | [get-merk](./get-merk.md) |
| POST | `/merk` | [create-merk](./create-merk.md) |
| PUT | `/merk/:id` | [update-merk](./update-merk.md) |
| DELETE | `/merk/:id` | [delete-merk](./delete-merk.md) |
