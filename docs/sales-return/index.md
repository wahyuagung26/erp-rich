---
type: OKF Module
title: Retur Penjualan (Sales Return)
description: Retur barang dari customer atas satu invoice penjualan yang sudah disetujui — jumlah per produk (harga, diskon dan PPN dari invoice), approval dengan tolak / ajukan ulang, faktur pajak, dan penyelesaian retur (potong piutang invoice atau dana kembali ke customer).
tags: [sales-return, penjualan, receivables]
timestamp: 2026-11-13T12:00:00Z
---

# Retur Penjualan

Retur ("RJ") atas **satu** [sales-invoice](../sales-invoice/index.md) yang `approved`. Consumed by
`frontend/src/views/sales-return/` (list, detail, tambah, edit, cetak). Ported from Legacy `/rj` (PRD `sales/06-retur-penjualan.md`).

Approve = **stok masuk ke gudang penerima + jurnal pembalik** (mock hanya mengubah status dan menulis riwayat; tidak ada buku stok/jurnal).
Karena itu dokumen retur **terkena closing period** ([conventions](../conventions.md#closing-period-lock-locked)): field `locked`, `ClosingBadge`,
dan 422 pada edit / hapus / setiap perubahan approval / `date` di periode closing. **Faktur pajak tetap bisa diubah.**
**Penyelesaian** terkunci oleh `date`-nya **sendiri** (bukan tanggal retur) — sama seperti penyelesaian Retur Pembelian.

Tidak diport dari legacy: akses per kode / RBAC departemen, gudang transit (`SALES_RETURN`) + modul Barang Masuk Retur, HPP / moving average,
pilihan SO sebagai sumber (sumber retur di V2 selalu invoice).

## Rumus

Harga **tidak pernah** dari client — selalu dari baris invoice sumber (legacy: `DRJHrgSatNet = DSOHrgSatNet`).

```
line.dpp   = round((price − discount) × quantity)       price & discount = baris invoice sumber (discount = rupiah per satuan)
line.ppn   = pkp_active ? round(line.dpp × 11%) : 0
line.total = line.dpp + line.ppn
dpp, ppn, total = Σ lines
used_total      = Σ settlements type receivable_deduction
refunded_total  = Σ settlements type cash_bank
remaining_total = max(total − used_total − refunded_total, 0)       ("Sisa Retur")
```

Diskon global / biaya penjualan di header invoice **tidak** ikut dibagi ke retur (PRD hanya mengenal harga satuan bersih per baris) — retur memakai nilai per baris.

## Entity: `SalesReturn`

| Field | Type | Notes |
|---|---|---|
| `id` | number | server-assigned |
| `number` | string | "Nomor", `RET.<kode perusahaan><yymmdd>/<nnn>`, mis. `RET.RIN260925/001`; otomatis (format legacy `rj`) |
| `date` | string | required, `YYYY-MM-DD`; tidak melebihi hari ini, tidak sebelum tanggal invoice, tidak di periode closing |
| `locked` | boolean | response-only: `date` di periode closing → edit, hapus, approval diblokir ([conventions](../conventions.md#closing-period-lock-locked)) |
| `sales_invoice_id` | number | required; invoice sumber (harus `approved`), terkunci setelah create |
| `sales_invoice_number` `sales_invoice_date` | string | resolved, read-only |
| `customer_id` `customer_code` `customer_name` | — | resolved dari invoice |
| `department_id` `department_code` `department_name` | — | resolved dari invoice |
| `warehouse_id` `warehouse_code` `warehouse_name` | — | "Gudang Penerima" — gudang tempat barang retur masuk; required |
| `reason` | string | "Alasan Retur"; required, max 250 |
| `pkp_active` | boolean | snapshot PKP dari invoice sumber |
| `approval_status` | enum | `pending`, `approved`, `rejected` |
| `rejection_reason` `approved_by` `approved_at` | string \| null | metadata approval |
| `tax_invoice` | object \| null | `{ number, date, file }` — **nama field yang juga ditulis Import Faktur Pajak**; hanya untuk `pkp_active` dan retur `approved`. Modal bersama, lihat [faktur pajak](../purchase-invoice/index.md#faktur-pajak-modal-bersama) |
| `created_by` | string | |
| `lines` | array | hanya produk dengan `quantity > 0`, lihat `SalesReturnLine` |
| `dpp` `ppn` `total` | number | dihitung server (lihat Rumus) |
| `used_total` | number | total yang memotong piutang invoice |
| `refunded_total` | number | total dana kembali ke customer |
| `remaining_total` | number | "Sisa Retur" |
| `invoice_outstanding` | number | Sisa piutang invoice sumber saat ini — batas atas potong piutang |
| `settlement_status` | enum | `open`, `settled` — `settled` bila `approved` dan `remaining_total = 0` |
| `settlements` | array | riwayat penyelesaian, lihat `SalesReturnSettlement` |

## Entity: `SalesReturnLine`

| Field | Type | Notes |
|---|---|---|
| `variant_id` | number | varian pada invoice sumber; identitas baris, unik per retur; `product_id` `product_*` `sku` `variant_label` resolved |
| `product_code` `product_name` `brand_name` `unit_name` | string \| undefined | resolved |
| `quantity_sold` | number | jumlah pada invoice ("Qty Terjual") |
| `quantity_returned_before` | number | jumlah yang sudah diretur oleh retur LAIN yang tidak `rejected` ("Sudah Diretur") |
| `quantity` | number | "Qty Retur"; `0 ≤ quantity ≤ quantity_sold − quantity_returned_before` |
| `price` `discount` | number | dari baris invoice sumber, read-only |
| `dpp` `ppn` `total` | number | lihat Rumus |

## Entity: `SalesReturnSettlement`

| Field | Type | Notes |
|---|---|---|
| `id` | number | |
| `date` | string | `YYYY-MM-DD`; tidak sebelum tanggal retur, tidak melebihi hari ini, tidak di periode closing |
| `type` | enum | `receivable_deduction` (potong piutang invoice sumber) · `cash_bank` (dana kembali ke customer) |
| `bank_account_id` `bank_account_name` | — | hanya `cash_bank` ("Akun Cash / Bank" tempat dana keluar) |
| `description` | string | |
| `amount` | number | |
| `locked` | boolean | server-computed: `date` penyelesaian di periode closing → tidak bisa diubah / dibatalkan |

### Baris pembayaran di invoice (kontrak lintas modul)

`receivable_deduction` menulis **satu baris** `db.salesInvoicePayment` milik invoice sumber, dimiliki penuh oleh Retur Penjualan (create / update / delete):

```json
{ "id": 5, "invoice_id": 1, "date": "2026-09-26", "payment_type_id": 0, "payment_type": "Retur Penjualan", "method": "cash_bank",
  "reference": "RET.RIN260925/001", "amount": 2000000, "kind": "receivable", "return_id": 1 }
```

`paid_total` / `outstanding` invoice dihitung ulang dari semua baris, sehingga potong piutang langsung mengurangi Sisa invoice. Piutang Customer menampilkan baris ini read-only
(link ke `/sales-return/<return_id>`) dan tidak pernah mengubah / menghapusnya. Mengubah / membatalkan penyelesaian menjaga baris ini tetap sinkron (tanggal, nominal) atau menghapusnya.

## Guardrails

- Invoice sumber harus `approved`. Boleh lebih dari satu retur per invoice selama total `quantity` per varian (retur yang tidak `rejected`) tidak melebihi jumlah invoice; retur `rejected` melepas jumlahnya.
- Hanya retur yang belum `approved` (`pending` / `rejected`) yang boleh diedit atau dihapus.
- **Approval:** `pending` → `approved` / `rejected`; `rejected` → `pending` (Ajukan Ulang, jumlah dicek ulang); `approved` → `pending` (Batalkan Approval) **ditolak bila sudah ada `settlements`**.
- **Batalkan Approval invoice sumber ditolak** selama ada retur yang tidak `rejected` (guard di `unapproveGuards` Invoice Penjualan).
- Penyelesaian hanya untuk retur `approved`; `amount ≤ remaining_total`. `receivable_deduction` juga `≤ invoice_outstanding`.
- Keduanya dibuat, diubah dan dibatalkan dari retur ini.
- Nomor faktur pajak unik antar invoice dan retur.
- **Periode closing:** dokumen (edit / hapus / approval / `date`) dikunci oleh `date` retur; penyelesaian oleh `date`-nya sendiri; penyelesaian baru tidak boleh bertanggal di periode closing. UI mengganti tombol dengan `ClosingBadge`.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/sales-return` | [list-sales-return](./list-sales-return.md) |
| GET | `/sales-return/:id` | [get-sales-return](./get-sales-return.md) |
| POST | `/sales-return` | [create-sales-return](./create-sales-return.md) |
| PUT | `/sales-return/:id` | [update-sales-return](./update-sales-return.md) |
| DELETE | `/sales-return/:id` | [delete-sales-return](./delete-sales-return.md) |
| PATCH | `/sales-return/:id/approval` | [update-sales-return-approval](./update-sales-return-approval.md) |
| POST | `/sales-return/:id/settlements` | [create-sales-return-settlement](./create-sales-return-settlement.md) |
| PUT | `/sales-return/:id/settlements/:settlementId` | [update-sales-return-settlement](./update-sales-return-settlement.md) |
| DELETE | `/sales-return/:id/settlements/:settlementId` | [delete-sales-return-settlement](./delete-sales-return-settlement.md) |
| GET | `/sales-return/:id/tax-invoice` | [get-sales-return-tax-invoice](./get-sales-return-tax-invoice.md) |
| PUT | `/sales-return/:id/tax-invoice` | [update-sales-return-tax-invoice](./update-sales-return-tax-invoice.md) |
| GET | `/sales-return/:id/history` | [get-sales-return-history](./get-sales-return-history.md) |
| GET | `/sales-invoice/:id/returnable-lines` | [get-sales-invoice-returnable-lines](./get-sales-invoice-returnable-lines.md) |
