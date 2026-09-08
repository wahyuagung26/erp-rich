---
type: API Endpoint
title: Update Cash Advance Status
description: Move an operational cash advance through its approval workflow.
method: PATCH
path: /cash-advance/:id/status
status: mock
tags: [cash-advance, approval, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Update Cash Advance Status

Identical semantics to [update-journal-expense-status](../journal-expense/update-journal-expense-status.md).

## Request

```json
{ "status": "approved", "date": "2026-08-04" }
```

| Field | Type | Rules |
|---|---|---|
| `status` | enum | `submitted → approved/rejected`, `rejected → submitted` |
| `date` | string | optional, only on `status: approved` — `YYYY-MM-DD`; overrides the advance date at approval time |

## Response

`200`: `{ "data": CashAdvance, "message": "..." }`

## Notes

- `approved` is terminal in the prototype.
- Approving stamps `approved_by` (current user's name) and `approved_at` (now), and applies `date` if sent.
- Rejecting sets a prototype rejection message; a rejected advance can be submitted again, which clears `approved_by` / `approved_at`.
