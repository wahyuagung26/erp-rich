---
type: API Endpoint
title: Create Purchase Order
description: Add a new purchase order. Server assigns the transaction number and computed amounts.
method: POST
path: /purchase-order
status: mock
tags: [purchase-order, write]
resource: /frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Create Purchase Order

Backs `views/purchase-order/pages/PagePurchaseOrderTambah.vue`. Client-side validation:
`frontend/src/views/purchase-order/schema.ts` (Valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "date": "2026-09-08",
  "supplier_id": 1,
  "pkp_active": true,
  "department_id": 4,
  "warehouse_id": 1,
  "purchase_type": "Other",
  "address": "Alamat supplier",
  "description": "Pembelian kebutuhan operasional",
  "lines": [
    { "product_id": 1, "quantity": 2, "price": 3500000, "discount": 0 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `supplier_id` | number | required; active supplier |
| `pkp_active` | boolean | required; controls PPN calculation |
| `department_id` | number | required; active department |
| `warehouse_id` | number | required; active warehouse |
| `purchase_type` | string \| null | UI options are `E-Money`, `Other`, `PVC`; mock accepts string or null |
| `address` | string | required after trim |
| `description` | string | required after trim |
| `lines` | array | at least one line |

Each line contains `product_id` (active product), `quantity` (`> 0`), `price` (`> 0`),
and `discount` (`>= 0`, not greater than `quantity × price`). Client does not send `id`,
`number`, status fields, resolved labels, `dpp`, `ppn`, `nett`, or `total`.

## Response

`201`:

```json
{
  "data": {
    "id": 5,
    "number": "PO-RICH/0005/09/2026",
    "date": "2026-09-08",
    "supplier_id": 1,
    "supplier_code": "SUP001",
    "supplier_name": "Supplier Contoh",
    "pkp_active": true,
    "department_id": 4,
    "department_code": "FAT",
    "department_name": "Finance Accounting & Tax",
    "warehouse_id": 1,
    "warehouse_code": "GD1",
    "warehouse_name": "Gudang Pusat",
    "purchase_type": "Other",
    "address": "Alamat supplier",
    "description": "Pembelian kebutuhan operasional",
    "approval_status": "pending",
    "delivery_status": "not_received",
    "is_locked": false,
    "lock_reason": null,
    "rejection_reason": null,
    "approved_by": null,
    "approved_at": null,
    "created_by": "Admin",
    "lines": [
      {
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Produk Contoh",
        "brand_name": "Merk Contoh",
        "unit_name": "Pieces",
        "quantity": 2,
        "price": 3500000,
        "discount": 0,
        "dpp": 7000000,
        "ppn": 770000,
        "total": 7770000
      }
    ],
    "dpp": 7000000,
    "ppn": 770000,
    "nett": 7000000,
    "total": 7770000
  },
  "message": "Order pembelian ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |

Field validation errors can use `date`, `supplier_id`, `pkp_active`, `department_id`,
`warehouse_id`, `address`, `description`, or `lines`. The response amount fields are
computed from the request lines; PPN is 11% of DPP when `pkp_active` is true and 0 otherwise.
