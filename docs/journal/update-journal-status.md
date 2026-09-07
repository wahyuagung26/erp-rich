---
type: API Endpoint
title: Update Journal Status
description: Move a manual journal through its approval workflow.
method: PATCH
path: /journal/:id/status
status: mock
tags: [journal, approval, write]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-09-07T14:00:00Z
---

# Update Journal Status

## Request

```json
{ "status": "approved", "date": "2026-08-01" }
```

| Field | Type | Rules |
|---|---|---|
| `status` | enum | `submitted → approved/rejected`, `rejected → submitted` |
| `date` | string | optional, only on `status: approved` — `YYYY-MM-DD`; overrides the journal date at approval time |

## Response

`200`: `{ "data": Journal, "message": "..." }`

## Notes

- `approved` is terminal in the prototype.
- Approving stamps `approved_by` (current user's name) and `approved_at` (now), and applies `date` if sent.
- Rejecting sets a prototype rejection message; a rejected journal can be submitted again, which clears `approved_by` / `approved_at`.
