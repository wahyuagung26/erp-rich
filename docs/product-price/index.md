---
type: OKF Module
title: Harga Produk (Product Pricing)
description: Price-editing screen over the Product master — inline edit of selling_price + last_purchase_price, with read-only HPP and computed margin.
tags: [product, pricing, master-data]
timestamp: 2026-11-15T12:00:00Z
---

# Harga Produk

Not a separate entity — a focused screen for setting product prices in bulk,
replacing the legacy CI "Setting Harga". Consumed by
`frontend/src/views/product-price/` (single list page, inline editing).
Company-scoped via the underlying [Product](../product/index.md) rows.

## Data

Rows are [`Product`](../product/index.md) records. Relevant fields:

| Field | Editable here | Notes |
|---|---|---|
| `code` | no | shown as the row identifier ("PdANo" in the legacy screen) |
| `name` | no | "Produk" |
| `hpp_avg` | no | "HPP Rata-rata" — read-only average cost, set by purchases |
| `last_purchase_price` | **yes** | "Harga Beli Sebelum Pajak" |
| `selling_price` | **yes** | "Harga Jual Sebelum Pajak". Product without variants: the product row. Product with variants: one inline edit per SKU (`variants[].selling_price`), saved through [update-variant-price](./update-variant-price.md) |
| margin | — | computed client-side per row / per SKU: `selling_price - hpp_avg`, plus `% = margin / hpp_avg` (shown as `—` when `hpp_avg` is 0) |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/product` | reuses [list-product](../product/list-product.md) — with `q`, `brand_id`, `product_category_id` filters (the screen's Filter Produk / Merk / Kategori) |
| PATCH | `/product/:id/price` | [update-price](./update-price.md) — save one row's prices |
| PATCH | `/product-variant/:id/price` | [update-variant-price](./update-variant-price.md) — save one SKU's selling price |

The mock handlers for both live in `frontend/src/mocks/modules/product.ts`
(shared with the Product module).
