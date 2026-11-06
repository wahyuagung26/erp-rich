---
type: OKF Module
title: Daftar Harga (Penjualan)
description: Read-only price + available-stock lookup for sales — one row per product with harga jual and stok per gudang. No writes, no own entity.
tags: [penjualan, price-list, read-only]
timestamp: 2026-11-06T12:00:00Z
---

# Daftar Harga

A reference screen for sales staff answering "berapa harganya dan apakah barangnya ada?" before they make a Sales Order
or Invoice. Legacy: `stok_harga` (PRD `sales/09-daftar-harga.md`) — **read-only**; prices are edited in
[Harga Produk](../product-price/index.md) (Master). Not a separate entity: rows are [Product](../product/index.md) records
joined with a stock figure.

Company-scoped (see [conventions](../conventions.md#company-scoping)). **Not subject to the closing-period lock** — no date, no jurnal/stok effect.

## Row shape

| Field | Type | Notes |
|---|---|---|
| `id` | number | the product id |
| `code`, `name` | string | product code / name |
| `type` | enum | `service` \| `raw_material` \| `finished_good` |
| `brand_id`, `brand_code`, `brand_name` | | denormalized from Product |
| `product_category_id`, `product_category_code`, `product_category_name` | | denormalized from Product |
| `unit_name` | string | satuan harga |
| `selling_price` | number | harga jual **sebelum pajak**, whole Rupiah; `0` = belum diset |
| `has_price` | boolean | `selling_price > 0`; when `false` the UI shows the warning "Harga belum diset" |
| `stock_qty` | number \| null | available stock; `null` for `service` (no stock) |
| `min_stock` | number | product's minimum stock |
| `stock_warning` | `'empty'` \| `'low'` \| null | `empty` = `stock_qty <= 0`, `low` = `stock_qty < min_stock` |

HPP, harga beli and margin are deliberately **not** part of this contract (finance-only data; the PRD makes them an
optional extra for supervisors). Use [Harga Produk](../product-price/index.md) for those.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/price-list` | [list-price-list](./list-price-list.md) |
