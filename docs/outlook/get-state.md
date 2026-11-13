---
type: OKF Endpoint
title: Get Outlook State
method: GET
path: /outlook/state
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Get Outlook State

Whole state of the period for `year` + `month` of the active company. Called when the page opens and whenever the month/year selector changes.

Query: `year` (2000–2100), `month` (1–12) — both required, else `422 { message, errors }`.

`200 { "data": <State> }` — the full [State](./index.md#state-data-of-get-state-and-of-every-write) when the period exists, otherwise `{ "exists": false, "year", "month", "locked", "can_edit" }` (the UI then offers "Buat Periode"; `locked` is true when that month is already closed in Posting, so it cannot be created).

`can_edit` is the legacy `oledit` right (the demo user always has it). Without `X-Company-Id` the response is `exists: false` (see [conventions](../conventions.md)).

See [Outlook Daily](./index.md).
