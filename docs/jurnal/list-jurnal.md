---
type: API Endpoint
title: List Jurnal
description: Paginated, searchable, sortable list of journal entries.
method: GET
path: /jurnal
status: mock
tags: [jurnal, read, list]
resource: /frontend/src/mocks/modules/jurnal.ts
timestamp: 2026-09-03T09:00:00Z
---

# List Jurnal

Backs `views/jurnal/pages/PageJurnalTable.vue` and the "Jurnal Terakhir" table
on the dashboard (first 5, see [dashboard-summary](../dashboard/dashboard-summary.md)).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | `sort_by` accepts `date`, `total` |
| `q` | string | no | matches `number` + `description` |

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "date": "2026-08-01", "number": "JU-2608-001",
      "description": "Pembayaran sewa kantor Agustus", "total": 15000000,
      "lines": [
        { "akun_id": 15, "akun_code": "6-6100", "akun_name": "Beban Sewa", "debit": 15000000, "credit": 0 },
        { "akun_id": 2, "akun_code": "1-1100", "akun_name": "Bank BCA", "debit": 0, "credit": 15000000 }
      ]
    }
  ],
  "meta": { "page": 1, "per_page": 10, "total": 5, "last_page": 1 }
}
```

## Notes

- List rows include full `lines`; a future detail endpoint (`GET /jurnal/:id`)
  can replace that if payloads get large.
