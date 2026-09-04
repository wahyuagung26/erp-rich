---
type: OKF Module
title: Departemen (Master Departemen)
description: CRUD for department master data — code + name. Soft-delete, company-scoped.
tags: [departemen, master-data]
timestamp: 2026-09-04T14:00:00Z
---

# Departemen

Master data for departments (Finance, HRD, Marketing, …). Consumed by
`frontend/src/views/departemen/` (list, detail, tambah, edit). Company-scoped —
see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `FIN` code. Same contract as [Merk](../merk/index.md) /
[Kategori](../kategori/index.md) / [Satuan](../satuan/index.md) / [Cabang](../cabang/index.md).

## Entity: `Departemen`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Departemen" |
| `name` | string | required; min 2 — "Nama Departemen" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/departemen` | [list-departemen](./list-departemen.md) |
| GET | `/departemen/:id` | [get-departemen](./get-departemen.md) |
| POST | `/departemen` | [create-departemen](./create-departemen.md) |
| PUT | `/departemen/:id` | [update-departemen](./update-departemen.md) |
| DELETE | `/departemen/:id` | [delete-departemen](./delete-departemen.md) |
