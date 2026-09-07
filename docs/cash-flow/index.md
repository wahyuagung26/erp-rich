---
type: OKF Module
title: Cash Flow
description: Read-only cash-flow master data used by manual journal detail dropdowns.
tags: [cash-flow, master-data, journal]
timestamp: 2026-09-07T10:00:00Z
---

# Cash Flow

## Entity: `CashFlow`

| Field | Type | Notes |
|---|---|---|
| `id` | string | same as `code` |
| `code` | string | source code, e.g. `OPERASI_IN` |
| `name` | string | display name |
| `group` | enum | `OPERASI`, `INVESTASI`, or `PENDANAAN` |
| `position` | enum | `IN`, `OUT`, or `INOUT` |

## Endpoint

| Method | Path | Notes |
|---|---|---|
| GET | `/cash-flow` | paginated; supports `q`, `page`, `per_page`, `sort_by`, and `sort_order` |

The journal form uses this endpoint as the searchable source for the `Arus Kas`
dropdown and submits `code` into `lines[].cash_flow`.
