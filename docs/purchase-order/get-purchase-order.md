---
type: API Endpoint
title: Get Order Pembelian
description: Mengambil satu PO beserta master yang sudah di-resolve dan nilai computed.
method: GET
path: /purchase-order/:id
status: mock
tags: [purchase-order, read]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# Get Order Pembelian

Dipakai oleh `PagePurchaseOrderDetail.vue` untuk halaman detail dan oleh
`PagePurchaseOrderEdit.vue` sebelum mengisi form edit.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseOrder.id` |

## Response

`200`:

```json
{
  "data": {
    "id": 1,
    "number": "PO-RICH/0001/09/2026",
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
  }
}
```

`lines` berisi line yang sudah memiliki label produk dan `dpp`, `ppn`, `total`. Response
juga mengisi kode/nama supplier, departemen, dan gudang dari master aktif. Nilai summary
dihitung ulang dari line dan `pkp_active`.

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |
| `404` | ID tidak ditemukan | `{ "message": "Purchase order tidak ditemukan" }` |

## Notes

Halaman detail menyediakan aksi sesuai state PO:

- `pending`: Setujui atau Tolak;
- `rejected`: Ajukan Ulang menjadi `pending`;
- `approved` dan belum locked: Kunci;
- PO locked: Buka Kunci;
- PO yang masih writable: Edit atau Hapus.
