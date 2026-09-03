---
type: OKF Module
title: Supplier (Master Vendor)
description: CRUD for supplier / vendor master data. Soft-delete — rows are marked deleted, never removed.
tags: [supplier, master-data]
timestamp: 2026-09-03T13:30:00Z
---

# Supplier

Master data for suppliers / vendors. Consumed by `frontend/src/views/supplier/`
(list, detail, tambah, edit) and (later) referenced by pembelian / retur pembelian
line items.

## Entity: `Supplier`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `code` | string | server-assigned, e.g. `SUP-0001`; read-only in the form |
| `name` | string | required; min 3 |
| `address` | string | required |
| `city` | string | optional |
| `phone` | string | required |
| `fax` | string | optional |
| `email` | string | optional; valid email when filled |
| `contact_person` | string | optional; the "CP" field in the legacy screen |
| `npwp` | string | required; tax number |
| `pkp` | boolean | "Status Pajak" checkbox — supplier is a PKP |
| `bank_name` | string | optional |
| `bank_account` | string | optional |
| `top_days` | number | required; term of payment in days (`0` = tunai / COD) |
| `notes` | string | optional; "Keterangan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/supplier` | [list-supplier](./list-supplier.md) |
| GET | `/supplier/:id` | [get-supplier](./get-supplier.md) |
| POST | `/supplier` | [create-supplier](./create-supplier.md) |
| PUT | `/supplier/:id` | [update-supplier](./update-supplier.md) |
| DELETE | `/supplier/:id` | [delete-supplier](./delete-supplier.md) |
