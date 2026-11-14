---
type: OKF Module
title: Surat Jalan (Delivery Note)
description: Dokumen pengantaran barang untuk satu Invoice Penjualan yang sudah disetujui (legacy `surat_jalan` / `trsj`) — hanya dokumen, tidak menggerakkan stok, HPP, maupun jurnal.
tags: [delivery-note, penjualan, logistics]
timestamp: 2026-11-13T12:00:00Z
---

# Surat Jalan

Bukti pengantaran barang ke customer. Consumed by `frontend/src/views/delivery-note/` (list, detail, tambah, edit, cetak).
Dibuat dari [Invoice Penjualan](../sales-invoice/index.md) berstatus `approved` — dipilih di form, atau dibuka dengan
`/delivery-note/tambah?sales_invoice_id=<id>`; produk terisi dari
[get-sales-invoice-deliverable-lines](./get-sales-invoice-deliverable-lines.md).

Ported from legacy `surat_jalan` (`trsj` / `detsj`). Tidak diport: DO/PS sebagai sumber, kode akses `sj-*`, scope cabang, nomor `SJ-{nomor SO}`.
PRD menyebut kendaraan, driver, dan penerima; legacy menyebut satu SJ per invoice — V2 mengikuti keduanya.

## Aturan

- **Dokumen saja.** SJ tidak pernah mengubah stok, HPP, atau jurnal — approve invoice yang melakukannya.
- **Tepat satu SJ per invoice, dan satu invoice per SJ.** `sales_invoice_id` tidak bisa diubah setelah SJ dibuat. Hanya invoice `approved` yang boleh jadi sumber.
- `quantity` per baris ≤ `invoice_quantity` (qty baris invoice); produk unik per SJ; minimal satu baris `quantity > 0`. Pengiriman sebagian diperbolehkan.
- **Hapus = hard delete** (tidak ada siklus batal). Setelah dihapus, invoice boleh dibuatkan SJ baru.
- **Batalkan Approval invoice ditolak** selama invoice punya SJ (guard di `unapproveGuards` milik [sales-invoice](../sales-invoice/index.md), pesan: *Invoice sudah memiliki surat jalan …*).
- **Tidak kena closing period** ([conventions](../conventions.md#closing-period-lock-locked)): tidak ada field `locked`, edit / hapus / `date` di periode closing tetap diizinkan, karena SJ tidak menyentuh jurnal maupun stok.
- Tanggal tidak boleh melebihi hari ini.

## Entity: `DeliveryNote`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `number` | string | nomor otomatis `SJ-<nomor invoice>`, mis. `SJ-RIN.INV260920/001` (satu SJ per invoice, format legacy), read-only |
| `date` | string | Tanggal; required, `YYYY-MM-DD`, tidak boleh setelah hari ini |
| `sales_invoice_id` | number | required saat create; invoice `approved` tanpa SJ; **immutable** |
| `sales_invoice_number` `sales_invoice_date` | string \| undefined | resolved, read-only |
| `customer_id` `customer_code` `customer_name` | number \| string | resolved dari invoice, read-only |
| `department_code` `department_name` | string \| undefined | resolved dari invoice |
| `delivery_address` | string | Alamat Pengiriman; required, max 250; diisi awal dari alamat customer |
| `recipient` | string | Nama Penerima; optional, max 100 |
| `driver` | string | Nama Driver / pengirim; optional, max 100 |
| `vehicle` | string | No. Kendaraan; optional, max 50 |
| `description` | string | Keterangan; optional, max 250 |
| `created_by` | string | nama pembuat |
| `total_quantity` | number | Σ `lines.quantity`, read-only |
| `lines` | array | satu baris per baris invoice (qty `0` = tidak dikirim) |

## Entity: `DeliveryNoteLine`

| Field | Type | Notes |
|---|---|---|
| `variant_id` | number | varian dari baris invoice (unik); `product_id` `product_*` `sku` `variant_label` resolved |
| `product_code` `product_name` `brand_name` `unit_name` | string \| undefined | resolved |
| `invoice_quantity` | number | qty baris di invoice = batas atas, read-only |
| `quantity` | number | qty dikirim di SJ ini, `0`…`invoice_quantity` |

## Kontrak untuk modul lain

- Filter `GET /delivery-note?sales_invoice_id=<id>` mengembalikan SJ milik invoice itu (0 atau 1 baris) — modul Invoice memakainya untuk menampilkan status/tautan SJ.
- Tulis ke riwayat invoice: `Surat Jalan Dibuat` / `Surat Jalan Dihapus` (`kind: info`, `summary` = nomor SJ) di `sales-invoice:<id>`.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/delivery-note` | [list-delivery-note](./list-delivery-note.md) |
| GET | `/delivery-note/:id` | [get-delivery-note](./get-delivery-note.md) |
| POST | `/delivery-note` | [create-delivery-note](./create-delivery-note.md) |
| PUT | `/delivery-note/:id` | [update-delivery-note](./update-delivery-note.md) |
| DELETE | `/delivery-note/:id` | [delete-delivery-note](./delete-delivery-note.md) |
| GET | `/delivery-note/:id/history` | [get-delivery-note-history](./get-delivery-note-history.md) |
| GET | `/delivery-note/deliverable-invoices` | [list-deliverable-sales-invoices](./list-deliverable-sales-invoices.md) |
| GET | `/sales-invoice/:id/deliverable-lines` | [get-sales-invoice-deliverable-lines](./get-sales-invoice-deliverable-lines.md) |
