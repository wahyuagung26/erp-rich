---
type: OKF Module
title: Sub Akun (Master Sub Akun)
description: CRUD for sub-account master data under a Group Akun — server-composed code, name, normal balance. Soft-delete, company-scoped.
tags: [sub-akun, master-data, akuntansi]
timestamp: 2026-09-05T10:00:00Z
---

# Sub Akun

Master data for sub-accounts, under the "Akuntansi" menu, each belonging to one
[Group Akun](../group-akun/index.md) within the same company. Consumed by
`frontend/src/views/sub-akun/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

## Code composition

`code` is **server-composed**, not sent whole by the client:

- The first 2 digits are the owning `GroupAkun.code`, zero-padded to 2 (e.g. group
  code `5` → prefix `05`; group code `10` → prefix `10`).
- The last 3 digits are `code_suffix`, entered by the user (exactly 3 digits,
  `^\d{3}$`) — the UI only asks for these, since the prefix is implied by the
  chosen group.
- The resulting `code` is always exactly 5 numeric characters, satisfying the
  "max 5 karakter numeric" rule.

Both `group_akun_id` and the resulting `code` are **immutable after create** — the
edit form disables the group picker and shows the full code disabled (same
immutable-identifier convention as [Merk](../merk/index.md) / [Kategori](../kategori/index.md) /
[Satuan](../satuan/index.md) / [Cabang](../cabang/index.md) / [Departemen](../departemen/index.md) /
[Gudang](../gudang/index.md) / [Group Akun](../group-akun/index.md), extended here to the group
reference too since it determines the code prefix).

`group_akun_code`/`group_akun_name` are denormalized onto every read for display,
resolved fresh from the Group Akun store on create (same pattern as
`Gudang.cabang_code`/`cabang_name`).

## Entity: `SubAkun`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `group_akun_id` | number | required; must be a non-deleted `GroupAkun` in the same company; **immutable after create** — "Group Perkiraan" |
| `group_akun_code` | string | denormalized from `GroupAkun.code`, read-only |
| `group_akun_name` | string | denormalized from `GroupAkun.name`, read-only |
| `code` | string | server-composed (`group_akun_code` zero-padded to 2 + 3-digit suffix), exactly 5 numeric digits; **immutable after create** — "Kode Sub Akun" |
| `name` | string | required; min 2 — "Nama Sub Akun" |
| `normal_balance` | enum | `debit` \| `credit` — "Saldo Normal" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sub-akun` | [list-sub-akun](./list-sub-akun.md) |
| GET | `/sub-akun/:id` | [get-sub-akun](./get-sub-akun.md) |
| POST | `/sub-akun` | [create-sub-akun](./create-sub-akun.md) |
| PUT | `/sub-akun/:id` | [update-sub-akun](./update-sub-akun.md) |
| DELETE | `/sub-akun/:id` | [delete-sub-akun](./delete-sub-akun.md) |
