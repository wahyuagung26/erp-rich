---
type: API Endpoint
title: List Order Pembelian
description: Daftar PO dengan pencarian, filter status, sorting, dan pagination.
method: GET
path: /purchase-order
status: mock
tags: [purchase-order, read, list]
resource: /Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts
timestamp: 2026-09-09T00:00:00Z
---

# List Order Pembelian

Dipakai oleh `PagePurchaseOrderTable.vue` melalui `useTableList`. Response sudah mengisi
enrichment supplier, departemen, gudang, dan produk agar dapat ditampilkan di tabel.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page` | number | no | default mengikuti [konvensi pagination](../conventions.md#pagination-list-endpoints) |
| `per_page` | number | no | UI default 20; opsi UI 20 atau semua |
| `sort_by` | string | no | `date`, `number`, `created_by`, `supplier_name`, `warehouse_name`, `total` |
| `sort_order` | `asc` \| `desc` | no | urutan sorting |
| `field` | string | no | field pencarian khusus |
| `q` | string | no | pencarian header berdasarkan `field` |
| `product_q` | string | no | mencari kode/nama/merk produk di dalam line |
| `approval_status` | string | no | `pending`, `approved`, atau `rejected` |
| `delivery_status` | string | no | `not_received`, `partial`, atau `full` |
| `is_locked` | string | no | `true` atau `false` |

Nilai `field` yang disediakan UI:

```text
number, date, created_by, supplier_code, supplier_name,
warehouse_name, address, description
```

Jika `field` kosong, `q` dicari terhadap gabungan field pencarian tersebut. Filter status
bersifat exact match.

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
      "is_locked": false,
      "total": 7770000
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

Entity list mengikuti shape `PurchaseOrder`; contoh di atas menampilkan field yang dipakai
tabel.

## Errors

| Status | When | Body |
|---|---|---|
| `401` | token tidak valid | mengikuti [konvensi auth](../conventions.md#auth) |

## Notes

- Tombol edit dan hapus hanya ditampilkan jika PO belum approved, belum locked, dan belum memiliki penerimaan.
- Nomor PO membuka detail `/purchase-order/:id`.
- Default sorting UI adalah tanggal menurun.
