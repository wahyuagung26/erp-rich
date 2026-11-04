---
type: API Endpoint
title: Get Closing Status
description: Closing boundary, closing/re-open history and pending re-post for the active company.
method: GET
path: /posting/closing
status: mock
tags: [closing, read]
resource: /frontend/src/mocks/modules/posting.ts
timestamp: 2026-11-05T22:00:00Z
---

# Get Closing Status

Backs the **Closing Bulanan** tab: month timeline, action buttons, riwayat closing/reopen, and the "perlu re-posting" checklist.

## Response

`200`: `{ "data": ClosingStatus }` — see [index](./index.md#closingstatus).

## Notes

- `history` and `reopen_history` are capped to the 10 newest entries in the prototype.
- Company-scoped via `X-Company-Id`.
