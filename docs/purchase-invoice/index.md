---
type: OKF Module
title: Invoice Pembelian (Purchase Invoice)
description: Tagihan supplier atas satu penerimaan pembelian — harga per baris, DPP/PPN, approval satu arah yang membentuk hutang (kontrabon), dan faktur pajak.
tags: [purchase-invoice, procurement, payables]
timestamp: 2026-11-06T12:00:00Z
---

# Invoice Pembelian

Invoice supplier ("BL") atas **satu** [purchase-receipt](../purchase-receipt/index.md) yang
`invoice_status`-nya `not_invoiced`. Consumed by `frontend/src/views/purchase-invoice/`
(list, detail, tambah, edit, cetak).

Ported from Legacy `/blrefbm`. **Perbedaan dari Legacy:** Legacy membuat invoice otomatis saat
BM disimpan dan tidak punya create manual; V2 membuatnya lewat form *Tambah* dari penerimaan
yang belum diinvoice (PRD draft `04-pembelian-invoice.md` juga menggambarkan create manual).
Keputusan produk final **unresolved** — saat berubah, hanya `create-purchase-invoice` yang bergeser.
Jurnal Posting **di luar scope**. Approval membentuk hutang: lihat [supplier-payable](../supplier-payable/index.md)
(`kontrabon_number` = nomor hutang). Retur atas invoice ini: [purchase-return](../purchase-return/index.md);
faktur pajak bisa diisi massal lewat [tax-invoice-import](../tax-invoice-import/index.md).

## Entity: `PurchaseInvoice`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | nomor invoice otomatis ("BL #"), read-only |
| `date` | string | Tanggal; required, `YYYY-MM-DD`, tidak boleh melebihi hari ini |
| `locked` | boolean | response-only, server-computed: `date` falls in a closed period → edit, delete and approval changes are refused ([conventions](../conventions.md#closing-period-lock-locked)) |
| `purchase_receipt_id` | number | required; penerimaan sumber, terkunci setelah create |
| `purchase_receipt_number` `purchase_order_id` `purchase_order_number` | — | resolved reference fields, read-only |
| `supplier_id` `supplier_code` `supplier_name` | — | resolved dari PO sumber, read-only |
| `department_id` `department_code` `department_name` | — | diwarisi dari penerimaan, read-only |
| `supplier_invoice_number` | string | "Nomor Invoice Supplier" (`BLInvoice`); required, max 30 karakter |
| `description` | string | Keterangan; opsional, max 250 karakter |
| `pkp_active` | boolean | snapshot PKP dari PO sumber saat invoice dibuat; tidak berubah walau master supplier berubah |
| `approval_status` | enum | `pending`, `approved` — satu arah, tidak ada reject/unapprove |
| `approved_by` `approved_at` | string \| null | metadata approval |
| `kontrabon_number` | string \| null | terisi saat approval (penanda hutang terbentuk) |
| `tax_invoice` | object \| null | faktur pajak `{ number, date, file }` (`file` = lampiran opsional, `null` bila tidak ada); hanya untuk `pkp_active`. Dikelola lewat modal global — lihat [Faktur Pajak (modal bersama)](#faktur-pajak-modal-bersama) |
| `created_by` | string | nama pembuat |
| `lines` | array | satu baris per produk yang diterima (`quantity > 0`) pada penerimaan |
| `dpp` `ppn` `total` | number | dihitung server dari `lines` |

## Entity: `PurchaseInvoiceLine`

| Field | Type | Notes |
|---|---|---|
| `product_id` | number | produk pada penerimaan sumber; identitas baris, tidak bisa diubah |
| `product_code` `product_name` `brand_name` `unit_name` | string \| undefined | resolved display fields |
| `quantity` | number | jumlah diterima pada penerimaan sumber; read-only |
| `price` | number | harga satuan sebelum PPN; **satu-satunya field baris yang bisa diubah**, `> 0`. Default = harga bersih baris PO (`dpp / quantity` PO, dibulatkan) |
| `dpp` | number | `round(quantity × price)` |
| `ppn` | number | `round(dpp × 11%)` bila `pkp_active`, selain itu `0` |
| `total` | number | `dpp + ppn` |

## Guardrails

- Penerimaan harus `not_invoiced`; satu penerimaan hanya punya satu invoice. Create menandai
  penerimaan `invoiced`; delete invoice mengembalikannya ke `not_invoiced`.
- Hanya invoice `pending` yang boleh di-edit atau dihapus.
- Approval satu arah (`pending` → `approved`) dan menghasilkan `kontrabon_number`; approve ulang ditolak.
- Non-PKP: `ppn` selalu `0` dan faktur pajak tidak boleh diisi.
- Nomor faktur pajak harus unik antar invoice; tanggal faktur wajib bila nomor diisi; lampiran (PDF/JPG/PNG, maks 5 MB) opsional.
- `quantity`, `product_id`, dan baris tidak pernah diterima dari client — hanya `price` per `product_id`.

## Faktur Pajak (modal bersama)

Faktur pajak diisi lewat **satu modal global** (`components/common/FakturPajakModal.vue`, dibuka via
`useFakturPajak().open({ kode, endpoint, onSaved })`) — meniru `faktur_pajak/modal` Legacy yang
dipakai bersama banyak dokumen. Modal tidak tahu modul asalnya; ia hanya butuh sebuah `endpoint`
yang mengikuti kontrak ini, sehingga modul lain (invoice penjualan, retur) cukup menyediakan dua
endpoint yang sama bentuknya:

| Method | Path pola | Fungsi |
|---|---|---|
| GET | `<resource>/:id/tax-invoice` | baca faktur terkini → `{ data: { number, date, file } \| null }` |
| PUT | `<resource>/:id/tax-invoice` | upsert faktur → `{ data: <dokumen>, message }`; error field di `number`, `date`, `file` |

Modal membuka mode **Detail** (ringkasan + preview lampiran + tombol Edit Faktur) bila faktur sudah
ada, atau langsung mode **Edit** bila belum.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/purchase-invoice` | [list-purchase-invoice](./list-purchase-invoice.md) |
| GET | `/purchase-invoice/:id` | [get-purchase-invoice](./get-purchase-invoice.md) |
| POST | `/purchase-invoice` | [create-purchase-invoice](./create-purchase-invoice.md) |
| PUT | `/purchase-invoice/:id` | [update-purchase-invoice](./update-purchase-invoice.md) |
| DELETE | `/purchase-invoice/:id` | [delete-purchase-invoice](./delete-purchase-invoice.md) |
| PATCH | `/purchase-invoice/:id/approval` | [update-purchase-invoice-approval](./update-purchase-invoice-approval.md) |
| GET | `/purchase-invoice/:id/tax-invoice` | [get-purchase-invoice-tax-invoice](./get-purchase-invoice-tax-invoice.md) |
| PUT | `/purchase-invoice/:id/tax-invoice` | [update-purchase-invoice-tax-invoice](./update-purchase-invoice-tax-invoice.md) |
| GET | `/purchase-invoice/:id/history` | [get-purchase-invoice-history](./get-purchase-invoice-history.md) |
| GET | `/purchase-receipt/:id/invoiceable-lines` | [get-purchase-receipt-invoiceable-lines](./get-purchase-receipt-invoiceable-lines.md) |
