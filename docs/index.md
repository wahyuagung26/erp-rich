---
type: OKF Bundle
title: ERP Finance v2 — API Contract
description: Frontend-authored API specification. Each module is a directory; each endpoint is one file. The mock and the future backend both follow these files.
tags: [erp, finance, api, contract]
timestamp: 2026-09-04T13:00:00Z
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
| Perusahaan (Master Perusahaan) | [`perusahaan/`](./perusahaan/index.md) | `views/perusahaan/` | `mocks/modules/perusahaan.ts` |
| Merk (Master Merk Produk) | [`merk/`](./merk/index.md) | `views/merk/` | `mocks/modules/merk.ts` |
| Kategori (Master Kategori Produk) | [`kategori/`](./kategori/index.md) | `views/kategori/` | `mocks/modules/kategori.ts` |
| Satuan (Master Satuan Produk) | [`satuan/`](./satuan/index.md) | `views/satuan/` | `mocks/modules/satuan.ts` |
| Cabang (Master Cabang) | [`cabang/`](./cabang/index.md) | `views/cabang/` | `mocks/modules/cabang.ts` |
| Departemen (Master Departemen) | [`departemen/`](./departemen/index.md) | `views/departemen/` | `mocks/modules/departemen.ts` |
| Gudang (Master Gudang) | [`gudang/`](./gudang/index.md) | `views/gudang/` | `mocks/modules/gudang.ts` |
| Jenis Penjualan (Master Jenis Penjualan) | [`jenis-penjualan/`](./jenis-penjualan/index.md) | `views/jenis-penjualan/` | `mocks/modules/jenis-penjualan.ts` |
| Tipe Pembayaran (Master Tipe Pembayaran) | [`tipe-pembayaran/`](./tipe-pembayaran/index.md) | `views/tipe-pembayaran/` | `mocks/modules/tipe-pembayaran.ts` |
| Group Akun (Master Group Akun) | [`group-akun/`](./group-akun/index.md) | `views/group-akun/` | `mocks/modules/group-akun.ts` |
| Sub Akun (Master Sub Akun) | [`sub-akun/`](./sub-akun/index.md) | `views/sub-akun/` | `mocks/modules/sub-akun.ts` |
| Akun Perkiraan (Master Akun Perkiraan) | [`akun-perkiraan/`](./akun-perkiraan/index.md) | `views/akun-perkiraan/` | `mocks/modules/akun-perkiraan.ts` |
| Supplier (Master Vendor) | [`supplier/`](./supplier/index.md) | `views/supplier/` | `mocks/modules/supplier.ts` |
| Customer (Master Pelanggan) | [`customer/`](./customer/index.md) | `views/customer/` | `mocks/modules/customer.ts` |
| Jurnal Umum (Journal) | [`jurnal/`](./jurnal/index.md) | `views/jurnal/` | `mocks/modules/jurnal.ts` |
| Dashboard | [`dashboard/`](./dashboard/index.md) | `views/dashboard/` | `mocks/modules/dashboard.ts` |

New module: copy [`_TEMPLATE.md`](./_TEMPLATE.md) into `docs/<module>/<endpoint>.md`.
