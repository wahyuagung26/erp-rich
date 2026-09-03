---
type: OKF Module
title: Customer (Master Pelanggan)
description: CRUD for customer master data. Soft-delete — rows are marked deleted, never removed.
tags: [customer, master-data]
timestamp: 2026-09-03T15:00:00Z
---

# Customer

Master data for customers / pelanggan. Consumed by `frontend/src/views/customer/`
(list, detail, tambah, edit) and (later) referenced by penjualan / retur penjualan
line items.

## Entity: `Customer`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `code` | string | server-assigned, e.g. `CUST-0001`; read-only in the form |
| `name` | string | required; min 3 |
| `phone` | string | optional; "No. Telp" in the legacy screen |
| `email` | string | optional; valid email when filled |
| `address` | string | optional |
| `city` | string | optional |
| `bank_name` | string | optional; "Bank" in the legacy screen |
| `bank_account` | string | optional |
| `npwp` | string | optional; tax number |
| `pkp` | boolean | "Status PKP" checkbox — customer is a PKP |
| `top_days` | number | required; term of payment in days (`0` = tunai) — piutang jatuh tempo |
| `notes` | string | optional; "Keterangan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/customer` | [list-customer](./list-customer.md) |
| GET | `/customer/:id` | [get-customer](./get-customer.md) |
| POST | `/customer` | [create-customer](./create-customer.md) |
| PUT | `/customer/:id` | [update-customer](./update-customer.md) |
| DELETE | `/customer/:id` | [delete-customer](./delete-customer.md) |
