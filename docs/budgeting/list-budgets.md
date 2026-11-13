---
type: OKF Endpoint
title: List Budgets
method: GET
path: /budgeting/budgets
status: mock
resource: budgeting
timestamp: 2026-11-13T12:00:00Z
---

# List Budgets

List annual budgets using q, year, department_id, status, revision, page, per_page, sort_by, sort_order; returns the standard paginated envelope. Cancelled (`Dibatalkan`) budgets never appear. `revision=none` keeps only budgets without a non-cancelled revision (candidates for a new revision).

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
