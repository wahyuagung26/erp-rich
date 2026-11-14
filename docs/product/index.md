---
type: OKF Module
title: Product (Master Produk)
description: CRUD for product master data — code + name + type + 5 classification FKs + stock/price + read-only hpp_avg. Soft-delete, company-scoped.
tags: [product, master-data]
timestamp: 2026-09-07T10:00:00Z
---

# Product

Master data for products. Consumed by `frontend/src/views/product/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only. No format
constraint on `code` (plain text, same as [Brand](../brand/index.md)/
[ProductCategory](../product-category/index.md)).

The most cross-referenced master-data entity so far — **five foreign keys**,
each denormalized onto the row with its `code`/`name` on write, same pattern as
[Warehouse](../warehouse/index.md)'s `branch_code`/`branch_name`:

- `brand_id` → [Brand](../brand/index.md)
- `product_category_id` → [ProductCategory](../product-category/index.md)
- `sales_type_id` → [SalesType](../sales-type/index.md)
- `supplier_id` → [Supplier](../supplier/index.md)
- `unit_id` → [Unit](../unit/index.md)

All five are **required** on every product regardless of `type` — no
conditional requiredness (a prototype-scope simplification).

`last_purchase_price` and `selling_price` are user-typed money amounts (whole
Rupiah, no decimals — matches the app-wide money convention). `hpp_avg` is the
same money type but **read-only** — it is not accepted by create/update, only
shown (disabled) in the product form and set by the price-only
[PATCH endpoint](../product-price/update-price.md). `photo_url` is a data-URL
string, same shortcut as `Company.logo_url`.

## Entity: `Product`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Produk" |
| `name` | string | required; min 2 — "Nama Produk" |
| `type` | `'service' \| 'raw_material' \| 'finished_good'` | required — "Jenis Produk" (Jasa / Bahan Baku / Produk Jadi) |
| `brand_id` | number | required; must belong to the active company — "Merk" |
| `brand_code`, `brand_name` | string | denormalized from `brand_id` on write |
| `product_category_id` | number | required; must belong to the active company — "Kategori Produk" |
| `product_category_code`, `product_category_name` | string | denormalized from `product_category_id` on write |
| `sales_type_id` | number | required; must belong to the active company — "Jenis Penjualan" |
| `sales_type_code`, `sales_type_name` | string | denormalized from `sales_type_id` on write |
| `supplier_id` | number | required; must belong to the active company — "Supplier Utama" |
| `supplier_code`, `supplier_name` | string | denormalized from `supplier_id` on write |
| `unit_id` | number | required; must belong to the active company — "Satuan" |
| `unit_code`, `unit_name` | string | denormalized from `unit_id` on write |
| `min_stock` | number | required, integer, >= 0 — "Stok Minimal" |
| `notes` | string | optional — "Keterangan" |
| `last_purchase_price` | number | required, integer (whole Rupiah), >= 0 — "Harga Beli Terakhir" |
| `selling_price` | number | required, integer (whole Rupiah), >= 0 — "Harga Jual" |
| `hpp_avg` | number | read-only, integer (whole Rupiah), >= 0 — "HPP Rata-rata". Average cost of goods. **Never** set via create/update — seeded in the mock, computed from purchase history by the backend. Editable price screen: [product-price](../product-price/index.md) |
| `photo_url` | string | optional, data-URL string (max 2 MB, client-enforced) — "Foto Produk" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/product` | [list-product](./list-product.md) |
| GET | `/product/:id` | [get-product](./get-product.md) |
| POST | `/product` | [create-product](./create-product.md) |
| PUT | `/product/:id` | [update-product](./update-product.md) |
| DELETE | `/product/:id` | [delete-product](./delete-product.md) |
