---
type: API Endpoint
title: List Customer Receivable Payment Type
description: Payment types offered when recording a receivable payment — master sale types (cash / bank, Titipan) plus the hard-coded Biaya type.
method: GET
path: /customer-receivable/payment-types
status: mock
tags: [customer-receivable, read, list]
resource: /frontend/src/mocks/modules/customer-receivable.ts
timestamp: 2026-11-06T20:00:00Z
---

# List Customer Receivable Payment Type

Feeds the **Tipe Pembayaran** `AsyncSelect` in the payment form of `PageCustomerReceivableDetail.vue` and in the Pembayaran section of the Invoice Penjualan form (`SalesInvoicePayments.vue`, same sale types + Biaya).

**Biaya** is hard-coded (decision 2026-10-14): it is not a row of the Pembayaran master, so it cannot be edited or deleted there. It is always the
last option, with `id = -1`, `code = "BIAYA-INV"`, `name = "Biaya"`, `method = "expense"`.

## Request

### Query

`q` (matches `code` / `name`), `page`, `per_page` — see [conventions](../conventions.md#pagination-list-endpoints).

## Response

`200`: `{ "data": [ { "id": 1, "code": "TP01", "name": "Tunai", "method": "cash_bank" }, …, { "id": -1, "code": "BIAYA-INV", "name": "Biaya", "method": "expense" } ], "meta": { … } }`

The master part equals [list-payment-type](../payment-type/list-payment-type.md) with `transaction_type=sale&method=cash_bank,down_payment` (company-scoped via `X-Company-Id`).

## Errors

Standard only (`401`).
