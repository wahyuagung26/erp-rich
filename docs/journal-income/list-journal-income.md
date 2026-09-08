---
type: API Endpoint
title: List Journal Income
description: Paginated, searchable, sortable list of cash receipt journals.
method: GET
path: /journal-income
status: mock
tags: [journal, income, read, list]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-09-07T18:00:00Z
---

# List Journal Income

Backs `views/journal-income/pages/PageJournalIncomeTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | `sort_by` accepts `date`, `cash_in` |
| `q` | string | no | matches `number` + `voucher` + `description` |
| `status` | enum | no | `submitted` / `approved` / `rejected` |
| `date_from` | string | no | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to` | string | no | `YYYY-MM-DD`, inclusive upper bound on `date` |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "number": "JM-2608-001", "date": "2026-08-03",
      "voucher": "BKM-2608-001", "description": "Penerimaan pelunasan piutang customer",
      "cash_account_id": 2, "cash_account_code": "1-1100", "cash_account_name": "Bank BCA",
      "department_id": 1, "department_code": "FIN", "department_name": "Finance",
      "cash_flow": "OPERASI_IN", "cash_flow_name": "Operasi In",
      "status": "submitted", "rejection_reason": null, "approved_by": null, "approved_at": null,
      "total": 9000000, "cash_in": 9000000,
      "lines": [
        { "account_id": 5, "account_code": "4-4000", "account_name": "Penjualan Produk", "debit": 0, "credit": 9000000 }
      ]
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 4, "last_page": 1 }
}
```
