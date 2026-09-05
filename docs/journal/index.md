---
type: OKF Module
title: Journal
description: Double-entry journal entries. Each entry has balanced debit/credit lines referencing accounts.
tags: [journal, double-entry]
timestamp: 2026-09-05T10:00:00Z
---

# Journal

Consumed by `frontend/src/views/journal/`. Lines reference [account](../account/index.md)
— the account picker in `FormJournalLines.vue` fetches `/account`.

## Entity: `Journal`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | server-assigned, e.g. `JU-2609-001` |
| `date` | string | `YYYY-MM-DD` |
| `description` | string | required |
| `lines` | `JournalLine[]` | ≥ 2; sum(debit) must equal sum(credit) and be > 0 |
| `total` | number | server-computed = sum(debit) |

### `JournalLine`

| Field | Type | Notes |
|---|---|---|
| `account_id` | number | FK to `Account.id` |
| `account_code` | string | denormalized, response only |
| `account_name` | string | denormalized, response only |
| `debit` | number | one of debit/credit is 0 |
| `credit` | number | |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/journal` | [list-journal](./list-journal.md) |
| POST | `/journal` | [create-journal](./create-journal.md) |
