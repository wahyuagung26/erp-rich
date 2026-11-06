---
type: API Endpoint
title: List Customer Deposit
description: Paginated, searchable, sortable list of customer deposits (titipan customer).
method: GET
path: /customer-deposit
status: mock
tags: [customer-deposit, read, list]
resource: /frontend/src/mocks/modules/customer-deposit.ts
timestamp: 2026-11-06T15:00:00Z
---

# List Customer Deposit

Backs `views/customer-deposit/pages/PageCustomerDepositTable.vue` (via `useTableList`) and the deposit picker of
[Invoice Penjualan](../sales-invoice/index.md).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | `sort_by` accepts `date`, `number`, `remaining` — set via the sortable `Tanggal` / `Nomor` / `Sisa` table headers |
| `q` | string | no | matches number, customer code/name, date, or description; case-insensitive |
| `customer_id` | number | no | only this customer's deposits — used by the Invoice Penjualan payment picker |
| `has_balance` | number | no | `1` = only deposits with `remaining > 0` |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`used` / `remaining` / `last_invoice_number` are computed per row from the usage rows, so they are always current.
Each row carries `locked` ([conventions](../conventions.md#closing-period-lock-locked)).

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "number": "TSC.RIN/260903/001", "date": "2026-09-03", "locked": false,
      "department_id": 9, "department_code": "SLS", "department_name": "Sales",
      "customer_id": 1, "customer_code": "CUST-0001", "customer_name": "PT Samudra Edukasi Raya",
      "amount": 50000000, "used": 30000000, "remaining": 20000000,
      "last_invoice_number": "INV-2609-0007",
      "description": "TITIPAN PEMBELIAN PAKET BUKU SEMESTER GANJIL",
      "cash_account_id": 17, "cash_account_code": "1001302", "cash_account_name": "Bank CIMB Niaga - 9200 (IDR)",
      "cash_flow": "OPERASI_IN", "cash_flow_name": "Operasi In",
      "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 4, "last_page": 1 }
}
```
