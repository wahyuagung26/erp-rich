---
type: API Endpoint
title: Close Period
description: Close the next period (sequential) and snapshot its totals.
method: POST
path: /posting/closing
status: mock
tags: [closing, write]
resource: /frontend/src/mocks/modules/posting.ts
timestamp: 2026-11-05T22:00:00Z
---

# Close Period

## Request

```json
{ "period": "2026-08" }
```

| Field | Type | Rules |
|---|---|---|
| `period` | string | required; must equal `next_period` |

## Response

`201`: `{ "data": ClosingHistory, "message": "Periode ... ditutup" }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `period` ≠ `next_period` | `{ "message": "Validasi gagal", "errors": { "period": ["..."] } }` |
| `422` | period not started yet | `{ "message": "Periode ... belum berjalan" }` |
| `422` | a re-opened period is not re-posted yet | `{ "message": "Posting ulang periode ... terlebih dahulu" }` |

## Notes

- Does **not** require a passing reconciliation (advisory only); the UI asks for confirmation when a check failed.
- Snapshots `total_debit`, `total_credit`, `profit` into `history` at the time of closing.
- Closing a re-opened period again follows the normal rules — not tied to who re-opened it.
