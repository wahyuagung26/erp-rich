---
type: OKF Endpoint
title: Create Revision
method: POST
path: /budgeting/revisions
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Create Revision

Body {budget_id, description, lines}; create Draft for an approved budget during an open revision period, applying locked months and uniqueness guards.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
