---
type: API Endpoint
title: Get Sales Invoice History
description: Audit timeline of one sales invoice, newest event first.
method: GET
path: /sales-invoice/:id/history
status: mock
tags: [sales-invoice, read, history]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T16:00:00Z
---

# Get Sales Invoice History

Backs the global `HistoryModal`, opened from the detail header and the **Riwayat** item of the list row menu. Shape and rules:
[shared record-history contract](../conventions.md#record-history-resourceidhistory).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | id of the sales invoice |

## Response

`200`: `{ "data": [ { "id", "at", "actor", "title", "kind", "summary", "changes" } ] }` — newest first.

## Events

| Event | `kind` | Notes |
|---|---|---|
| Dibuat | `created` | `summary` = sales order number, when created from one |
| Diubah | `updated` | `changes` covers date, customer, sales, department, termin, PKP, description, diskon global, per-product quantity / price / discount / gudang, biaya penjualan, pembayaran |
| Faktur Pajak Disimpan / Diubah | `info` | `changes` shows number, date and file when edited |
| Disetujui | `approved` | |
| Ditolak | `rejected` | `summary` = rejection reason |
| Diajukan Ulang | `info` | rejected invoice resubmitted as pending |
| Approval Dibatalkan | `info` | approved invoice back to pending |
| Surat Jalan Dibuat / Dihapus | `info` | written by [Surat Jalan](../delivery-note/index.md); `summary` = SJ number |
| Pembayaran Piutang Dicatat / Diubah / Dibatalkan | `info` | written by [Piutang Customer](../customer-receivable/index.md) |
| Faktur Pajak Diimpor | `info` | written by [Import Faktur Pajak](../sales-tax-invoice-import/index.md); `summary` = faktur number |

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice penjualan tidak ditemukan" }` |
