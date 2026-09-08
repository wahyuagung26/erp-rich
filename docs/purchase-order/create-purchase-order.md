---
type: API Endpoint
title: Create Order Pembelian
description: Membuat order pembelian baru dengan status pending.
method: POST
path: /purchase-order
status: mock
tags: [purchase-order, write]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Create Order Pembelian

Membuat PO baru dari `PagePurchaseOrderTambah.vue`. Page menerima
`PurchaseOrderRequest` dari `FormPurchaseOrder.vue`, mengirim request ke mock, menampilkan
toaster sukses, lalu kembali ke `/purchase-order`.

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
    {
      "product_id": 1,
      "quantity": 2,
      "price": 3500000,
      "discount": 0
    }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | wajib, format `YYYY-MM-DD` |
| `supplier_id` | number | wajib, supplier aktif |
| `pkp_active` | boolean | wajib; menentukan PPN transaksi |
| `department_id` | number | wajib, departemen aktif |
| `warehouse_id` | number | wajib, gudang aktif |
| `purchase_type` | string \| null | UI menyediakan `E-Money`, `Other`, atau `PVC`; mock menerima string atau null |
| `address` | string | wajib setelah trim |
| `description` | string | wajib setelah trim |
| `lines` | array | minimal satu baris |

Setiap line request memiliki:

| Field | Type | Rules |
|---|---|---|
| `product_id` | number | produk aktif |
| `quantity` | number | `> 0` |
| `price` | number | `> 0` |
| `discount` | number | `>= 0` dan tidak melebihi `quantity × price` |

Client tidak mengirim `id`, `number`, status, label master, `dpp`, `ppn`, `nett`, atau
`total`. Field tersebut dibuat atau di-resolve oleh mock.

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

`ppn` bernilai 11% dari DPP jika `pkp_active` true dan 0 jika false.

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |
| `422` | field header/line tidak valid | `{ "message": "Validasi gagal", "errors": { "field": ["Pesan"] } }` |

Field error mock dapat menggunakan `date`, `supplier_id`, `pkp_active`, `department_id`,
`warehouse_id`, `address`, `description`, atau `lines`.
