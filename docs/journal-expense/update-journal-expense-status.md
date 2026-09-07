---
type: API Endpoint
title: Update Journal Expense Status
description: Move a cash disbursement journal through its approval workflow.
method: PATCH
path: /journal-expense/:id/status
status: mock
tags: [journal, expense, approval, write]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-09-07T16:00:00Z
---

# Update Journal Expense Status

Identical semantics to [update-journal-status](../journal/update-journal-status.md).

## Request

```json
{ "status": "approved", "date": "2026-08-02" }
```

| Field | Type | Rules |
|---|---|---|
| `status` | enum | `submitted → approved/rejected`, `rejected → submitted` |
| `date` | string | optional, only on `status: approved` — `YYYY-MM-DD`; overrides the journal date at approval time |

## Response

`200`: `{ "data": JournalExpense, "message": "..." }`

## Notes

- `approved` is terminal in the prototype.
- Approving stamps `approved_by` (current user's name) and `approved_at` (now), and applies `date` if sent.
- Rejecting sets a prototype rejection message; a rejected journal can be submitted again, which clears `approved_by` / `approved_at`.
- Bulk approve on the list page calls this endpoint once per selected id, without `date`.
