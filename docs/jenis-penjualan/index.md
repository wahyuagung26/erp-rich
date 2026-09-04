---
type: OKF Module
title: Jenis Penjualan (Master Jenis Penjualan)
description: CRUD for sales-type master data — maps a sales type to its revenue, COGS, inventory, and expense accounts. Soft-delete, company-scoped.
tags: [jenis-penjualan, master-data]
timestamp: 2026-09-05T12:00:00Z
---

# Jenis Penjualan

Master data for sales types (e.g. "Bahan Baku", "Jasa"). Each sales type maps to
four [Akun Perkiraan](../akun-perkiraan/index.md) accounts — revenue, COGS
("HPP"), inventory, and expense ("Biaya") — so a future sales module can
auto-fill journal entries per transaction without the user picking accounts every
time. Consumed by `frontend/src/views/jenis-penjualan/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only. Same immutable-code
contract as [Merk](../merk/index.md) / [Kategori](../kategori/index.md) /
[Satuan](../satuan/index.md) / [Cabang](../cabang/index.md) / [Departemen](../departemen/index.md) /
[Gudang](../gudang/index.md). Unlike those, the four account references
(`akun_pendapatan_id`, `akun_hpp_id`, `akun_persediaan_id`, `akun_biaya_id`) **can**
be changed on update — only `code` is locked.

Each `akun_*_id` must reference a non-deleted `AkunPerkiraan` belonging to the same
active company; its `code`/`name` are denormalized onto the row for display
(same pattern as `Gudang.cabang_code`/`cabang_name`). The UI does not restrict
which account `type` can be picked for which slot (e.g. nothing stops picking an
`expense` account as "Akun Pendapatan") — that validation is left for later if
the sales module needs it.

## Entity: `JenisPenjualan`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Jenis" |
| `name` | string | required; min 2 — "Jenis" |
| `akun_pendapatan_id` | number | required; non-deleted `AkunPerkiraan` in the same company — "Akun Pendapatan" |
| `akun_pendapatan_code` | string | denormalized from `AkunPerkiraan.code`, read-only |
| `akun_pendapatan_name` | string | denormalized from `AkunPerkiraan.name`, read-only |
| `akun_hpp_id` | number | required; non-deleted `AkunPerkiraan` in the same company — "Akun HPP" |
| `akun_hpp_code` | string | denormalized, read-only |
| `akun_hpp_name` | string | denormalized, read-only |
| `akun_persediaan_id` | number | required; non-deleted `AkunPerkiraan` in the same company — "Akun Persediaan" |
| `akun_persediaan_code` | string | denormalized, read-only |
| `akun_persediaan_name` | string | denormalized, read-only |
| `akun_biaya_id` | number | required; non-deleted `AkunPerkiraan` in the same company — "Akun Biaya" |
| `akun_biaya_code` | string | denormalized, read-only |
| `akun_biaya_name` | string | denormalized, read-only |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/jenis-penjualan` | [list-jenis-penjualan](./list-jenis-penjualan.md) |
| GET | `/jenis-penjualan/:id` | [get-jenis-penjualan](./get-jenis-penjualan.md) |
| POST | `/jenis-penjualan` | [create-jenis-penjualan](./create-jenis-penjualan.md) |
| PUT | `/jenis-penjualan/:id` | [update-jenis-penjualan](./update-jenis-penjualan.md) |
| DELETE | `/jenis-penjualan/:id` | [delete-jenis-penjualan](./delete-jenis-penjualan.md) |
