---
type: OKF Module
title: Department (Master Department)
description: CRUD for department master data — code + name. Soft-delete, company-scoped.
tags: [department, master-data]
timestamp: 2026-09-09T00:00:00Z
---

# Department

Master data for departments (Finance, HRD, Marketing, …). Consumed by
`frontend/src/views/department/` (list, detail, tambah, edit). Company-scoped —
see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `FIN` code. Same contract as [Brand](../brand/index.md) /
[Product Category](../product-category/index.md) / [Unit](../unit/index.md) / [Branch](../branch/index.md).

## Entity: `Department`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Department" |
| `name` | string | required; min 2 — "Nama Department" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/department` | [list-department](./list-department.md) |
| GET | `/department/:id` | [get-department](./get-department.md) |
| POST | `/department` | [create-department](./create-department.md) |
| PUT | `/department/:id` | [update-department](./update-department.md) |
| DELETE | `/department/:id` | [delete-department](./delete-department.md) |
