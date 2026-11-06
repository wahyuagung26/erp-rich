---
type: API Endpoint
title: List Delivery Note
description: Paginated, filterable, sortable list of surat jalan.
method: GET
path: /delivery-note
status: mock
tags: [delivery-note, read, list]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-06T20:00:00Z
---

# List Delivery Note

Backs `views/delivery-note/pages/PageDeliveryNoteTable.vue` (via `useTableList`). No KPI tiles: a surat jalan has no status.
Also called by `PageSalesInvoiceDetail.vue` with `sales_invoice_id=<id>&per_page=1` to show **Buat / Lihat Surat Jalan** on an approved invoice.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `q` | string | no | matches number, invoice number, customer code/name, address, recipient, driver, vehicle, description; case-insensitive |
| `sales_invoice_id` | number | no | only the surat jalan of that invoice (0 or 1 row); the list page applies it from `?sales_invoice_id=` |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`sort_by` accepts `date`, `number`, `customer_name`, `recipient`, `driver`, `total_quantity`; the UI exposes `Tanggal` and `Nomor`.

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1,
      "number": "SJ-RIN.INV260920/001",
      "date": "2026-09-21",
      "sales_invoice_id": 1,
      "sales_invoice_number": "RIN.INV260920/001",
      "customer_code": "CUST-0004",
      "customer_name": "PT Cahaya Nusantara",
      "delivery_address": "Jl. Rungkut Industri III No. 7, Surabaya",
      "recipient": "Pak Hendra (gudang)",
      "driver": "Sutrisno",
      "vehicle": "L 8123 XY",
      "description": "Pengiriman tahap pertama, sisa 1 unit menyusul",
      "total_quantity": 3
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 3, "last_page": 1 }
}
```

Rows are the full [DeliveryNote](./index.md#entity-deliverynote) (with `lines`).

## Errors

Standard only (`401`).

## Notes

- Default UI sorting is date descending. The nomor opens [get-delivery-note](./get-delivery-note.md).
