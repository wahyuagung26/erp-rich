---
type: OKF Bundle
title: ERP Finance v2 — API Contract
description: Frontend-authored API specification. Each module is a directory; each endpoint is one file. The mock and the future backend both follow these files.
tags: [erp, finance, api, contract]
timestamp: 2026-09-08T09:00:00Z
---

# ERP Finance v2 — API Contract

This bundle is the **source of truth** for the HTTP API. It is written in
[Open Knowledge Format](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing):
a directory of Markdown files with YAML frontmatter, one file per endpoint.

**Workflow** (prototype phase — frontend first):

1. Before building a frontend module, write/update its endpoint files here.
2. Implement the mock in `frontend/src/mocks/modules/<module>.ts` to match.
3. Build the UI against the mock.
4. Later, the backend implements each endpoint to match its file, then its
   `status` flips `mock` → `implemented`.

**Stay 1:1.** One endpoint = one file here = one handler in
`frontend/src/mocks/modules/<module>.ts` = at least one caller in the frontend. When an
endpoint's last caller is removed, delete its file and its mock handler in the same
change — no "keep for later" files. Bump `timestamp:` whenever you edit a file.

Read [`conventions.md`](./conventions.md) first — it covers the response
envelope, pagination, auth, and error shape that every endpoint inherits.

## Modules

| Module | Contract | Frontend view | Mock |
|---|---|---|---|
| Auth | [`auth/`](./auth/index.md) | `views/auth/` | `mocks/modules/auth.ts` |
| Perusahaan (Master Perusahaan) | [`company/`](./company/index.md) | `views/company/` | `mocks/modules/company.ts` |
| Merk (Master Merk Produk) | [`brand/`](./brand/index.md) | `views/brand/` | `mocks/modules/brand.ts` |
| Kategori (Master Kategori Produk) | [`product-category/`](./product-category/index.md) | `views/product-category/` | `mocks/modules/product-category.ts` |
| Satuan (Master Satuan Produk) | [`unit/`](./unit/index.md) | `views/unit/` | `mocks/modules/unit.ts` |
| Produk (Master Produk) | [`product/`](./product/index.md) | `views/product/` | `mocks/modules/product.ts` |
| Harga Produk (Product Pricing) | [`product-price/`](./product-price/index.md) | `views/product-price/` | `mocks/modules/product.ts` |
| Sales (Master Sales) | [`sales/`](./sales/index.md) | `views/sales/` | `mocks/modules/sales.ts` |
| Channel (Master Channel) | [`channel/`](./channel/index.md) | `views/channel/` | `mocks/modules/channel.ts` |
| Cabang (Master Cabang) | [`branch/`](./branch/index.md) | `views/branch/` | `mocks/modules/branch.ts` |
| Departemen (Master Departemen) | [`department/`](./department/index.md) | `views/department/` | `mocks/modules/department.ts` |
| Gudang (Master Gudang) | [`warehouse/`](./warehouse/index.md) | `views/warehouse/` | `mocks/modules/warehouse.ts` |
| Jenis Penjualan (Master Jenis Penjualan) | [`sales-type/`](./sales-type/index.md) | `views/sales-type/` | `mocks/modules/sales-type.ts` |
| Jenis Pembelian (Master Jenis Pembelian) | [`purchase-type/`](./purchase-type/index.md) | `views/purchase-type/` | `mocks/modules/purchase-type.ts` |
| Tipe Pembayaran (Master Tipe Pembayaran) | [`payment-type/`](./payment-type/index.md) | `views/payment-type/` | `mocks/modules/payment-type.ts` |
| Group Akun (Master Group Akun) | [`account-group/`](./account-group/index.md) | `views/account-group/` | `mocks/modules/account-group.ts` |
| Sub Akun (Master Sub Akun) | [`sub-account/`](./sub-account/index.md) | `views/sub-account/` | `mocks/modules/sub-account.ts` |
| Akun Perkiraan (Master Akun Perkiraan) | [`account/`](./account/index.md) | `views/account/` | `mocks/modules/account.ts` |
| Supplier (Master Vendor) | [`supplier/`](./supplier/index.md) | `views/supplier/` | `mocks/modules/supplier.ts` |
| Customer (Master Pelanggan) | [`customer/`](./customer/index.md) | `views/customer/` | `mocks/modules/customer.ts` |
| Jurnal Umum (Journal) | [`journal/`](./journal/index.md) | `views/journal/` | `mocks/modules/journal.ts` |
| Jurnal Pengeluaran (Journal Expense) | [`journal-expense/`](./journal-expense/index.md) | `views/journal-expense/` | `mocks/modules/journal-expense.ts` |
| Jurnal Pemasukan (Journal Income) | [`journal-income/`](./journal-income/index.md) | `views/journal-income/` | `mocks/modules/journal-income.ts` |
| Uang Muka Operasional (Cash Advance) | [`cash-advance/`](./cash-advance/index.md) | `views/cash-advance/` | `mocks/modules/cash-advance.ts` |
| Posisi Kas & Bank (Cash Position) | [`cash-position/`](./cash-position/index.md) | `views/cash-position/` | `mocks/modules/cash-position.ts` |
| Dashboard | [`dashboard/`](./dashboard/index.md) | `views/dashboard/` | `mocks/modules/dashboard.ts` |

New module: copy [`_TEMPLATE.md`](./_TEMPLATE.md) into `docs/<module>/<endpoint>.md`.
