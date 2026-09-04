---
type: OKF Module
title: Gudang (Master Gudang)
description: CRUD for warehouse master data — code + name + cabang + optional address. Soft-delete, company-scoped.
tags: [gudang, master-data]
timestamp: 2026-09-04T15:00:00Z
---

# Gudang

Master data for warehouses. Each warehouse belongs to one [Cabang](../cabang/index.md)
(branch) within the same company. Consumed by `frontend/src/views/gudang/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `GD1` code. Same contract as [Merk](../merk/index.md) /
[Kategori](../kategori/index.md) / [Satuan](../satuan/index.md) / [Cabang](../cabang/index.md) /
[Departemen](../departemen/index.md).

`cabang_id` must reference a `Cabang` belonging to the **same active company** — a
warehouse can't be assigned to another company's branch. `cabang_code`/`cabang_name`
are denormalized onto every read for display, resolved fresh from the Cabang store on
create/update (same pattern as `JurnalLine.akun_code`/`akun_name`).

`address` is optional, unlike the required fields — same convention as `Cabang.address`.

## Entity: `Gudang`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Gudang" |
| `name` | string | required; min 2 — "Nama Gudang" |
| `cabang_id` | number | required; must be a non-deleted `Cabang` in the same company — "Cabang" |
| `cabang_code` | string | denormalized from `Cabang.code`, read-only |
| `cabang_name` | string | denormalized from `Cabang.name`, read-only |
| `address` | string | optional — "Alamat" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/gudang` | [list-gudang](./list-gudang.md) |
| GET | `/gudang/:id` | [get-gudang](./get-gudang.md) |
| POST | `/gudang` | [create-gudang](./create-gudang.md) |
| PUT | `/gudang/:id` | [update-gudang](./update-gudang.md) |
| DELETE | `/gudang/:id` | [delete-gudang](./delete-gudang.md) |
