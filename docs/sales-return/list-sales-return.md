---
type: API Endpoint
title: List Sales Return
description: Paginated, filterable list of sales returns with KPI summary.
method: GET
path: /sales-return
status: mock
tags: [sales-return, read, list]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# List Sales Return

Backs `views/sales-return/pages/PageSalesReturnTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `date`, `number`, `total` |
| `q` | string | no | matches `number`, invoice number, customer code/name, `reason` |
| `approval_status` | string | no | `pending` \| `approved` \| `rejected` |
| `settlement_status` | string | no | `open` \| `settled` |
| `customer_id` | number | no | |
| `date_from` `date_to` | string | no | `YYYY-MM-DD`, inclusive |

## Response

`200`: `{ "data": [ { ...SalesReturn } ], "meta": { ..., "summary": { ... } } }`

`meta.summary` (see [KPI summary](../conventions.md#list-kpi-summary-optional-metasummary)); tiles ignore `approval_status` / `settlement_status`:

| Key | Matches | `amount` |
|---|---|---|
| `pending` | `approval_status = pending` | sum of `remaining_total` |
| `open` | `approved` and `settlement_status = open` | sum of `remaining_total` |
| `settled` | `settlement_status = settled` | — |
| `rejected` | `approval_status = rejected` | — |

## Errors

Standard only (`401`).
