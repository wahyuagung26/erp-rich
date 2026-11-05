---
type: API Endpoint
title: List Supplier Payable
description: Paginated, filterable list of supplier payables with KPI summary.
method: GET
path: /supplier-payable
status: mock
tags: [supplier-payable, read, list]
resource: /frontend/src/mocks/modules/supplier-payable.ts
timestamp: 2026-11-05T12:00:00Z
---

# List Supplier Payable

Backs `views/supplier-payable/pages/PageSupplierPayableTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | see [conventions](../conventions.md#pagination-list-endpoints); `sort_by` accepts `date`, `due_date`, `number`, `total`, `remaining_total` |
| `q` | string | no | matches `number`, invoice numbers, supplier code/name, `description` |
| `status` | string | no | `open` (unpaid + partial) \| `unpaid` \| `partial` \| `paid` |
| `due` | string | no | `overdue` |
| `supplier_id` | number | no | |
| `date_from` `date_to` | string | no | `YYYY-MM-DD`, inclusive, on `date` |

## Response

`200`: `{ "data": [ { ...SupplierPayable } ], "meta": { ..., "summary": { ... } } }`

`meta.summary` (tiles ignore `status` / `due`):

| Key | Matches | `amount` |
|---|---|---|
| `open` | `status ≠ paid` | sum of `remaining_total` |
| `overdue` | `overdue = true` | sum of `remaining_total` |
| `paid` | `status = paid` | — |

## Errors

Standard only (`401`).
