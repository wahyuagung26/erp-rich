---
type: OKF Endpoint
title: Get Period
method: GET
path: /budgeting/period
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Get Period

Get current-year company revision period {data}: year, start_date, end_date, is_active, is_open, revision_month_start. An unconfigured period is closed.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
