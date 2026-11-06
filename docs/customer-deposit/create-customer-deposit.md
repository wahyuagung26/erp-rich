---
type: API Endpoint
title: Create Customer Deposit
description: Record a deposit received from a customer. No approval workflow — usable immediately.
method: POST
path: /customer-deposit
status: mock
tags: [customer-deposit, write]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# Create Customer Deposit

Backs `views/customer-deposit/components/FormCustomerDeposit.vue`. `number` is always server-assigned. `used` starts
at `0`; `remaining` is `amount`.

## Request

### Body

```json
{
  "date": "2026-09-03",
  "department_id": 9,
  "customer_id": 1,
  "amount": 50000000,
  "cash_account_id": 17,
  "cash_flow": "OPERASI_IN",
  "description": "Titipan pembelian paket buku",
  "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD`; not in a closed period |
| `department_id` | number | required; active [`Department`](../department/index.md) |
| `customer_id` | number | required; non-deleted [`Customer`](../customer/index.md) |
| `amount` | number | required; `> 0` |
| `cash_account_id` | number | required; non-deleted `cash_bank` [`Account`](../account/index.md) |
| `cash_flow` | string \| null | optional; must exist in [`CashFlow`](../cash-flow/index.md) when sent |
| `description` | string | optional |
| `attachment` | object | required; one PDF/JPG/JPEG/PNG, max 5 MB |

`used` / `remaining` / `last_invoice_number` are ignored on write.

## Response

`201`: `{ "data": CustomerDeposit, "message": "Titipan customer ditambahkan" }` (see [list](./list-customer-deposit.md) for the row shape; `used: 0`, `remaining = amount`).

## Errors

| Status | When | Body |
|---|---|---|
| `422` | invalid field | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |

**Periode closing:** a `date` in a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` ([conventions](../conventions.md#closing-period-lock-locked)).
