---
type: OKF Endpoint
title: List Accounts
method: GET
path: /budgeting/accounts
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# List Accounts

Paginated eligible account template, filtered by q. Each item has id, code, name, section, prefix and sign. OPEX uses report schema; CAPEX uses company asset-account mappings only. The mock adds illustrative P&L sections and an asset mapping to the demo company; these are not live account configuration.

See [Budgeting](./index.md) and [conventions](../conventions.md). Validation failures use `422 {message, errors?}`; unauthorized or inaccessible documents return 404. All amounts are numeric, never formatted strings.
