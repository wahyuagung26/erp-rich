---
type: OKF Endpoint
title: Create Budget
method: POST
path: /budgeting/budgets
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Create Budget

Create a Draft with department_id, year, description and lines; return 201 {data}. Validate uniqueness, detail codes, accounts and monthly amounts.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
