---
type: OKF Module
title: Import Faktur Pajak (sisi Pembelian)
description: Isi nomor seri + tanggal faktur pajak massal dari file export Laporan Pajak — pratinjau per baris, lalu impor.
tags: [tax-invoice-import, tax, procurement]
timestamp: 2026-11-05T14:00:00Z
---

# Import Faktur Pajak

Dua jenis (tab) sisi pembelian, mengikuti Legacy `import_data` → *Import Faktur Pajak Pembelian*:

| `source` | Laporan sumber | Dokumen yang diisi |
|---|---|---|
| `purchase_invoice` | Laporan Pajak Masukan | [purchase-invoice](../purchase-invoice/index.md) |
| `purchase_return` | Laporan Retur Pajak Keluaran | [purchase-return](../purchase-return/index.md) |

Alur: **(1)** export Laporan Pajak untuk masa pajak, **(2)** isi kolom *Nomor Seri Faktur Pajak* dan *Tanggal Faktur Pajak* yang kosong,
**(3)** upload file yang sama → pratinjau → impor. File yang diupload **adalah file export laporan itu sendiri**, bukan template terpisah;
kolom *Referensi* tidak boleh diubah karena dipakai mencocokkan dokumen. Baris yang sudah punya faktur diganti; baris dengan nomor seri
**dan** tanggal kosong dilewati. Laporan Pajak sendiri **belum ada** di V2: tombol *Buka Laporan Pajak* membuka `/laporan-pajak?tab=pajak-masukan` atau `?tab=retur-pajak-keluaran`
(tab baru) dan sengaja masih **broken link** sampai halaman laporan dibangun.

**Mock:** tidak mem-parse isi file; pratinjau dibangun dari dokumen `approved` + PKP di mock plus beberapa baris contoh bermasalah.
Backend wajib mem-parse file sungguhan (layout Legacy: judul di baris 2, header baris 5, data baris 6+, maks 5.000 baris).

## Entity: `TaxInvoiceImportPreview`

| Field | Type | Notes |
|---|---|---|
| `token` | string | identitas pratinjau; dipakai saat impor, kedaluwarsa setelah dipakai |
| `source` | enum | `purchase_invoice` \| `purchase_return` |
| `file_name` | string | |
| `summary` | object | hitungan per status + `total` |
| `rows` | array | `TaxInvoiceImportRow` |

## Entity: `TaxInvoiceImportRow`

| Field | Type | Notes |
|---|---|---|
| `row` | number | nomor baris pada file |
| `reference` | string | nomor dokumen (kolom Referensi) |
| `name` | string | nama supplier |
| `number` `date` | string | nomor seri dan tanggal faktur dari file (boleh kosong untuk `skipped`) |
| `status` | enum | `matched` (siap diimpor), `to_be_replaced` (dokumen sudah punya faktur, akan diganti), `unmatched` (referensi tidak ditemukan), `skipped` (nomor dan tanggal kosong), `error` (format tidak valid) |
| `message` | string \| undefined | alasan untuk `unmatched` / `skipped` / `error` |

Hanya `matched` dan `to_be_replaced` yang diimpor.

## Endpoints

| Method | Path | File |
|---|---|---|
| POST | `/tax-invoice-import/preview` | [preview-tax-invoice-import](./preview-tax-invoice-import.md) |
| POST | `/tax-invoice-import` | [create-tax-invoice-import](./create-tax-invoice-import.md) |
