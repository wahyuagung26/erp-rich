---
type: API Endpoint
title: Get Cash Position
description: Cash & bank position for the active company over a date range.
method: GET
path: /cash-position
status: mock
tags: [report, cash, bank, read]
resource: /frontend/src/mocks/modules/cash-position.ts
timestamp: 2026-11-05T12:00:00Z
---

# Get Cash Position

Backs `views/cash-position/pages/PageCashPosition.vue`.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | sent automatically; see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `date_from` | string | no | `YYYY-MM-DD`; defaults to today |
| `date_to` | string | no | `YYYY-MM-DD`; defaults to `date_from`; swapped if earlier than `date_from` |

## Response

`200`:

```json
{
  "data": {
    "date_from": "2026-09-08",
    "date_to": "2026-09-08",
    "rows": [
      { "account_id": 1, "account_code": "1000101", "account_name": "Kas Kecil Operasional",
        "opening": 6000000, "cash_in": 3500000, "cash_out": 1200000, "closing": 8300000 },
      { "account_id": 10, "account_code": "1000105", "account_name": "Kas Besar",
        "opening": 0, "cash_in": 0, "cash_out": 0, "closing": 0 }
    ],
    "total": { "opening": 43000000, "cash_in": 23500000, "cash_out": 3700000, "closing": 62800000 },
    "cash_flow_closing": 60000000,
    "difference": 2800000
  }
}
```

Returns `{ "data": { "date_from": …, "date_to": …, "rows": [], "total": { … zeros } } }` when the
active company has not resolved yet (no `X-Company-Id`).

## Notes

- `rows` includes every `cash_bank` account even at zero.
- Only `approved` journals contribute; `submitted` / `rejected` are ignored.
- `cash_flow_closing` — cumulative Σ(debit − credit) of approved cash/bank movements dated ≤ `date_to` that carry an Arus Kas code (`cash_flow`). Movements without one (e.g. Jurnal Umum lines left untagged) count in `closing` but not here.
- `difference` = `total.closing − cash_flow_closing`; non-zero means some cash movements are missing an Arus Kas code.
- The report is recomputed on every request — there is no snapshot table.
