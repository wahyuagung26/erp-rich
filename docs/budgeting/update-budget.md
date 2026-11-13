---
type: OKF Endpoint
title: Update Budget
method: PUT
path: /budgeting/budgets/:id
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Update Budget

Replace description and lines of a Draft or Ditolak budget. Department and year are immutable. Validate as on creation; return {data}.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
