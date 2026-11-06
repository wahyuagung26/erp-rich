---
type: API Endpoint
title: Update Customer Deposit
description: Edit a customer deposit; allowed even after usage, but the nominal cannot drop below what is already used.
method: PUT
path: /customer-deposit/:id
status: mock
tags: [customer-deposit, write]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# Update Customer Deposit

Same body as [Create Customer Deposit](./create-customer-deposit.md). `number` stays; `used` / `remaining` /
`last_invoice_number` are recomputed from the usage rows.

**Business rules** (unlike Uang Muka Supplier, a used deposit stays editable):

- `amount` must be `>= used` → else `422 errors.amount` ("Nominal tidak boleh kurang dari yang sudah dipakai (…)").
- `customer_id` cannot change once the deposit has usage → else `422 errors.customer_id`.

`200`: `{ "data": CustomerDeposit, "message": "Titipan customer diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Titipan customer tidak ditemukan" }` |
| `422` | field error / rules above | `{ "message": "Validasi gagal", "errors": { "amount": ["..."] } }` |

**Periode closing:** refused with `422 { "message": "Periode <bulan tahun> sudah closing, titipan customer tidak bisa diubah" }` when the record's `date` is in a closed period (`locked`) — see [conventions](../conventions.md#closing-period-lock-locked).

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
