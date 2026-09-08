---
type: OKF Module
title: Uang Muka Supplier
description: Supplier advance (uang muka supplier) — a deposit / titipan given to a supplier, applied against supplier payables (hutang). Read-only usage history computed from the usage rows below.
tags: [supplier-advance, advance, titipan]
timestamp: 2026-09-08T10:00:00Z
---

# Uang Muka Supplier

"Uang Muka Supplier" — money advanced to a supplier (typically against a future
purchase order), consumed over time as supplier payables (hutang) are paid from
it. Consumed by `frontend/src/views/supplier-advance/`. There is **no** approval
workflow on this screen (matches Legacy); the record is ready to use the moment
it is created.

`used` / `remaining` / `last_payable_number` are server-computed from the sum of
the advance's [`SupplierAdvanceUsage`](#entity-supplieradvanceusage) rows — see
the list/usage endpoints below. Usage rows are created by the AP module in
Legacy and are **read-only** in this prototype.

## Entity: `SupplierAdvance`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | server-assigned, e.g. `UMS-RICH/0001/09/2026`; not user-editable |
| `date` | string | `YYYY-MM-DD` |
| `department_id` | number | required |
| `department_code` / `department_name` | string | denormalized, response only |
| `supplier_id` | number | required |
| `supplier_code` / `supplier_name` | string | denormalized, response only |
| `amount` | number | "Nominal"; required, `> 0` |
| `used` | number | "Terpakai" — server-computed from usage rows, read-only |
| `remaining` | number | "Saldo Tersedia" — server-computed = `amount - used` |
| `last_payable_number` | string \| null | "No Hutang Terakhir" — `payable_number` of the latest usage row, read-only |
| `description` | string | "Keterangan"; optional |
| `cash_account_id` | number | "Akun Kas / Bank"; must be a `cash_bank` [`Account`](../account/index.md) |
| `cash_account_code` / `cash_account_name` | string | denormalized, response only |
| `advance_type` | string | "Jenis Uang Muka"; `TITIPAN-PO` |
| `cash_flow` | string \| null | optional cash-flow code from [`CashFlow`](../cash-flow/index.md) |
| `cash_flow_name` | string | denormalized, response only |
| `attachment` | object \| null | one PDF/JPG/JPEG/PNG attachment; max 5 MB; required |

## Entity: `SupplierAdvanceUsage`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `supplier_advance_id` | number | owning [`SupplierAdvance`](#entity-supplieradvance) |
| `date` | string | `YYYY-MM-DD` |
| `payable_number` | string | "No Hutang Supplier" |
| `payment_number` | string | "No Bayar" |
| `note` | string | "Keterangan" |
| `amount` | number | "Nominal Pakai" |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/supplier-advance` | [list-supplier-advance](./list-supplier-advance.md) |
| GET | `/supplier-advance/:id` | [get-supplier-advance](./get-supplier-advance.md) |
| POST | `/supplier-advance` | [create-supplier-advance](./create-supplier-advance.md) |
| PUT | `/supplier-advance/:id` | [update-supplier-advance](./update-supplier-advance.md) |
| DELETE | `/supplier-advance/:id` | [delete-supplier-advance](./delete-supplier-advance.md) |
| GET | `/supplier-advance/:id/usage` | [list-supplier-advance-usage](./list-supplier-advance-usage.md) |
