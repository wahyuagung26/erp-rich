---
type: OKF Module
title: Purchase Order (Order Pembelian)
description: Purchase order dengan supplier, gudang, departemen, detail produk, kalkulasi pajak, approval, delivery status, dan lock.
tags: [purchase-order, procurement]
timestamp: 2026-09-09T00:00:00Z
---

# Purchase Order

Order pembelian dengan data mock V2. Consumed by
`frontend/src/views/purchase-order/` (list, detail, tambah, edit).

`PurchaseOrder` memiliki status persetujuan, status barang, dan status lock yang terpisah.
Field DPP, PPN, Nett, dan Total dihitung dari baris produk; field tersebut bukan input
client. `pkp_active` dipilih pada level transaksi dan menentukan apakah PPN menggunakan
11% dari DPP atau 0.

## Entity: `PurchaseOrder`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | nomor transaksi otomatis, read-only |
| `date` | string | required; format `YYYY-MM-DD` |
| `supplier_id` | number | required; supplier master |
| `supplier_code` `supplier_name` | string \| undefined | resolved display fields |
| `pkp_active` | boolean | required; `true` applies 11% PPN, `false` applies 0 PPN |
| `department_id` | number | required; default UI department is `FAT` |
| `department_code` `department_name` | string \| undefined | resolved display fields |
| `warehouse_id` | number | required; warehouse master |
| `warehouse_code` `warehouse_name` | string \| undefined | resolved display fields |
| `purchase_type` | string \| null | UI options: `E-Money`, `Other`, `PVC`; mock accepts string or null |
| `address` | string | required |
| `description` | string | required |
| `approval_status` | enum | `pending`, `approved`, `rejected` |
| `delivery_status` | enum | `not_received`, `partial`, `full` |
| `is_locked` | boolean | explicit transaction lock |
| `lock_reason` | string \| null | populated when locked |
| `rejection_reason` | string \| null | populated when rejected |
| `approved_by` `approved_at` | string \| null | approval metadata |
| `created_by` | string | creator name |
| `lines` | array | at least one line on create/update |
| `dpp` `ppn` `nett` `total` | number | server/mock-computed values |

## Entity: `PurchaseOrderLine`

| Field | Type | Notes |
|---|---|---|
| `product_id` | number | required; active product |
| `product_code` `product_name` | string \| undefined | resolved product display fields |
| `brand_name` `unit_name` | string \| undefined | resolved product display fields |
| `quantity` | number | greater than 0 |
| `price` | number | greater than 0 |
| `discount` | number | at least 0; cannot exceed gross amount |
| `dpp` | number | `round(quantity × price) - discount`, minimum 0 |
| `ppn` | number | `round(dpp × 11%)` when `pkp_active`, otherwise 0 |
| `total` | number | `dpp + ppn` |

## Status and guardrails

- New PO is created with `approval_status: pending`, `delivery_status: not_received`, and `is_locked: false`.
- A pending PO can be approved or rejected through the detail actions.
- A rejected PO can be resubmitted as pending through the detail action.
- Approved, locked, or received PO cannot be edited or deleted.
- A PO can be locked only after approval.
- An approved PO cannot have its approval changed to another status by the mock.
- Delete is a hard delete in the mock; it is not a soft-delete.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/purchase-order` | [list-purchase-order](./list-purchase-order.md) |
| GET | `/purchase-order/:id` | [get-purchase-order](./get-purchase-order.md) |
| POST | `/purchase-order` | [create-purchase-order](./create-purchase-order.md) |
| PUT | `/purchase-order/:id` | [update-purchase-order](./update-purchase-order.md) |
| DELETE | `/purchase-order/:id` | [delete-purchase-order](./delete-purchase-order.md) |
| PATCH | `/purchase-order/:id/approval` | [update-purchase-order-status](./update-purchase-order-status.md) |
| PATCH | `/purchase-order/:id/lock` | [update-purchase-order-lock](./update-purchase-order-lock.md) |
