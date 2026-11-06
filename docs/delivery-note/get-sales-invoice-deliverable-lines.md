---
type: API Endpoint
title: Get Sales Invoice Deliverable Lines
description: Lookup used by the create-surat-jalan form — an approved invoice's header context plus every product line prefilled to ship in full.
method: GET
path: /sales-invoice/:id/deliverable-lines
status: mock
tags: [delivery-note, read, lookup]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-06T17:00:00Z
---

# Get Sales Invoice Deliverable Lines

Backs `views/delivery-note/composables/useDeliveryNoteInvoice.ts`, fired from `FormDeliveryNote.vue` when the user picks an invoice on a **new**
surat jalan (or arrives with `?sales_invoice_id=`). `sales_invoice_id` cannot change once a surat jalan exists, so the edit form never calls it — it loads
its lines from [get-delivery-note](./get-delivery-note.md). Modelled on
[get-purchase-order-receivable-lines](../purchase-receipt/get-purchase-order-receivable-lines.md); the endpoint is owned by this module although it hangs under `/sales-invoice`.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `SalesInvoice.id` |

## Response

`200`:

```json
{
  "data": {
    "sales_invoice": {
      "id": 6,
      "number": "RIN.INV260820/001",
      "date": "2026-08-20",
      "customer_id": 2,
      "customer_code": "CUST-0002",
      "customer_name": "Toko Sumber Rejeki",
      "customer_address": "Jl. Diponegoro No. 45",
      "department_code": "FAT",
      "department_name": "Finance & Accounting"
    },
    "lines": [
      { "product_id": 1, "product_code": "PRD001", "product_name": "Produk Contoh", "brand_name": "Merk Contoh", "unit_name": "Pieces", "invoice_quantity": 2, "quantity": 2 }
    ]
  }
}
```

Every line starts with `quantity = invoice_quantity`; the user lowers it for a partial shipment (or to `0` to leave a product off).
`customer_address` seeds `delivery_address`.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
| `422` | invoice is not `approved` | `{ "message": "Invoice belum disetujui" }` |
| `422` | invoice already has a surat jalan | `{ "message": "Invoice ini sudah memiliki surat jalan <nomor>" }` |
