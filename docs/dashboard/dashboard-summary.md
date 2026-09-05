---
type: API Endpoint
title: Dashboard Summary
description: KPI figures and the most recent journal entries for the current period.
method: GET
path: /dashboard/summary
status: mock
tags: [dashboard, read]
resource: /frontend/src/mocks/modules/dashboard.ts
timestamp: 2026-09-05T00:00:00Z
---

# Dashboard Summary

Backs the stat tiles and the "Jurnal Terakhir" table on the dashboard.

## Request

No params. (Future: `period=YYYY-MM`.)

## Response

`200`:

```json
{
  "data": {
    "cash_bank": 128450000,
    "receivables": 54200000,
    "payables": 71800000,
    "period_profit": 39650000,
    "journal_entries_this_period": 5,
    "transaction_value": 101550000,
    "recent_journals": [ /* up to 5 Journal objects, see journal/list-journal.md */ ]
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `cash_bank` | number | total cash + bank balance |
| `receivables` | number | accounts receivable |
| `payables` | number | accounts payable |
| `period_profit` | number | period profit/loss |
| `journal_entries_this_period` | number | journal entries posted this period |
| `transaction_value` | number | sum of journal totals this period |
| `recent_journals` | `Journal[]` | latest 5, newest first |

## Notes

- Mock returns fixed figures except `journal_entries_this_period`,
  `transaction_value`, and `recent_journals`, which derive from the live
  journal store. Backend computes all fields from ledger data.
