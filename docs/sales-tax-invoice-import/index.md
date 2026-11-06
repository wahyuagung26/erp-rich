---
type: OKF Module
title: Import Faktur Pajak (sisi Penjualan)
description: Isi nomor seri + tanggal faktur pajak massal dari file export Laporan Pajak — pratinjau per baris, lalu impor.
tags: [sales-tax-invoice-import, tax, sales]
timestamp: 2026-11-06T18:00:00Z
---

# Import Faktur Pajak (Penjualan)

Modul **terpisah** dari [Import Faktur Pajak Pembelian](../tax-invoice-import/index.md) (keputusan owner): endpoint, tab, dan halaman sendiri; bentuk alur dan
statusnya sama. Dua jenis (tab) sisi penjualan:

| `source` | Laporan sumber | Dokumen yang diisi |
|---|---|---|
| `sales_invoice` | Laporan Pajak Keluaran | [sales-invoice](../sales-invoice/index.md) → `tax_invoice` |
| `sales_return` | Laporan Retur Pajak Masukan | Retur Penjualan (`sales-return`) → `tax_invoice` |

Alur: **(1)** export Laporan Pajak untuk masa pajak, **(2)** isi kolom *Nomor Seri Faktur Pajak* dan *Tanggal Faktur Pajak* yang kosong,
**(3)** upload file yang sama → pratinjau → impor. File yang diupload **adalah file export laporan itu sendiri**, bukan template terpisah;
kolom *Referensi* tidak boleh diubah karena dipakai mencocokkan dokumen. Hanya dokumen `approved` + PKP yang dicocokkan. Baris yang dokumennya sudah punya faktur
diganti (`to_be_replaced`); baris dengan nomor seri **dan** tanggal kosong dilewati. Laporan Pajak sendiri **belum ada** di V2: tombol *Buka Laporan Pajak* membuka
`/laporan-pajak?tab=pajak-keluaran` atau `?tab=retur-pajak-masukan` (tab baru) dan sengaja masih **broken link** sampai halaman laporan dibangun.

Aturan faktur sama dengan `PUT /sales-invoice/:id/tax-invoice`: nomor maks 25 karakter dan **unik** antar dokumen sejenis (juga antar baris dalam file yang sama);
pelanggaran → baris berstatus `error`. **Tidak dikunci periode closing** — faktur pajak tidak menggerakkan jurnal/stok; impor tetap berjalan untuk dokumen di periode closed.
Setiap impor menulis event riwayat `Faktur Pajak Diimpor` pada dokumen.

**Mock:** tidak mem-parse isi file; pratinjau dibangun dari dokumen `approved` + PKP di mock plus beberapa baris contoh bermasalah.
Backend wajib mem-parse file sungguhan. Layout file Legacy untuk sisi penjualan **tidak terdokumentasi** (memori Legacy `import_data/core.md` hanya membahas
import *Invoice Penjualan*, bukan faktur pajak); dipakai layout sisi Pembelian sebagai asumsi: judul di baris 2, header baris 5, data baris 6+, maks 5.000 baris.

## Entity: `TaxInvoiceImportPreview`

| Field | Type | Notes |
|---|---|---|
| `token` | string | identitas pratinjau; dipakai saat impor, kedaluwarsa setelah dipakai |
| `source` | enum | `sales_invoice` \| `sales_return` |
| `file_name` | string | |
| `summary` | object | hitungan per status + `total` |
| `rows` | array | `TaxInvoiceImportRow` |

## Entity: `TaxInvoiceImportRow`

| Field | Type | Notes |
|---|---|---|
| `row` | number | nomor baris pada file |
| `reference` | string | nomor dokumen (kolom Referensi) |
| `name` | string | nama customer |
| `number` `date` | string | nomor seri dan tanggal faktur dari file (boleh kosong untuk `skipped`) |
| `status` | enum | `matched` (siap diimpor), `to_be_replaced` (dokumen sudah punya faktur, akan diganti), `unmatched` (referensi tidak ditemukan / belum approved / non-PKP), `skipped` (nomor dan tanggal kosong), `error` (format tidak valid / nomor sudah dipakai) |
| `message` | string \| undefined | alasan untuk `unmatched` / `skipped` / `error` |

Hanya `matched` dan `to_be_replaced` yang diimpor.

## Endpoints

| Method | Path | File |
|---|---|---|
| POST | `/sales-tax-invoice-import/preview` | [preview-sales-tax-invoice-import](./preview-sales-tax-invoice-import.md) |
| POST | `/sales-tax-invoice-import` | [create-sales-tax-invoice-import](./create-sales-tax-invoice-import.md) |
