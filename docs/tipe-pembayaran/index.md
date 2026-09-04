---
type: OKF Module
title: Tipe Pembayaran (Master Tipe Pembayaran)
description: CRUD for payment-type master data — code + name + account + Pembelian/Penjualan transaction scope + payment mechanism. Soft-delete, company-scoped.
tags: [tipe-pembayaran, master-data]
timestamp: 2026-09-05T13:00:00Z
---

# Tipe Pembayaran

Master data for payment types used by Pembelian (purchase) and Penjualan (sale)
transactions. Each payment type maps to one [Akun Perkiraan](../akun-perkiraan/index.md)
account it posts to. Consumed by `frontend/src/views/tipe-pembayaran/`.
Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only. Same immutable-code
contract as [Merk](../merk/index.md) / [Kategori](../kategori/index.md) /
[Satuan](../satuan/index.md) / [Cabang](../cabang/index.md) / [Departemen](../departemen/index.md) /
[Gudang](../gudang/index.md) / [Jenis Penjualan](../jenis-penjualan/index.md). Like
Jenis Penjualan, `akun_perkiraan_id` **can** be changed on update — only `code`
is locked.

`akun_perkiraan_id` must reference a non-deleted `AkunPerkiraan` belonging to the
same active company; its `code`/`name` are denormalized onto the row for display
(same pattern as `Gudang.cabang_code`/`cabang_name`).

`transaksi` scopes which flow the payment type applies to (`pembelian` \|
`penjualan`); `jenis` is the payment mechanism (`tunai` \| `potong_retur` \|
`uang_muka`). Both are fixed picklists, no company-specific customization.

## Entity: `TipePembayaran`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode" |
| `name` | string | required; min 2 — "Nama" |
| `akun_perkiraan_id` | number | required; non-deleted `AkunPerkiraan` in the same company — "Akun Perkiraan" |
| `akun_perkiraan_code` | string | denormalized from `AkunPerkiraan.code`, read-only |
| `akun_perkiraan_name` | string | denormalized from `AkunPerkiraan.name`, read-only |
| `transaksi` | enum | `pembelian` \| `penjualan` — "Transaksi" |
| `jenis` | enum | `tunai` \| `potong_retur` \| `uang_muka` — "Jenis" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/tipe-pembayaran` | [list-tipe-pembayaran](./list-tipe-pembayaran.md) |
| GET | `/tipe-pembayaran/:id` | [get-tipe-pembayaran](./get-tipe-pembayaran.md) |
| POST | `/tipe-pembayaran` | [create-tipe-pembayaran](./create-tipe-pembayaran.md) |
| PUT | `/tipe-pembayaran/:id` | [update-tipe-pembayaran](./update-tipe-pembayaran.md) |
| DELETE | `/tipe-pembayaran/:id` | [delete-tipe-pembayaran](./delete-tipe-pembayaran.md) |
