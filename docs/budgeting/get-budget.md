---
type: OKF Endpoint
title: Get Budget
method: GET
path: /budgeting/budgets/:id
status: mock
resource: budgeting
timestamp: 2026-11-13T12:00:00Z
---

# Get Budget

Return one budget in {data}; 404 if absent or outside active company / accessible departments. Also carries `revisions: [{id, number, status}]`, every revision of this budget including cancelled ones.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
