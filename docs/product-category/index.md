---
type: OKF Module
title: Product Category (Master Product Category)
description: CRUD for product category master data — code + name. Soft-delete, company-scoped.
tags: [product-category, master-data]
timestamp: 2026-09-05T00:00:00Z
---

# Product Category

Master data for product categories. Consumed by `frontend/src/views/product-category/`
(list, detail, tambah, edit) and (later) referenced by product master data.
Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `ELK` code. Same contract as [Brand](../brand/index.md).

## Entity: `ProductCategory`

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
| GET | `/product-category` | [list-product-category](./list-product-category.md) |
| GET | `/product-category/:id` | [get-product-category](./get-product-category.md) |
| POST | `/product-category` | [create-product-category](./create-product-category.md) |
| PUT | `/product-category/:id` | [update-product-category](./update-product-category.md) |
| DELETE | `/product-category/:id` | [delete-product-category](./delete-product-category.md) |
