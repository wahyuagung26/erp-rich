---
type: OKF Module
title: Satuan (Master Satuan Produk)
description: CRUD for unit-of-measure master data — code + name. Soft-delete, company-scoped.
tags: [satuan, master-data]
timestamp: 2026-09-04T12:00:00Z
---

# Satuan

Master data for units of measure (PCS, BOX, KG, …). Consumed by
`frontend/src/views/satuan/` (list, detail, tambah, edit) and (later) referenced by
product master data. Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `PCS` code. Same contract as [Merk](../merk/index.md) /
[Kategori](../kategori/index.md).

## Entity: `Satuan`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Satuan" |
| `name` | string | required; min 2 — "Nama Satuan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/satuan` | [list-satuan](./list-satuan.md) |
| GET | `/satuan/:id` | [get-satuan](./get-satuan.md) |
| POST | `/satuan` | [create-satuan](./create-satuan.md) |
| PUT | `/satuan/:id` | [update-satuan](./update-satuan.md) |
| DELETE | `/satuan/:id` | [delete-satuan](./delete-satuan.md) |
