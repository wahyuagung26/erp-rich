---
type: OKF Module
title: Purchase Type (Master Jenis Pembelian)
description: CRUD for purchase type master data — code + name + notes. Soft-delete, company-scoped.
tags: [purchase-type, master-data]
timestamp: 2026-09-07T00:00:00Z
---

# Purchase Type

Master data for purchase types. Consumed by `frontend/src/views/purchase-type/`
(list, detail, tambah, edit). Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only. Unlike other
master-data modules, `code` here is constrained to **uppercase letters A-Z only,
max 5 characters** (no digits, no symbols) — same shape as
[Sales](../sales/index.md)/[Channel](../channel/index.md), plus this stricter
code format.

## Entity: `PurchaseType`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, uppercase `A-Z` only, 1-5 characters, unique within the company across non-deleted rows; **immutable after create** — "Kode Jenis Pembelian" |
| `name` | string | required; min 2 — "Nama Jenis Pembelian" |
| `notes` | string | optional — "Keterangan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/purchase-type` | [list-purchase-type](./list-purchase-type.md) |
| GET | `/purchase-type/:id` | [get-purchase-type](./get-purchase-type.md) |
| POST | `/purchase-type` | [create-purchase-type](./create-purchase-type.md) |
| PUT | `/purchase-type/:id` | [update-purchase-type](./update-purchase-type.md) |
| DELETE | `/purchase-type/:id` | [delete-purchase-type](./delete-purchase-type.md) |
