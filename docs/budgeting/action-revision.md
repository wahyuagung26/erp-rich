---
type: OKF Endpoint
title: Action Revision
method: POST
path: /budgeting/revisions/:id/actions
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Action Revision

Body {action, note?}, action submit, approve, reject or cancel. Reject requires note. Return {data}.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
