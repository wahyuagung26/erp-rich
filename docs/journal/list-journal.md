---
type: API Endpoint
title: List Journal
description: Paginated, searchable, sortable list of journal entries.
method: GET
path: /journal
status: mock
tags: [journal, read, list]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-11-06T04:00:00Z
---

# List Journal

Backs `views/journal/pages/PageJournalTable.vue` and the "Jurnal Terakhir" table
on the dashboard (first 5, see [dashboard-summary](../dashboard/dashboard-summary.md)).

## Request

### Query

| Name                                        | Type   | Required | Notes                                         |
| ------------------------------------------- | ------ | -------- | --------------------------------------------- |
| `page`, `per_page`, `sort_by`, `sort_order` | —      | no       | `sort_by` accepts `date`, `total`             |
| `q`                                         | string | no       | matches `number` + `voucher` + `description`  |
| `status`                                    | enum   | no       | `submitted` / `approved` / `rejected`         |
| `date_from`                                 | string | no       | `YYYY-MM-DD`, inclusive lower bound on `date` |
| `date_to`                                   | string | no       | `YYYY-MM-DD`, inclusive upper bound on `date` |

## KPI tiles (`meta.summary`)

| Key | Tile | Filter it sets | Counts rows where | Carries |
|---|---|---|---|---|
| `pending` | Menunggu Persetujuan | `status=submitted` | `status = submitted` | `count`, `amount` (sum of `total`) |
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
      "date": "2026-08-01",
      "number": "JU-2608-001",
      "voucher": "VCR-2608-001",
      "created_by": "Sri Wahyuni", "created_at": "2026-08-04T08:30:00+07:00",
      "description": "Pembayaran sewa kantor Agustus",
      "status": "submitted",
      "rejection_reason": null,
      "approved_by": null,
      "approved_at": null,
      "total": 15000000,
      "lines": [
        {
          "account_id": 15,
          "account_code": "6-6100",
          "account_name": "Beban Sewa",
          "debit": 15000000,
          "credit": 0
        },
        {
          "account_id": 2,
          "account_code": "1-1100",
          "account_name": "Bank BCA",
          "debit": 0,
          "credit": 15000000
        }
      ]
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 5, "last_page": 1 }
}
```

## Notes

- List rows include full `lines`; a future detail endpoint (`GET /journal/:id`)
  can replace that if payloads get large.
