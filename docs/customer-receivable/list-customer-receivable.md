---
type: API Endpoint
title: List Customer Receivable
description: Paginated, filterable list of customer receivables (approved sales invoices) with KPI summary.
method: GET
path: /customer-receivable
status: mock
tags: [customer-receivable, read, list]
resource: /frontend/src/mocks/modules/customer-receivable.ts
timestamp: 2026-11-06T18:00:00Z
---

# List Customer Receivable

Backs `views/customer-receivable/pages/PageCustomerReceivableTable.vue` (via `useTableList`). Only invoices with `approval_status = approved` are listed.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `date`, `due_date`, `number`, `total`, `outstanding` |
| `q` | string | no | matches `number`, customer code/name, `description`, `sales_name` |
| `status` | string | no | `open` (unpaid + partial, "Belum Lunas") \| `unpaid` \| `partial` \| `paid` |
| `due` | string | no | `overdue` (Jatuh Tempo: `outstanding > 0` dan `due_date` sebelum hari ini) |
| `customer_id` | number | no | |
| `date_field` | string | no | which date `date_from` / `date_to` filter on: `date` (Tanggal Invoice, the default) \| `due_date` (Jatuh Tempo) |
| `date_from` `date_to` | string | no | `YYYY-MM-DD`, inclusive, on the field chosen by `date_field` |

## Response

`200`: `{ "data": [ { ...CustomerReceivable } ], "meta": { ..., "summary": { ... } } }`

`meta.summary` (tiles ignore `status` / `due`):

| Key | Matches | `amount` |
|---|---|---|
| `open` | `status ≠ paid` | sum of `outstanding` |
| `overdue` | `overdue = true` | sum of `outstanding` |
| `paid` | `status = paid` | — |

## Errors

Standard only (`401`).

## Notes

- The page opens with `status=open` (Belum Lunas) pre-selected; the "Belum Lunas" tile is active by default.
