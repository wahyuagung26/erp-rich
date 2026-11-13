---
type: OKF Endpoint
title: Get Revision
method: GET
path: /budgeting/revisions/:id
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Get Revision

Return one revision in {data}; 404 if absent or outside scope.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
