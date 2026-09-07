---
type: API Endpoint
title: Create Journal
description: Create a balanced manual journal entry and submit it for approval.
method: POST
path: /journal
status: mock
tags: [journal, write]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-09-07T14:00:00Z
---

# Create Journal

Backs `views/journal/components/FormJournalLines.vue`. The form blocks submit until
`sum(debit) === sum(credit)` and every line has an account + one non-zero side —
the backend must re-check. A new entry is submitted for approval immediately.

## Request

### Body

```json
{
  "number": "",
  "date": "2026-09-03",
  "voucher": "VCR-2609-001",
  "description": "Pembayaran gaji September",
  "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 12345, "data_url": "data:application/pdf;base64,..." },
  "lines": [
    { "account_id": 2, "department_id": 1, "cash_flow": null, "detail_description": "", "debit": 1200000, "credit": 0 },
    { "account_id": 1, "department_id": null, "cash_flow": "OPERASI_IN", "detail_description": "", "debit": 0, "credit": 1200000 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `number` | string | no; blank means server-generated |
| `voucher` | string | required; free text |
| `description` | string | required |
| `attachment` | object | required; one PDF/JPG/PNG, max 5 MB |
| `lines` | array | ≥ 1 item |
| `lines[].account_id` | number | required; must be a non-deleted [`Account`](../account/index.md) |
| `lines[].department_id` | number \| null | optional active [`Department`](../department/index.md) |
| `lines[].cash_flow` | string \| null | cash-flow code from [`CashFlow`](../cash-flow/index.md); required for `cash_bank` accounts |
| `lines[].detail_description` | string | optional |
| `lines[].debit` / `.credit` | number | ≥ 0; exactly one > 0 per line |

Server rejects unless `sum(debit) === sum(credit)` and `> 0`.

## Response

`201`:

```json
{
  "data": {
    "id": 6, "number": "JU-2609-001", "date": "2026-09-03",
    "description": "Pembayaran gaji September", "status": "submitted",
    "rejection_reason": null, "approved_by": null, "approved_at": null, "total": 1200000,
    "lines": [
      { "account_id": 2, "account_code": "6000101", "account_name": "Beban Gaji Pokok", "debit": 1200000, "credit": 0 },
      { "account_id": 1, "account_code": "1000101", "account_name": "Kas Kecil", "debit": 0, "credit": 1200000 }
    ]
  },
  "message": "Jurnal diajukan"
}
```

`number` (when blank) and `total` are server-assigned; `account_code` / `account_name` are resolved server-side.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | not balanced / bad line / unknown `account_id` | `{ "message": "Jurnal tidak seimbang", "errors": { "lines": ["Total debit dan kredit harus sama"] } }` |

## Notes

- Both mock and backend resolve `account_code` / `account_name` from `account_id`; the
  client only sends `account_id`.
