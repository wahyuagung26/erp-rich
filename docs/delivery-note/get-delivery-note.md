---
type: API Endpoint
title: Get Delivery Note
description: One surat jalan with resolved invoice / customer / product fields and per-line invoice quantity.
method: GET
path: /delivery-note/:id
status: mock
tags: [delivery-note, read]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-13T12:00:00Z
---

# Get Delivery Note

Backs `PageDeliveryNoteDetail.vue`, `PageDeliveryNoteEdit.vue` (loads the form) and `PageDeliveryNotePrint.vue` (A4 portrait, prints only lines with `quantity > 0`, no prices).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `DeliveryNote.id` |

## Response

`200`: `{ "data": { ...DeliveryNote } }` — see [Entity](./index.md#entity-deliverynote). There is no `locked` field (surat jalan is not closing-locked).

```json
{
  "data": {
    "id": 1,
    "number": "SJ-RIN.INV260920/001",
    "date": "2026-09-21",
    "sales_invoice_id": 1,
    "sales_invoice_number": "RIN.INV260920/001",
    "sales_invoice_date": "2026-09-20",
    "customer_id": 4,
    "customer_code": "CUST-0004",
    "customer_name": "PT Cahaya Nusantara",
    "department_code": "FAT",
    "department_name": "Finance & Accounting",
    "delivery_address": "Jl. Rungkut Industri III No. 7, Surabaya",
    "recipient": "Pak Hendra (gudang)",
    "driver": "Sutrisno",
    "vehicle": "L 8123 XY",
    "description": "Pengiriman tahap pertama, sisa 1 unit menyusul",
    "created_by": "Admin",
    "total_quantity": 3,
    "lines": [
      { "variant_id": 1, "product_id": 1, "product_code": "PRD001", "sku": "PRD001", "variant_label": "Standar", "product_name": "Produk Contoh", "brand_name": "Merk Contoh", "unit_name": "Pieces", "invoice_quantity": 4, "quantity": 3 }
    ]
  }
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Surat jalan tidak ditemukan" }` |
