---
type: OKF Endpoint
title: Action Budget
method: POST
path: /budgeting/budgets/:id/actions
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Action Budget

Body {action, note?}, action submit, approve, reject, cancel or unapprove. Reject requires note. Follow status guards and return {data}.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
