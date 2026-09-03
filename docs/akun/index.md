---
type: OKF Module
title: Bagan Akun (Chart of Accounts)
description: CRUD for accounting accounts. Each account has a code, name, type, and normal balance.
tags: [akun, chart-of-accounts]
timestamp: 2026-09-03T00:00:00Z
---

# Bagan Akun

Master data for the chart of accounts. Consumed by `frontend/src/views/akun/`
and referenced by [jurnal](../jurnal/index.md) line items.

## Entity: `Akun`

| Field | Type | Notes |
|---|---|---|
| `id` | string | server-assigned |
| `code` | string | e.g. `1-1000`; unique; digits and dashes |
| `name` | string | min 3 chars |
| `type` | enum | `asset` \| `liability` \| `equity` \| `revenue` \| `expense` |
| `normal_balance` | enum | `debit` \| `credit` |
| `active` | boolean | inactive accounts are hidden from journal pickers |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/akun` | [list-akun](./list-akun.md) |
| GET | `/akun/:id` | [get-akun](./get-akun.md) |
| POST | `/akun` | [create-akun](./create-akun.md) |
| PUT | `/akun/:id` | [update-akun](./update-akun.md) |
| DELETE | `/akun/:id` | [delete-akun](./delete-akun.md) |
