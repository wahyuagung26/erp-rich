---
type: API Endpoint
title: List Purchase Invoice
description: Paginated, filterable, sortable list of purchase invoices.
method: GET
path: /purchase-invoice
status: mock
tags: [purchase-invoice, read, list]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-06T03:00:00Z
---

# List Purchase Invoice

Backs `views/purchase-invoice/pages/PagePurchaseInvoiceTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `q` | string | no | matches number, supplier invoice number, receipt number, PO number, supplier code/name, or description; case-insensitive |
| `approval_status` | string | no | `pending` or `approved` |
| `tax_invoice` | string | no | `missing` = PKP invoice without a faktur pajak; `filled` = invoice that has one |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`sort_by` accepts `date`, `number`, `supplier_name`, or `total`; the UI exposes `Tanggal`
and `Total` as sortable headers. Default UI sort is date descending.

## KPI tiles (`meta.summary`)

| Key | Tile | Filter it sets | Counts rows where | Carries |
|---|---|---|---|---|
| `pending` | Menunggu Persetujuan | `approval_status=pending` | `approval_status = pending` | `count`, `amount` (sum of `total`) |
| `tax_missing` | Belum Ada Faktur Pajak | `tax_invoice=missing` | PKP and no faktur pajak yet | `count` |
| `approved` | Disetujui | `approval_status=approved` | `approval_status = approved` | `count`, `amount` |

See [conventions](../conventions.md#list-kpi-summary-optional-metasummary).

## Response

`200`:

```json
{
  "data": [
    {
    "id": 1,
    "number": "BL-RICH/0001/09/2026",
    "date": "2026-09-08",
    "purchase_receipt_id": 1,
    "purchase_receipt_number": "BM-RICH/0001/09/2026",
    "purchase_order_id": 2,
    "purchase_order_number": "PO-RICH/0002/09/2026",
    "supplier_id": 7,
    "supplier_code": "RC00001",
    "supplier_name": "PT Rahadhyan Integrasi Nusantara",
    "department_id": 10,
    "department_code": "PRD",
    "department_name": "Produksi",
    "supplier_invoice_number": "INV-SUP-2026-001",
    "description": "Tagihan penerimaan sebagian PO",
    "pkp_active": true,
    "approval_status": "pending",
    "approved_by": null,
    "approved_at": null,
    "kontrabon_number": null,
    "tax_invoice": null,
    "created_by": "Admin",
    "lines": [
      {
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Kulkas 2 Pintu",
        "brand_name": "Samsung",
        "unit_name": "Pieces",
        "quantity": 40,
        "price": 375000,
        "dpp": 15000000,
        "ppn": 1650000,
        "total": 16650000
      }
    ],
    "dpp": 15000000,
    "ppn": 1650000,
    "total": 16650000
  }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 1, "last_page": 1 }
}
```

## Errors

Standard only (`401`).
