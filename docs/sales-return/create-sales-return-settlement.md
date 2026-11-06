---
type: API Endpoint
title: Create Sales Return Settlement (Penyelesaian)
description: Settle an approved return by offsetting the invoice receivable or by refunding the customer.
method: POST
path: /sales-return/:id/settlements
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Create Sales Return Settlement (Penyelesaian)

Backs the "Catat Penyelesaian" form in `PageSalesReturnDetail.vue`.

## Request

### Body

```json
{ "type": "receivable_deduction", "date": "2026-10-12", "bank_account_id": null, "description": "", "amount": 1440000 }
```

| Field | Type | Rules |
|---|---|---|
| `type` | enum | `receivable_deduction` (potong piutang invoice sumber) or `cash_bank` (dana kembali ke customer) |
| `date` | string | required; not after today, not before the return `date`, **and not in a closed period** |
| `bank_account_id` | number \| null | `cash_bank` only: required, existing bank account ("Akun Cash / Bank"); ignored for `receivable_deduction` |
| `description` | string | optional (potong piutang defaults to `Potong piutang invoice <nomor>`) |
| `amount` | number | `> 0` and `≤ remaining_total`; for `receivable_deduction` also `≤ invoice_outstanding` |

`receivable_deduction` also writes the `kind: receivable` payment row on the invoice (see [index](./index.md#baris-pembayaran-di-invoice-kontrak-lintas-modul)).

## Response

`201`: `{ "data": { ...SalesReturn }, "message": "Potong piutang dicatat" | "Pengembalian dana dicatat" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | return not found | `{ "message": "Retur penjualan tidak ditemukan" }` |
| `422` | return not approved | `{ "message": "Retur harus disetujui sebelum diselesaikan" }` |
| `422` | validation | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
