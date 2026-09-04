---
type: OKF Module
title: Kategori (Master Kategori Produk)
description: CRUD for product category master data — code + name. Soft-delete, company-scoped.
tags: [kategori, master-data]
timestamp: 2026-09-04T11:00:00Z
---

# Kategori

Master data for product categories. Consumed by `frontend/src/views/kategori/`
(list, detail, tambah, edit) and (later) referenced by product master data.
Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `ELK` code. Same contract as [Merk](../merk/index.md).

## Entity: `Kategori`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Kategori" |
| `name` | string | required; min 2 — "Nama Kategori" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/kategori` | [list-kategori](./list-kategori.md) |
| GET | `/kategori/:id` | [get-kategori](./get-kategori.md) |
| POST | `/kategori` | [create-kategori](./create-kategori.md) |
| PUT | `/kategori/:id` | [update-kategori](./update-kategori.md) |
| DELETE | `/kategori/:id` | [delete-kategori](./delete-kategori.md) |
