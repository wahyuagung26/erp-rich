---
type: OKF Module
title: Account (Master Account)
description: CRUD for detail-account master data under a Sub Account — server-composed code, name, account type. Soft-delete, company-scoped.
tags: [account, master-data, akuntansi]
timestamp: 2026-09-05T11:00:00Z
---

# Account

Master data for detail accounts, under the "Akuntansi" menu, the third and last
tier of the chart-of-accounts hierarchy: [AccountGroup](../account-group/index.md) (2
digits) → [SubAccount](../sub-account/index.md) (5 digits) → **Account** (7
digits). Each row belongs to one SubAccount within the same company. Consumed by
`frontend/src/views/account/`. Company-scoped — see
[conventions](../conventions.md#company-scoping).

## Code composition

`code` is **server-composed**, not sent whole by the client:

- The first 5 digits are the owning `SubAccount.code` (already exactly 5 digits,
  used as-is — no padding needed).
- The last 2 digits are `code_suffix`, entered by the user (exactly 2 digits,
  `^\d{2}$`) — the UI only asks for these, since the prefix is implied by the
  chosen sub account.
- The resulting `code` is always exactly 7 numeric characters.

Both `sub_account_id` and the resulting `code` are **immutable after create** — the
edit form disables the sub account picker and shows the full code disabled (same
convention as [SubAccount](../sub-account/index.md#code-composition), one tier up).

`sub_account_code`/`sub_account_name` are denormalized onto every read for display,
resolved fresh from the SubAccount store on create (same pattern as
`SubAccount.account_group_code`/`account_group_name`).

`type` (`frontend/src/views/account/schema.ts`'s `AKUN_TYPES`): `cash_bank` \|
`asset` \| `liability` \| `equity` \| `revenue` \| `expense`. This is also the account picker
Journal's `FormJournalLines.vue` fetches from `/account` — Journal no
longer has its own separate account list.

## Entity: `Account`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `sub_account_id` | number | required; must be a non-deleted `SubAccount` in the same company; **immutable after create** — "Sub Akun" |
| `sub_account_code` | string | denormalized from `SubAccount.code`, read-only |
| `sub_account_name` | string | denormalized from `SubAccount.name`, read-only |
| `code` | string | server-composed (`sub_account_code` + 2-digit suffix), exactly 7 numeric digits; **immutable after create** — "Kode Akun Perkiraan" |
| `name` | string | required; min 2 — "Nama Akun Perkiraan" |
| `type` | enum | `cash_bank` \| `asset` \| `liability` \| `equity` \| `revenue` \| `expense` — "Tipe Akun" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/account` | [list-account](./list-account.md) |
| GET | `/account/:id` | [get-account](./get-account.md) |
| POST | `/account` | [create-account](./create-account.md) |
| PUT | `/account/:id` | [update-account](./update-account.md) |
| DELETE | `/account/:id` | [delete-account](./delete-account.md) |
