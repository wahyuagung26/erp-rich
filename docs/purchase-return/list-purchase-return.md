---
type: API Endpoint
title: List Purchase Return
description: Paginated, filterable list of purchase returns with KPI summary.
method: GET
path: /purchase-return
status: mock
tags: [purchase-return, read, list]
resource: /frontend/src/mocks/modules/purchase-return.ts
timestamp: 2026-11-05T12:00:00Z
---

# List Purchase Return

Backs `views/purchase-return/pages/PagePurchaseReturnTable.vue` (via `useTableList`) and the "Retur" picker of the Hutang Supplier payment form.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `date`, `number`, `total` |
| `q` | string | no | matches `number`, invoice number, supplier invoice number, supplier code/name, `reason` |
| `approval_status` | string | no | `pending` \| `approved` |
| `settlement_status` | string | no | `open` \| `settled` |
| `supplier_id` | number | no | |
| `date_from` `date_to` | string | no | `YYYY-MM-DD`, inclusive |

## Response

`200`: `{ "data": [ { ...PurchaseReturn } ], "meta": { ..., "summary": { ... } } }`

`meta.summary` (see [KPI summary](../conventions.md#list-kpi-summary-optional-metasummary)); tiles ignore `approval_status` / `settlement_status`:

| Key | Matches | `amount` |
|---|---|---|
| `pending` | `approval_status = pending` | sum of `remaining_total` |
| `open` | `approved` and `settlement_status = open` | sum of `remaining_total` |
| `settled` | `settlement_status = settled` | — |

## Errors

Standard only (`401`).
