---
type: OKF Module
title: Penerimaan Pembelian (Purchase Receipt)
description: Penerimaan barang terhadap order pembelian yang sudah disetujui, per produk, dengan sisa kuantitas dan gudang per baris.
tags: [purchase-receipt, procurement]
timestamp: 2026-11-06T02:00:00Z
---

# Penerimaan Pembelian

Bukti penerimaan barang ("BM") terhadap satu [purchase-order](../purchase-order/index.md)
yang berstatus `approved`. Consumed by `frontend/src/views/purchase-receipt/` (list,
detail, tambah, edit).

Ported from Legacy `/bmrefpo`. The Legacy-only extra product attribute column and the
`Tautan` tab (link to a purchase-invoice/settlement flow) are **out of scope** — the invoice
flow now lives in [purchase-invoice](../purchase-invoice/index.md); the settlement flow is still out of scope here. Legacy's `Aksi` column
per product row could not be observed rendering (E2E blocked by a missing `user_department`
table); V2 omits it since receipt lines are fixed rows sourced from the PO, not a free
add/remove list.

## Entity: `PurchaseReceipt`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | nomor transaksi otomatis ("BM #"), read-only |
| `purchase_order_id` | number | required; must reference an `approved` purchase order |
| `purchase_order_number` `purchase_order_date` `purchase_order_description` | string | resolved PO reference fields, read-only |
| `supplier_id` | number | resolved from the PO |
| `supplier_code` `supplier_name` | string \| undefined | resolved display fields |
| `delivery_note_number` | string | Surat Jalan Supplier; required, max 30 chars |
| `description` | string | Keterangan; required, max 250 chars |
| `department_id` | number | required; department master |
| `department_code` `department_name` | string \| undefined | resolved display fields |
| `invoice_status` | enum | `not_invoiced`, `invoiced`; read-only here — set by [create-purchase-invoice](../purchase-invoice/create-purchase-invoice.md) and reset by its delete |
| `date` | string | Tanggal Penerimaan; required, `YYYY-MM-DD`, cannot be after today |
| `warehouse_label` | string | display-only summary of the distinct warehouses used by lines with `quantity > 0` |
| `created_by` | string | creator name |
| `lines` | array | at least one line with `quantity > 0` on create/update |

## Entity: `PurchaseReceiptLine`

One row per product line of the referenced PO — the set of lines is fixed by the PO, not
freely added/removed. `ordered_quantity`, `received_quantity`, and `remaining_quantity` are
always computed **excluding the receipt being read/edited itself** (see
[get-purchase-order-receivable-lines](./get-purchase-order-receivable-lines.md)).

| Field | Type | Notes |
|---|---|---|
| `product_id` | number | one of the PO's line products |
| `product_code` `product_name` `brand_code` `brand_name` `unit_name` | string \| undefined | resolved product display fields |
| `ordered_quantity` | number | the PO line's ordered quantity ("Permintaan") |
| `received_quantity` | number | sum already received by other receipts against this PO line ("Sudah Terima") |
| `remaining_quantity` | number | `ordered_quantity - received_quantity`, minimum 0 ("Belum Terima") |
| `quantity` | number | quantity received on **this** receipt ("Jumlah"); `0` if not received here |
| `warehouse_id` | number \| null | required when `quantity > 0` |
| `warehouse_code` `warehouse_name` | string \| undefined | resolved display fields |

## Guardrails

- Creating a receipt requires an `approved` purchase order.
- At least one line must have `quantity > 0`.
- A line's `quantity` cannot exceed its `remaining_quantity`.
- `warehouse_id` is required on a line whenever its `quantity > 0`.
- `date` cannot be after today.
- A receipt whose `invoice_status` is `invoiced` cannot be edited or deleted (a purchase invoice
  now exists for it; deleting that pending invoice releases the receipt again).
- Delete is a hard delete in the mock; it is not a soft-delete.
- The linked purchase order's own `delivery_status` is **not** recomputed by this module —
  it stays whatever the purchase-order mock already stores.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/purchase-receipt` | [list-purchase-receipt](./list-purchase-receipt.md) |
| GET | `/purchase-receipt/:id` | [get-purchase-receipt](./get-purchase-receipt.md) |
| POST | `/purchase-receipt` | [create-purchase-receipt](./create-purchase-receipt.md) |
| PUT | `/purchase-receipt/:id` | [update-purchase-receipt](./update-purchase-receipt.md) |
| DELETE | `/purchase-receipt/:id` | [delete-purchase-receipt](./delete-purchase-receipt.md) |
| GET | `/purchase-order/:id/receivable-lines` | [get-purchase-order-receivable-lines](./get-purchase-order-receivable-lines.md) |
| GET | `/purchase-receipt/:id/history` | [get-purchase-receipt-history](./get-purchase-receipt-history.md) |
