---
type: API Endpoint
title: List Purchase Receipt
description: Paginated, filterable, sortable list of purchase receipts (Penerimaan Pembelian).
method: GET
path: /purchase-receipt
status: mock
tags: [purchase-receipt, read, list]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-09-10T00:00:00Z
---

# List Purchase Receipt

Backs `views/purchase-receipt/pages/PagePurchaseReceiptTable.vue` (via the `useTableList`
composable).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `q` | string | no | matches number, date, warehouse, description, supplier code/name, or SJ supplier; case-insensitive |
| `invoice_status` | string | no | `not_invoiced` or `invoiced` |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`sort_by` accepts `date`, `number`, `warehouse_label`, `description`, `supplier_code`,
`supplier_name`, or `delivery_note_number` — set via the sortable `Tanggal` / `BM #` table
headers.

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1,
      "number": "BM-RICH/0001/09/2026",
      "date": "2026-09-06",
      "purchase_order_number": "PO-RICH/0002/09/2026",
      "delivery_note_number": "SJ-2026-0091",
      "supplier_code": "SUP007",
      "supplier_name": "Supplier PKP Contoh",
      "description": "Penerimaan sebagian produk PO",
      "warehouse_label": "Gudang Pusat",
      "invoice_status": "not_invoiced"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Default UI sorting is date descending.
- The transaction number opens [get-purchase-receipt](./get-purchase-receipt.md).
