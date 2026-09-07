---
type: API Endpoint
title: Create Product
description: Add a new product. Client supplies `code` and 5 FK ids; server assigns `id` and denormalizes each FK's code/name.
method: POST
path: /product
status: mock
tags: [product, write]
resource: /frontend/src/mocks/modules/product.ts
timestamp: 2026-09-07T00:00:00Z
---

# Create Product

Backs `views/product/pages/PageProductTambah.vue`. Client-side validation:
`frontend/src/views/product/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{
  "code": "PRD001",
  "name": "Kulkas 2 Pintu",
  "type": "finished_good",
  "brand_id": 1,
  "product_category_id": 1,
  "sales_type_id": 1,
  "supplier_id": 1,
  "unit_id": 1,
  "min_stock": 5,
  "notes": "Stok gudang utama",
  "last_purchase_price": 3500000,
  "selling_price": 4200000,
  "photo_url": ""
}
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique within the active company across non-deleted rows; trimmed; immutable once created |
| `name` | string | required; min 2 |
| `type` | string | required; one of `service`, `raw_material`, `finished_good` |
| `brand_id` | number | required; must reference a non-deleted `Brand` in the active company |
| `product_category_id` | number | required; must reference a non-deleted `ProductCategory` in the active company |
| `sales_type_id` | number | required; must reference a non-deleted `SalesType` in the active company |
| `supplier_id` | number | required; must reference a non-deleted `Supplier` in the active company |
| `unit_id` | number | required; must reference a non-deleted `Unit` in the active company |
| `min_stock` | number | required; integer >= 0 |
| `notes` | string | optional |
| `last_purchase_price` | number | required; integer >= 0 |
| `selling_price` | number | required; integer >= 0 |
| `photo_url` | string | optional; data-URL string |

`id` and `company_id` are **not** accepted from the client — the server assigns
them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)). The five `*_code`/`*_name`
denormalized fields are **not** accepted from the client either — the server
looks each `*_id` up and stamps its own `code`/`name`.

## Response

`201`:

```json
{ "data": { "id": 4, "company_id": 1, "code": "PRD001", "name": "Kulkas 2 Pintu", "type": "finished_good", "brand_id": 1, "brand_code": "SGT", "brand_name": "Samsung", "...": "..." }, "message": "Produk ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used within the active company | `{ "message": "...", "errors": { "code": ["Kode produk sudah dipakai"] } }` |
| `422` | `brand_id` doesn't reference a valid row | `{ "message": "...", "errors": { "brand_id": ["Merk tidak valid"] } }` |
| `422` | `product_category_id` doesn't reference a valid row | `{ "message": "...", "errors": { "product_category_id": ["Kategori produk tidak valid"] } }` |
| `422` | `sales_type_id` doesn't reference a valid row | `{ "message": "...", "errors": { "sales_type_id": ["Jenis penjualan tidak valid"] } }` |
| `422` | `supplier_id` doesn't reference a valid row | `{ "message": "...", "errors": { "supplier_id": ["Supplier utama tidak valid"] } }` |
| `422` | `unit_id` doesn't reference a valid row | `{ "message": "...", "errors": { "unit_id": ["Satuan tidak valid"] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
