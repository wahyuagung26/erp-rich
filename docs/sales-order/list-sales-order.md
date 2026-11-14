---
type: API Endpoint
title: List Sales Order
description: Paginated, filterable, sortable list of sales orders with KPI tile summary.
method: GET
path: /sales-order
status: mock
tags: [sales-order, read, list]
resource: /frontend/src/mocks/modules/sales-order.ts
timestamp: 2026-11-13T12:00:00Z
---

# List Sales Order

Backs `views/sales-order/pages/PageSalesOrderTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `q` | string | no | matches number, date, created_by, customer code/name, sales name, description, invoice number; case-insensitive |
| `approval_status` | string | no | `pending` or `approved` |
| `invoice_status` | string | no | `not_invoiced` or `invoiced` |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`sort_by` accepts `date`, `number`, `customer_name`, `sales_name`, or `total`.

## KPI tiles (`meta.summary`)

| Key | Tile | Filter it sets | Counts rows where |
|---|---|---|---|
| `pending` | Menunggu Persetujuan | `approval_status=pending` | `approval_status = pending` |
| `awaiting_invoice` | Belum Diinvoice | `approval_status=approved`, `invoice_status=not_invoiced` | approved and no invoice yet |
| `invoiced` | Sudah Diinvoice | `invoice_status=invoiced` | has its (one) invoice |

Every tile carries `count` and `amount` (sum of `total`). See [conventions](../conventions.md#list-kpi-summary-optional-metasummary).

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1,
      "number": "RIN.SO260902001",
      "date": "2026-09-02",
      "due_date": "2026-10-02",
      "customer_code": "CUST-0001",
      "customer_name": "PT Samudra Edukasi Raya",
      "sales_code": "SL01",
      "sales_name": "Budi Santoso",
      "department_code": "SLS",
      "department_name": "Sales",
      "description": "Pesanan perlengkapan kantor",
      "approval_status": "pending",
      "invoice_status": "not_invoiced",
      "sales_invoice_number": null,
      "locked": false,
      "total": 8750000
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 1, "last_page": 1, "summary": { "pending": { "count": 1, "amount": 8750000 } } }
}
```

Rows are the full resolved `SalesOrder` (same shape as [get-sales-order](./get-sales-order.md)); the example shows the fields the list uses.

## Errors

Standard only (`401`).

## Notes

- Default UI sorting is date descending.
- Edit and delete (row menu) are shown only while the order is `pending` and not `locked`.
- The order number opens [get-sales-order](./get-sales-order.md).
