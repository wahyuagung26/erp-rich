---
type: OKF Module
title: Jurnal Umum (General Journal)
description: Double-entry journal entries. Each entry has balanced debit/credit lines referencing accounts.
tags: [jurnal, journal, double-entry]
timestamp: 2026-09-03T00:00:00Z
---

# Jurnal Umum

Consumed by `frontend/src/views/jurnal/`. Lines reference [akun](../akun/index.md).

## Entity: `Jurnal`

| Field | Type | Notes |
|---|---|---|
| `id` | string | server-assigned |
| `number` | string | server-assigned, e.g. `JU-2609-001` |
| `date` | string | `YYYY-MM-DD` |
| `description` | string | required |
| `lines` | `JurnalLine[]` | ≥ 2; sum(debit) must equal sum(credit) and be > 0 |
| `total` | number | server-computed = sum(debit) |

### `JurnalLine`

| Field | Type | Notes |
|---|---|---|
| `akun_id` | string | FK to `Akun.id` |
| `akun_code` | string | denormalized, response only |
| `akun_name` | string | denormalized, response only |
| `debit` | number | one of debit/credit is 0 |
| `credit` | number | |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/jurnal` | [list-jurnal](./list-jurnal.md) |
| POST | `/jurnal` | [create-jurnal](./create-jurnal.md) |
