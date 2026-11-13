---
type: OKF Endpoint
title: Update Period
method: PUT
path: /budgeting/period
status: mock
resource: budgeting
timestamp: 2026-11-13T12:00:00Z
---

# Update Period

Body {start_date, end_date, is_active}; schedule current-year period, with a changed start not before today and end not before start; is_open also requires today within range. Saving a schedule from the form sends `is_active: true`; the on/off switch resends the stored dates with only `is_active` flipped (allowed even when the stored start is already past). Return {data}.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
