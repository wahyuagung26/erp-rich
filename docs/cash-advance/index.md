---
type: OKF Module
title: Cash Advance
description: Operational cash advance (uang muka operasional) — an amount handed to a recipient against a department, tracked to settlement, with the same approval workflow as Journal.
tags: [cash-advance, advance, approval, settlement]
timestamp: 2026-09-08T12:00:00Z
---

# Cash Advance

"Uang Muka Operasional" — money advanced to an employee/recipient for operational
spending, settled over time as expense reports are applied against it. Consumed by
`frontend/src/views/cash-advance/`. Shares the `submitted` / `approved` / `rejected`
approval workflow with [journal](../journal/index.md) / [journal-expense](../journal-expense/index.md)
(`status` / `rejection_reason` / `approved_by` / `approved_at`, `PATCH .../status`).

`used`/`remaining` are server-computed from the sum of the advance's
[`CashAdvanceSettlement`](#entity-cashadvancesettlement) rows — see the settlement
endpoints below. A settlement can only be added/edited/deleted while the parent
advance's `status` is `approved`.

## Entity: `CashAdvance`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | server-assigned, e.g. `UM-2609-001`; not user-editable |
| `date` | string | `YYYY-MM-DD` |
| `department_id` | number | required |
| `department_code` / `department_name` | string | denormalized, response only |
| `recipient` | string | "Penerima" — free-text name; required |
| `description` | string | "Keterangan"; optional |
| `amount` | number | "Nilai"; required, > 0 |
| `used` | number | "Terpakai" — server-computed, read-only; `0` until a settlement flow exists |
| `remaining` | number | "Sisa" — server-computed = `amount - used` |
| `cash_account_id` | number | "Akun Kas / Bank"; must be a `cash_bank` [`Account`](../account/index.md) |
| `cash_account_code` / `cash_account_name` | string | denormalized, response only |
| `advance_account_id` | number | "Akun Uang Muka"; must be an `asset` [`Account`](../account/index.md) |
| `advance_account_code` / `advance_account_name` | string | denormalized, response only |
| `cash_flow` | string \| null | optional cash-flow code from [`CashFlow`](../cash-flow/index.md) |
| `cash_flow_name` | string | denormalized, response only |
| `attachment` | object \| null | one PDF/JPG/JPEG/PNG attachment; max 5 MB; required |
| `status` | enum | `submitted`, `approved`, or `rejected` |
| `rejection_reason` | string \| null | set when a submitted advance is rejected |
| `approved_by` | string \| null | approver's name; set on approve, cleared on re-submit |
| `approved_at` | string \| null | ISO 8601 datetime of approval; set/cleared alongside `approved_by` |

## Entity: `CashAdvanceSettlement`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `cash_advance_id` | number | owning [`CashAdvance`](#entity-cashadvance) |
| `number` | string | server-assigned, e.g. `PU-2609-001`; not user-editable |
| `date` | string | `YYYY-MM-DD` |
| `amount` | number | "Nilai"; required, `> 0`, and `<=` the advance's remaining at the time |
| `remaining_after` | number | "Sisa Setelah" — response-only, computed = advance `amount` minus the running sum of settlements up to and including this one, ordered by `date` then `id` |
| `attachment` | object \| null | one PDF/JPG/JPEG/PNG attachment; max 5 MB; required |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/cash-advance` | [list-cash-advance](./list-cash-advance.md) |
| GET | `/cash-advance/:id` | [get-cash-advance](./get-cash-advance.md) |
| POST | `/cash-advance` | [create-cash-advance](./create-cash-advance.md) |
| PUT | `/cash-advance/:id` | [update-cash-advance](./update-cash-advance.md) |
| DELETE | `/cash-advance/:id` | [delete-cash-advance](./delete-cash-advance.md) |
| PATCH | `/cash-advance/:id/status` | [update-cash-advance-status](./update-cash-advance-status.md) |
| GET | `/cash-advance/:id/settlement` | [list-cash-advance-settlement](./list-cash-advance-settlement.md) |
| POST | `/cash-advance/:id/settlement` | [create-cash-advance-settlement](./create-cash-advance-settlement.md) |
| PUT | `/cash-advance/:id/settlement/:settlementId` | [update-cash-advance-settlement](./update-cash-advance-settlement.md) |
| DELETE | `/cash-advance/:id/settlement/:settlementId` | [delete-cash-advance-settlement](./delete-cash-advance-settlement.md) |
