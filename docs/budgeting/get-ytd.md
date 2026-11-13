---
type: OKF Endpoint
title: Get Current Year YTD
method: GET
path: /budgeting/ytd
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Get Current Year YTD

Query `department_id` as an accessible department id or `all` with all-department authorization. Return `{data: {year, through_month, values}}`, where `values` maps account code to realization from January through the last completed month in the current year. Values are live journal aggregates, not detail-level values; approved document views use their frozen snapshot instead. Mock values are illustrative. See [Budgeting](./index.md) and [conventions](../conventions.md).
