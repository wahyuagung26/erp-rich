---
type: OKF Endpoint
title: Recalculate Realization
method: POST
path: /budgeting/realization/recalculate
status: mock
resource: budgeting
timestamp: 2026-11-13T12:00:00Z
---

# Recalculate Realization

Body {year, month}. Rebuilds the realization cache for the reference month and the two months before it (January wraps into the previous year), so backdated or adjusted journals are picked up. Return {data:{recalculated:[{year, month}]}}, oldest month first. The mock only returns the months; it does not read a ledger.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
