---
type: API Endpoint
title: List Cash Advance
description: Paginated, searchable, sortable list of operational cash advances.
method: GET
path: /cash-advance
status: mock
tags: [cash-advance, read, list]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# List Cash Advance

Backs `views/cash-advance/pages/PageCashAdvanceTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | `sort_by` accepts `date`, `number`, `recipient`, `remaining` |
| `q` | string | no | matches `number` + `recipient` + `date` + `description` |
| `approved` | `true` \| `false` | no | `true` = `status = approved`; `false` = everything else |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "number": "UM-2608-001", "date": "2026-08-04",
      "department_id": 1, "department_code": "FIN", "department_name": "Finance",
      "recipient": "Budi Santoso", "description": "Uang muka perjalanan dinas Surabaya",
      "amount": 3000000, "used": 0, "remaining": 3000000,
      "cash_account_id": 1, "cash_account_code": "1000101", "cash_account_name": "Kas Kecil",
      "advance_account_id": 11, "advance_account_code": "1000106", "advance_account_name": "Uang Muka Operasional",
      "cash_flow": "OPERASI_OUT", "cash_flow_name": "Operasi Out",
      "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." },
      "status": "submitted", "rejection_reason": null, "approved_by": null, "approved_at": null
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 5, "last_page": 1 }
}
```
