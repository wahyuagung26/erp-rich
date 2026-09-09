---
type: API Endpoint
title: List Purchase Order
description: Paginated, filterable, sortable list of purchase orders.
method: GET
path: /purchase-order
status: mock
tags: [purchase-order, read, list]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# List Purchase Order

Backs `views/purchase-order/pages/PagePurchaseOrderTable.vue` (via the `useTableList`
composable). Rows include resolved supplier, department, warehouse, and product display data.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `field` | string | no | header search field |
| `q` | string | no | matches the selected header field; case-insensitive |
| `product_q` | string | no | matches product code, name, or brand in lines |
| `approval_status` | string | no | `pending`, `approved`, or `rejected` |
| `delivery_status` | string | no | `not_received`, `partial`, or `full` |

`sort_by` accepts `date`, `number`, `created_by`, `supplier_name`, `warehouse_name`, or
`total`. The UI provides `number`, `date`, `created_by`, `supplier_code`, `supplier_name`,
`warehouse_name`, `address`, and `description` as `field` options. If `field` is empty,
`q` searches across those values.

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
