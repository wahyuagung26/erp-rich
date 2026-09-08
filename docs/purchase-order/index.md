---
type: OKF Module
title: Order Pembelian
description: Order pembelian dengan supplier, gudang, departemen, detail produk, kalkulasi DPP/PPN, status persetujuan, status barang, dan kunci transaksi.
tags: [purchase-order, procurement]
timestamp: 2026-09-09T00:00:00Z
---

# Order Pembelian

Modul Order Pembelian (PO) pada prototype ERP Finance V2. Implementasi frontend berada di
`/Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/views/purchase-order/` dan mock API berada di
`/Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/mocks/modules/purchase-order.ts`.

Kontrak HTTP mengikuti [konvensi API bersama](../conventions.md). Semua response memakai
`.data`; response list juga memakai `.meta`.

> **Status kontrak:** seluruh endpoint pada modul ini berstatus `mock`. Dokumen ini
> mendeskripsikan perilaku mock V2, bukan kontrak backend Legacy yang sudah terverifikasi.

## Model data

### Entity response: `PurchaseOrder`

| Field | Type | Notes |
|---|---|---|
| `id` | number | ID server-assigned |
| `number` | string | Nomor transaksi otomatis, read-only |
| `date` | string | Format `YYYY-MM-DD` |
| `supplier_id` | number | Supplier master |
| `supplier_code` `supplier_name` | string \| undefined | Enrichment response untuk display |
| `pkp_active` | boolean | Status PKP transaksi; menentukan PPN |
| `department_id` | number | Departemen master |
| `department_code` `department_name` | string \| undefined | Enrichment response |
| `warehouse_id` | number | Gudang master |
| `warehouse_code` `warehouse_name` | string \| undefined | Enrichment response |
| `purchase_type` | string \| null | UI menyediakan `E-Money`, `Other`, atau `PVC`; mock menerima string atau null |
| `address` | string | Alamat supplier/transaksi |
| `description` | string | Keterangan transaksi |
| `approval_status` | enum | `pending`, `approved`, `rejected` |
| `delivery_status` | enum | `not_received`, `partial`, `full` |
| `is_locked` | boolean | Status kunci transaksi |
| `lock_reason` | string \| null | Alasan kunci jika ada |
| `rejection_reason` | string \| null | Alasan penolakan jika ada |
| `approved_by` `approved_at` | string \| null | Metadata persetujuan |
| `created_by` | string | User pembuat |
| `lines` | `PurchaseOrderLine[]` | Baris response yang sudah di-resolve |
| `dpp` `ppn` `nett` `total` | number | Nilai computed; tidak dikirim sebagai input |

### Draft dan form frontend

`PurchaseOrderDraft` adalah state UI sebelum validasi. Foreign key dapat bernilai `null`:

```ts
{
  date: string,
  supplier_id: number | null,
  pkp_active: boolean,
  department_id: number | null,
  warehouse_id: number | null,
  purchase_type: string | null,
  address: string,
  description: string,
  lines: PurchaseOrderLineDraft[]
}
```

`PurchaseOrderForm` adalah output validasi Valibot. `supplier_id`, `department_id`,
`warehouse_id`, dan `lines[].product_id` sudah menjadi number yang valid.

Response edit diubah menjadi draft melalui `toPurchaseOrderDraft()` pada
`/Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/views/purchase-order/mappers.ts`.
Form kemudian divalidasi melalui `parsePurchaseOrder()` dan diubah menjadi request melalui
`toPurchaseOrderRequest()`. Enrichment supplier dan produk dilakukan oleh:

- `composables/usePurchaseOrderSupplier.ts` — default alamat dan `pkp_active`;
- `composables/usePurchaseOrderProduct.ts` — label produk dan default harga.

### Request model: `PurchaseOrderRequest`

Request hanya mengirim field bisnis berikut:

```ts
{
  date: string,
  supplier_id: number,
  pkp_active: boolean,
  department_id: number,
  warehouse_id: number,
  purchase_type: string | null,
  address: string,
  description: string,
  lines: PurchaseOrderLineRequest[]
}
```

`PurchaseOrderLineRequest` hanya berisi `product_id`, `quantity`, `price`, dan `discount`.
Field label produk (`product_code`, `product_name`, `brand_name`, `unit_name`) serta field
computed (`dpp`, `ppn`, `total`) tidak dikirim ke API.

### `PurchaseOrderLine`

| Field | Type | Notes |
|---|---|---|
| `product_id` | number | Produk aktif |
| `product_code` `product_name` | string \| undefined | Enrichment response |
| `brand_name` `unit_name` | string \| undefined | Enrichment response |
| `quantity` | number | Lebih besar dari 0 |
| `price` | number | Lebih besar dari 0 |
| `discount` | number | Minimal 0 dan tidak melebihi bruto |
| `dpp` | number | `round(quantity × price) - discount`, minimal 0 |
| `ppn` | number | `round(dpp × 11%)` bila `pkp_active=true`, selain itu 0 |
| `total` | number | `dpp + ppn` |

DPP, PPN, Nett, dan Total dihitung ulang oleh mock dari request/line response. `nett` sama
dengan DPP pada prototype ini.

## Status dan guardrail

- PO baru dibuat dengan `approval_status: pending` dan `delivery_status: not_received`.
- `pending` dapat disetujui atau ditolak melalui aksi dengan konfirmasi.
- PO `rejected` dapat diajukan ulang menjadi `pending` melalui UI.
- PO `approved`, `is_locked`, atau sudah memiliki penerimaan (`partial`/`full`) tidak dapat diedit atau dihapus.
- PO hanya dapat dikunci setelah disetujui.
- Status persetujuan, status barang, dan kunci adalah state yang terpisah.
- PO yang sudah disetujui tidak dapat dibatalkan persetujuannya melalui mock.

## Validasi form

Schema Valibot pada
`/Users/wahyuagung/Sites/RIN/erp-finance-v2/frontend/src/views/purchase-order/schema.ts`
memvalidasi:

- tanggal berformat `YYYY-MM-DD`;
- supplier, departemen, dan gudang wajib dipilih;
- status PKP wajib boolean;
- alamat dan keterangan tidak boleh kosong;
- minimal satu baris produk;
- produk wajib dipilih;
- jumlah dan harga lebih besar dari 0;
- diskon tidak negatif dan tidak melebihi nilai bruto.

HTTP `422` dengan `errors` dipetakan ke field form melalui `setServerErrors()`.
Error operasional tanpa field error ditampilkan sebagai toaster oleh page.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/purchase-order` | [list-purchase-order](./list-purchase-order.md) |
| GET | `/purchase-order/:id` | [get-purchase-order](./get-purchase-order.md) |
| POST | `/purchase-order` | [create-purchase-order](./create-purchase-order.md) |
| PUT | `/purchase-order/:id` | [update-purchase-order](./update-purchase-order.md) |
| DELETE | `/purchase-order/:id` | [delete-purchase-order](./delete-purchase-order.md) |
| PATCH | `/purchase-order/:id/approval` | [update-purchase-order-status](./update-purchase-order-status.md) |
| PATCH | `/purchase-order/:id/lock` | [update-purchase-order-lock](./update-purchase-order-lock.md) |
## Dependencies master data

Form menggunakan endpoint master berikut untuk enrichment. Endpoint tersebut bukan bagian
dari contract endpoint PO dan didokumentasikan pada modul masing-masing:

- `GET /supplier/:id` — modul [supplier](../supplier/index.md), untuk default alamat dan PKP;
- `GET /product/:id` — modul [product](../product/index.md), untuk label produk dan default harga.
