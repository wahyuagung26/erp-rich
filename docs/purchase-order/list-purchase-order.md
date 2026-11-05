---
type: API Endpoint
title: List Purchase Order
description: Paginated, filterable, sortable list of purchase orders.
method: GET
path: /purchase-order
status: mock
tags: [purchase-order, read, list]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-11-06T03:00:00Z
---

# List Purchase Order

Backs `views/purchase-order/pages/PagePurchaseOrderTable.vue` (via the `useTableList`
composable). Rows include resolved supplier, department, warehouse, and product display data.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `q` | string | no | matches number, date, created_by, supplier code/name, warehouse name, address, or description; case-insensitive |
| `approval_status` | string | no | `pending`, `approved`, or `rejected` |
| `delivery_status` | string | no | `not_received`, `partial`, or `full` |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`sort_by` accepts `date`, `number`, `created_by`, `supplier_name`, `warehouse_name`, or
`total` — set via the sortable `Tanggal` / `Total` table headers.

## KPI tiles (`meta.summary`)

| Key | Tile | Filter it sets | Counts rows where |
|---|---|---|---|
| `pending` | Menunggu Persetujuan | `approval_status=pending` | `approval_status = pending` |
| `awaiting_receipt` | Belum Diterima | `approval_status=approved`, `delivery_status=not_received` | approved and nothing received yet |
| `partial` | Diterima Sebagian | `approval_status=approved`, `delivery_status=partial` | approved and partly received |
| `rejected` | Ditolak | `approval_status=rejected` | `approval_status = rejected` |

Every tile carries `count` and `amount` (sum of `total`). See [conventions](../conventions.md#list-kpi-summary-optional-metasummary).

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1,
      "number": "PO-RICH/0001/09/2026",
      "date": "2026-09-08",
      "supplier_code": "SUP001",
      "supplier_name": "Supplier Contoh",
      "department_code": "FAT",
      "department_name": "Finance Accounting & Tax",
      "warehouse_code": "GD1",
      "warehouse_name": "Gudang Pusat",
      "description": "Pembelian kebutuhan operasional",
      "approval_status": "pending",
      "delivery_status": "not_received",
      "total": 7770000
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

- Default UI sorting is date descending.
- Edit and delete actions are shown only when the PO is not approved and has no receipt.
- The transaction number opens [get-purchase-order](./get-purchase-order.md).
