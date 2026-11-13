---
type: OKF Endpoint
title: Get Realization
method: GET
path: /budgeting/realization
status: mock
resource: budgeting
timestamp: 2026-11-13T12:00:00Z
---

# Get Realization

Query year, department_id (a department id, `all`, or `0` for entries without a department) and show_unbudgeted; `0` always behaves as show_unbudgeted=1 because that bucket has no budget document. Return {data:{rows, year}}; Each row has `account_code`, `account_name`, `section`, `group` (`OPEX` or `CAPEX`), `sign`, and 12-value `budget` and `actual` arrays. Approved revision replaces original budget where applicable; when budget is zero, percentages use 100 as the denominator (the legacy convention). Account-level favorable variance is actual minus budget for revenue-like accounts, and budget minus actual for expenses and CAPEX; signed subtotals use actual minus budget. For YTD, sum through December for a prior year, through the last completed month for the current year, and zero months for a future year. Percentage colour (display only): revenue-like accounts above 100% are favourable and below 80% unfavourable, expense-like accounts the reverse, 80–100% is the middle band for both; CAPEX is not coloured; aggregate rows follow the sign of their net budget. Rows with zero budget and zero realization in every month are omitted.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
