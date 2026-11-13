---
type: API Endpoint
title: Get Cash Position Difference
description: Documents whose cash/bank balance differs from the Laporan Arus Kas — the breakdown behind the "Selisih" of the cash position report.
method: GET
path: /cash-position/difference
status: mock
tags: [report, cash, bank, read]
resource: /frontend/src/mocks/modules/cash-position.ts
timestamp: 2026-11-13T11:00:00Z
---

# Get Cash Position Difference

Backs the "Selisih" popup of `views/cash-position/pages/PageCashPosition.vue`. See [get-cash-position](./get-cash-position.md)
for how `difference` is defined.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | sent automatically; see [conventions](../conventions.md#company-scoping) |

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `date_to` | string | no | `YYYY-MM-DD`; defaults to today. Same value the report was loaded with |

## Response

`200`:

```json
{
  "data": {
    "date_to": "2026-09-08",
    "groups": [
      { "key": "untagged_journal", "label": "Jurnal dengan akun kas tanpa tag arus kas",
        "action": "Beri tag arus kas pada akun kas/bank tersebut, atau setujui pasangan jurnal pindah bukunya." }
    ],
    "rows": [
      { "group": "untagged_journal", "source": "journal", "source_label": "Jurnal Umum", "id": 12, "number": "JU-2026-0012",
        "date": "2026-08-30", "saldo_kas": 2800000, "arus_kas": 0, "selisih": 2800000,
        "cause": "Akun kas tanpa tag arus kas: Bank BCA" }
    ],
    "total": { "saldo_kas": 2800000, "arus_kas": 0, "selisih": 2800000 }
  }
}
```

`source` is `journal` | `journal-income` | `journal-expense`; the UI links a row to `/<source>/:id`.

## Notes

- One row per document (not per line), only approved documents dated ≤ `date_to` whose `selisih ≠ 0`.
- `saldo_kas` = Σ(debit − credit) of the document's cash/bank lines (what the account balances count). `arus_kas` = the part of
  that carrying an Arus Kas code (what the Laporan Arus Kas counts). `selisih = saldo_kas − arus_kas`.
- `total.selisih` always equals the report's `difference` ([get-cash-position](./get-cash-position.md)).
- `group` is a `groups[].key` or `null`. Rows of a group render under a collapsible header (`label`, row count, Σ`selisih`, `action`);
  `null` rows are standalone. Order: `null` rows first, then groups; inside, by `date` ascending then `number`.
- `cause` is plain-language Bahasa Indonesia, shown in the "Penyebab" column.
- Only cause `untagged_journal` is produced for now (cash line without an Arus Kas code). Other causes (reversed tag direction,
  not yet posted) have no mock data and are added as new `group`/`cause` values when the backend models them.
- Empty `rows`/`groups` and zero `total` when the company has not resolved yet (no `X-Company-Id`) or nothing differs.
