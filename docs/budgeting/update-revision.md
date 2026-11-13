---
type: OKF Endpoint
title: Update Revision
method: PUT
path: /budgeting/revisions/:id
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Update Revision

Replace description and lines for a Draft or Ditolak revision during an open revision period. Original line identity and locked months cannot change.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
