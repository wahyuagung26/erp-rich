---
type: OKF Module
title: Cabang (Master Cabang)
description: CRUD for branch master data — code + name + address. Soft-delete, company-scoped.
tags: [cabang, master-data]
timestamp: 2026-09-04T13:00:00Z
---

# Cabang

Master data for company branches. Consumed by `frontend/src/views/cabang/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `PST` code. Same contract as [Merk](../merk/index.md) /
[Kategori](../kategori/index.md) / [Satuan](../satuan/index.md), plus an `address` field.

## Entity: `Cabang`

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
| GET | `/cabang` | [list-cabang](./list-cabang.md) |
| GET | `/cabang/:id` | [get-cabang](./get-cabang.md) |
| POST | `/cabang` | [create-cabang](./create-cabang.md) |
| PUT | `/cabang/:id` | [update-cabang](./update-cabang.md) |
| DELETE | `/cabang/:id` | [delete-cabang](./delete-cabang.md) |
