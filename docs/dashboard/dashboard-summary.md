---
type: API Endpoint
title: Dashboard Summary
description: KPI figures and the most recent journal entries for the current period.
method: GET
path: /dashboard/summary
status: mock
tags: [dashboard, read]
resource: /frontend/src/mocks/modules/dashboard.ts
timestamp: 2026-09-03T00:00:00Z
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
    "kas_bank": 128450000,
    "piutang": 54200000,
    "utang": 71800000,
    "laba_bulan": 39650000,
    "posting_bulan_ini": 5,
    "nilai_transaksi": 101550000,
    "jurnal_terakhir": [ /* up to 5 Jurnal objects, see jurnal/list-jurnal.md */ ]
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `kas_bank` | number | total cash + bank balance |
| `piutang` | number | accounts receivable |
| `utang` | number | accounts payable |
| `laba_bulan` | number | period profit/loss |
| `posting_bulan_ini` | number | journal entries posted this period |
| `nilai_transaksi` | number | sum of journal totals this period |
| `jurnal_terakhir` | `Jurnal[]` | latest 5, newest first |

## Notes

- Mock returns fixed figures except `posting_bulan_ini`, `nilai_transaksi`, and
  `jurnal_terakhir`, which derive from the live journal store. Backend computes
  all fields from ledger data.
