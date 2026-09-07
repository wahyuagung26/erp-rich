---
type: OKF Module
title: Journal
description: Manual double-entry journal entries with approval workflow and balanced debit/credit lines.
tags: [journal, double-entry]
timestamp: 2026-09-07T14:00:00Z
---

# Journal

Consumed by `frontend/src/views/journal/`. Lines reference [account](../account/index.md)
— the account picker in `FormJournalLines.vue` fetches `/account`.

## Entity: `Journal`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | optional input; server-assigned when blank, e.g. `JU-2609-001` |
| `date` | string | `YYYY-MM-DD` |
| `voucher` | string | free-text voucher/reference; required |
| `description` | string | required |
| `attachment` | object \| null | one PDF/JPG/PNG attachment; max 5 MB |
| `status` | enum | `submitted`, `approved`, or `rejected` |
| `rejection_reason` | string \| null | set when a submitted journal is rejected |
| `approved_by` | string \| null | approver's name; set on approve, cleared on re-submit |
| `approved_at` | string \| null | ISO 8601 datetime of approval; set/cleared alongside `approved_by` |
| `lines` | `JournalLine[]` | ≥ 1; sum(debit) must equal sum(credit) and be > 0 |
| `total` | number | server-computed = sum(debit) |

### `JournalLine`

| Field | Type | Notes |
|---|---|---|
| `account_id` | number | FK to `Account.id` |
| `account_code` | string | denormalized, response only |
| `account_name` | string | denormalized, response only |
| `account_type` | enum | response-only account classification |
| `department_id` | number \| null | optional department reference |
| `department_code` / `department_name` | string | denormalized, response only |
| `cash_flow` | string \| null | cash-flow code from [`CashFlow`](../cash-flow/index.md); required for `cash_bank` accounts |
| `cash_flow_name` | string | denormalized, response only |
| `detail_description` | string | optional line description |
| `debit` | number | one of debit/credit is 0 |
| `credit` | number | |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/journal` | [list-journal](./list-journal.md) |
| GET | `/journal/:id` | [get-journal](./get-journal.md) |
| POST | `/journal` | [create-journal](./create-journal.md) |
| PUT | `/journal/:id` | [update-journal](./update-journal.md) |
| DELETE | `/journal/:id` | [delete-journal](./delete-journal.md) |
| PATCH | `/journal/:id/status` | [update-journal-status](./update-journal-status.md) |
