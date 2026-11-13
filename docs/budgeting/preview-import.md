---
type: OKF Endpoint
title: Preview Multi-Department Import
method: POST
path: /budgeting/import/preview
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Preview Multi-Department Import

Body `{year, departments: [{department_code, lines}]}`. Validate the entire batch without writing. Return `{data: {departments: [{department_code, department_name, action, number?, errors: string[]}], valid}}`. Draft or rejected budgets may be replaced; submitted or approved budgets cannot. Codes must be unique across the resulting batch and all other non-cancelled budgets. All departments and accounts must belong to the active company and be accessible to the caller. `action` is `create`, `replace`, or `reject`. See [Budgeting](./index.md).
