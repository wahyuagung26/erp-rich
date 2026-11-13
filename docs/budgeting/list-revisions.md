---
type: OKF Endpoint
title: List Revisions
method: GET
path: /budgeting/revisions
status: mock
resource: budgeting
timestamp: 2026-11-13T12:00:00Z
---

# List Revisions

List revisions with the same filters and envelope as list-budgets, except cancelled revisions are included and `revision` is ignored. Each row also carries `initial_total` (the parent budget's total) next to `total` (the revised total).

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
