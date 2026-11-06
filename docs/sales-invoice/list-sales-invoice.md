---
type: API Endpoint
title: List Sales Invoice
description: Paginated, filterable, sortable list of sales invoices with KPI tile summary.
method: GET
path: /sales-invoice
status: mock
tags: [sales-invoice, read, list]
resource: /frontend/src/mocks/modules/sales-invoice.ts
timestamp: 2026-11-06T16:00:00Z
---

# List Sales Invoice

Backs `views/sales-invoice/pages/PageSalesInvoiceTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints) |
| `q` | string | no | matches number, sales order number, customer code/name, sales name, description; case-insensitive |
| `approval_status` | string | no | `pending`, `approved`, or `rejected` |
| `payment_status` | string | no | `open` = Belum Lunas (`outstanding > 0`), `paid` = Lunas (`outstanding ≤ 0`) |
| `tax_invoice` | string | no | `missing` = PKP invoice without a faktur pajak; `filled` = has one |
| `customer_id` | number | no | only this customer's invoices (used by Piutang Customer / Retur pickers) |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

`sort_by` accepts `date`, `number`, `customer_name`, `total`, `outstanding`, `due_date`.

## KPI tiles (`meta.summary`)

| Key | Tile | Filter it sets | Counts rows where | Carries |
|---|---|---|---|---|
| `pending` | Menunggu Persetujuan | `approval_status=pending` | `approval_status = pending` | `count`, `amount` (sum of `total`) |
| `outstanding` | Belum Lunas | `approval_status=approved`, `payment_status=open` | approved and `outstanding > 0` | `count`, `amount` (sum of `outstanding`) |
| `tax_missing` | Belum Ada Faktur Pajak | `tax_invoice=missing` | PKP and no faktur pajak yet | `count` |
| `rejected` | Ditolak | `approval_status=rejected` | `approval_status = rejected` | `count`, `amount` |

See [conventions](../conventions.md#list-kpi-summary-optional-metasummary).

## Response

`200`: `{ "data": [ ...SalesInvoice ], "meta": { "page", "per_page", "total", "last_page", "summary" } }` — rows are the full resolved
[`SalesInvoice`](./get-sales-invoice.md) (including `locked`, `payments`, `paid_total`, `outstanding`, `payment_status`).

## Errors

Standard only (`401`).

## Notes

- Default UI sorting is date descending.
- Edit and delete (row menu) are shown only while the invoice is not approved and not `locked`.
