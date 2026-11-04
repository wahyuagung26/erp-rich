---
type: API Endpoint
title: Run Posting
description: Post one period (placeholder — no job breakdown yet).
method: POST
path: /posting
status: mock
tags: [posting, write]
resource: /frontend/src/mocks/modules/posting.ts
timestamp: 2026-11-05T22:00:00Z
---

# Run Posting

Called by the **Posting** tab's "Posting Periode" button.

## Request

```json
{ "period": "2026-08" }
```

| Field | Type | Rules |
|---|---|---|
| `period` | string | `YYYY-MM`, required, not in the future, and `> closed_until` (unlocked) |

## Response

`201`: `{ "data": PostingRun, "message": "Posting periode ... selesai" }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | invalid / future period | `{ "message": "Validasi gagal", "errors": { "period": ["..."] } }` |
| `422` | period is locked by closing | `{ "message": "Periode ... sudah ditutup" }` |

## Notes

- Posting a period listed in `repost_pending` flips its `posted` to `true` (see [get-closing-status](./get-closing-status.md)).
- Re-posting an already posted period replaces its `PostingRun`.
