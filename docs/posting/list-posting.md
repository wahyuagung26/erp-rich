---
type: API Endpoint
title: List Posting Runs
description: Latest posting run per period for the active company.
method: GET
path: /posting
status: mock
tags: [posting, read]
resource: /frontend/src/mocks/modules/posting.ts
timestamp: 2026-11-05T22:00:00Z
---

# List Posting Runs

Backs the **Posting** tab (`TabPosting.vue`): the run history table.

## Response

`200`: `{ "data": PostingRun[] }` — newest period first (see [index](./index.md#postingrun)). Not paginated in the prototype.

## Notes

- Company-scoped via `X-Company-Id`.
