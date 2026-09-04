---
type: OKF Module
title: Group Akun (Master Group Akun)
description: CRUD for account group master data — code + name + Neraca/Laba Rugi category + normal balance. Soft-delete, company-scoped.
tags: [group-akun, master-data, akuntansi]
timestamp: 2026-09-05T09:00:00Z
---

# Group Akun

Master data for account groups, under the "Akuntansi" menu. Classifies which
financial statement an account group rolls up into (`category`: Neraca / Laba
Rugi) and its normal balance side (`normal_balance`: Debit / Kredit — same field
and values as [`SubAkun.normal_balance`](../sub-akun/index.md)). Consumed by
`frontend/src/views/group-akun/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` is numeric, 1-2 digits (`^\d{1,2}$`, e.g. `10`, `60`). `code` uniqueness is
checked within the active company only — two companies may each have their own `10`
code. Same contract as [Merk](../merk/index.md) / [Kategori](../kategori/index.md) /
[Satuan](../satuan/index.md) / [Cabang](../cabang/index.md) / [Departemen](../departemen/index.md) /
[Gudang](../gudang/index.md), with the added numeric-code constraint.

## Entity: `GroupAkun`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered; numeric, max 2 digits (`^\d{1,2}$`); unique within the company across non-deleted rows; **immutable after create** — "Kode Group Akun" |
| `name` | string | required; min 2 — "Nama Group Akun" |
| `category` | enum | `neraca` \| `laba_rugi` — "Neraca / Laba Rugi" |
| `normal_balance` | enum | `debit` \| `credit` — "Saldo Normal" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/group-akun` | [list-group-akun](./list-group-akun.md) |
| GET | `/group-akun/:id` | [get-group-akun](./get-group-akun.md) |
| POST | `/group-akun` | [create-group-akun](./create-group-akun.md) |
| PUT | `/group-akun/:id` | [update-group-akun](./update-group-akun.md) |
| DELETE | `/group-akun/:id` | [delete-group-akun](./delete-group-akun.md) |
