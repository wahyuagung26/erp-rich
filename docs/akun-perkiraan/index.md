---
type: OKF Module
title: Akun Perkiraan (Master Akun Perkiraan)
description: CRUD for detail-account master data under a Sub Akun — server-composed code, name, account type. Soft-delete, company-scoped.
tags: [akun-perkiraan, master-data, akuntansi]
timestamp: 2026-09-05T11:00:00Z
---

# Akun Perkiraan

Master data for detail accounts, under the "Akuntansi" menu, the third and last
tier of the chart-of-accounts hierarchy: [Group Akun](../group-akun/index.md) (2
digits) → [Sub Akun](../sub-akun/index.md) (5 digits) → **Akun Perkiraan** (7
digits). Each row belongs to one Sub Akun within the same company. Consumed by
`frontend/src/views/akun-perkiraan/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

## Code composition

`code` is **server-composed**, not sent whole by the client:

- The first 5 digits are the owning `SubAkun.code` (already exactly 5 digits,
  used as-is — no padding needed).
- The last 2 digits are `code_suffix`, entered by the user (exactly 2 digits,
  `^\d{2}$`) — the UI only asks for these, since the prefix is implied by the
  chosen sub akun.
- The resulting `code` is always exactly 7 numeric characters.

Both `sub_akun_id` and the resulting `code` are **immutable after create** — the
edit form disables the sub akun picker and shows the full code disabled (same
convention as [Sub Akun](../sub-akun/index.md#code-composition), one tier up).

`sub_akun_code`/`sub_akun_name` are denormalized onto every read for display,
resolved fresh from the Sub Akun store on create (same pattern as
`SubAkun.group_akun_code`/`group_akun_name`).

`type` (`frontend/src/views/akun-perkiraan/schema.ts`'s `AKUN_TYPES`): `cash_bank` \|
`asset` \| `liability` \| `equity` \| `revenue` \| `expense`. This is also the account picker
Jurnal Umum's `FormJurnalLines.vue` fetches from `/akun-perkiraan` — Jurnal no
longer has its own separate account list.

## Entity: `AkunPerkiraan`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `sub_akun_id` | number | required; must be a non-deleted `SubAkun` in the same company; **immutable after create** — "Sub Akun" |
| `sub_akun_code` | string | denormalized from `SubAkun.code`, read-only |
| `sub_akun_name` | string | denormalized from `SubAkun.name`, read-only |
| `code` | string | server-composed (`sub_akun_code` + 2-digit suffix), exactly 7 numeric digits; **immutable after create** — "Kode Akun Perkiraan" |
| `name` | string | required; min 2 — "Nama Akun Perkiraan" |
| `type` | enum | `cash_bank` \| `asset` \| `liability` \| `equity` \| `revenue` \| `expense` — "Tipe Akun" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/akun-perkiraan` | [list-akun-perkiraan](./list-akun-perkiraan.md) |
| GET | `/akun-perkiraan/:id` | [get-akun-perkiraan](./get-akun-perkiraan.md) |
| POST | `/akun-perkiraan` | [create-akun-perkiraan](./create-akun-perkiraan.md) |
| PUT | `/akun-perkiraan/:id` | [update-akun-perkiraan](./update-akun-perkiraan.md) |
| DELETE | `/akun-perkiraan/:id` | [delete-akun-perkiraan](./delete-akun-perkiraan.md) |
