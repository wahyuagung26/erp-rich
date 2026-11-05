---
type: API Endpoint
title: List Journal Expense
description: Paginated, searchable, sortable list of cash disbursement journals.
method: GET
path: /journal-expense
status: mock
tags: [journal, expense, read, list]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-11-06T06:00:00Z
---

# List Journal Expense

Backs `views/journal-expense/pages/PageJournalExpenseTable.vue` (via `useTableList`).

## Request

### Query

| Name                                        | Type   | Required | Notes                                         |
| ------------------------------------------- | ------ | -------- | --------------------------------------------- |
| `page`, `per_page`, `sort_by`, `sort_order` | —      | no       | `sort_by` accepts `date`, `cash_out`          |
| `q`                                         | string | no       | matches `number` + `voucher` + `description`  |
| `status`                                    | enum   | no       | `submitted` / `approved` / `rejected`         |
| `date_from`                                 | string | no       | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to`                                   | string | no       | `YYYY-MM-DD`, inclusive upper bound on `date` |

## KPI tiles (`meta.summary`)

| Key | Tile | Filter it sets | Counts rows where | Carries |
|---|---|---|---|---|
| `pending` | Menunggu Persetujuan | `status=submitted` | `status = submitted` | `count`, `amount` (sum of `cash_out`) |
| `approved` | Disetujui | `status=approved` | `status = approved` | `count`, `amount` |
| `rejected` | Ditolak | `status=rejected` | `status = rejected` | `count` |

See [conventions](../conventions.md#list-kpi-summary-optional-metasummary).

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1,
      "number": "JK-2608-001",
      "date": "2026-08-02",
      "voucher": "BKK-2608-001",
      "created_by": "Sri Wahyuni", "created_at": "2026-08-04T08:30:00+07:00",
      "description": "Pembayaran listrik & internet kantor",
      "cash_account_id": 2,
      "cash_account_code": "1-1100",
      "cash_account_name": "Bank BCA",
      "department_id": 1,
      "department_code": "FIN",
      "department_name": "Finance",
      "cash_flow": "OPERASI_OUT",
      "cash_flow_name": "Operasi — Keluar",
      "status": "submitted",
      "rejection_reason": null,
      "approved_by": null,
      "approved_at": null,
      "total": 3200000,
      "cash_out": 3200000,
      "lines": [
        {
          "account_id": 15,
          "account_code": "6-6200",
          "account_name": "Beban Utilitas",
          "debit": 3200000,
          "credit": 0
        }
      ]
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 4, "last_page": 1 }
}
```
