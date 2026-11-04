---
type: OKF Module
title: Bank Account (Master Rekening Bank)
description: CRUD for bank-account master data — bank code + bank name + account number + holder + posting account + notes. Soft-delete, company-scoped.
tags: [bank-account, master-data]
timestamp: 2026-11-04T15:00:00Z
---

# Bank Account

Master data for the company's bank accounts ("Rekening Bank"). Each row maps to one
[Account](../account/index.md) it posts to ("Akun Perkiraan"). Consumed by `frontend/src/views/bank-account/`
(list = "Daftar Rekening Bank", form = "Detail Rekening Bank"). Company-scoped — see
[conventions](../conventions.md#company-scoping).

Unlike [Warehouse](../warehouse/index.md) / [PaymentType](../payment-type/index.md) there is no user-entered
`code`: the identity is the server-assigned `id`, and `bank_code` ("Kode Bank", e.g. `CIMB`) is a plain,
editable, **non-unique** label — one bank can have several accounts. Every field can change on update.

`account_id` must reference a non-deleted `Account` belonging to the same active company; its `code`/`name`
are denormalized onto the row for display (same pattern as `PaymentType.account_code`/`account_name`). The UI
only offers `cash_bank` accounts; the backend does not enforce the account `type`.

The legacy system locked a bank account (`BnLock`) instead of deleting it. This rewrite follows the module
convention instead: soft-delete via `deleted_at`, no lock.

## Entity: `BankAccount`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `bank_code` | string | required; max 12 — "Kode Bank" |
| `bank_name` | string | required; max 50 — "Nama Bank" |
| `account_number` | string | required; max 50 — "Rekening" |
| `account_holder` | string | optional; max 100 — "Atas Nama" |
| `account_id` | number | required; non-deleted `Account` in the same company — "Akun Perkiraan" |
| `account_code` | string | denormalized from `Account.code`, read-only |
| `account_name` | string | denormalized from `Account.name`, read-only |
| `notes` | string | required; max 100 — "Keterangan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/bank-account` | [list-bank-account](./list-bank-account.md) |
| GET | `/bank-account/:id` | [get-bank-account](./get-bank-account.md) |
| POST | `/bank-account` | [create-bank-account](./create-bank-account.md) |
| PUT | `/bank-account/:id` | [update-bank-account](./update-bank-account.md) |
| DELETE | `/bank-account/:id` | [delete-bank-account](./delete-bank-account.md) |
