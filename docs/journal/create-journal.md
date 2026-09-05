---
type: API Endpoint
title: Create Journal
description: Post a balanced journal entry.
method: POST
path: /journal
status: mock
tags: [journal, write]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-09-05T10:00:00Z
---

# Create Journal

Backs `views/journal/components/FormJournalLines.vue`. The form blocks submit until
`sum(debit) === sum(credit)` and every line has an account + one non-zero side —
the backend must re-check.

## Request

### Body

```json
{
  "date": "2026-09-03",
  "description": "Pembayaran gaji September",
  "lines": [
    { "account_id": 2, "debit": 1200000, "credit": 0 },
    { "account_id": 1, "debit": 0, "credit": 1200000 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `description` | string | required |
| `lines` | array | ≥ 2 items |
| `lines[].account_id` | number | required; must be a non-deleted [`Account`](../account/index.md) |
| `lines[].debit` / `.credit` | number | ≥ 0; exactly one > 0 per line |

Server rejects unless `sum(debit) === sum(credit)` and `> 0`.

## Response

`201`:

```json
{
  "data": {
    "id": 6, "number": "JU-2609-001", "date": "2026-09-03",
    "description": "Pembayaran gaji September", "total": 1200000,
    "lines": [
      { "account_id": 2, "account_code": "6000101", "account_name": "Beban Gaji Pokok", "debit": 1200000, "credit": 0 },
      { "account_id": 1, "account_code": "1000101", "account_name": "Kas Kecil", "debit": 0, "credit": 1200000 }
    ]
  },
  "message": "Jurnal disimpan"
}
```

`number` and `total` are server-assigned; `account_code` / `account_name` are resolved server-side.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | not balanced / bad line / unknown `account_id` | `{ "message": "Jurnal tidak seimbang", "errors": { "lines": ["Total debit dan kredit harus sama"] } }` |

## Notes

- Both mock and backend resolve `account_code` / `account_name` from `account_id`; the
  client only sends `account_id`.
