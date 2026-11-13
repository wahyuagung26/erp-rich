---
type: OKF Module
title: Outlook Daily
description: Manual monthly cash-flow monitor — OL (target) vs actual per week/day, weekly resume, Lampiran, and a balance check against Saldo Kas/Bank.
tags: [outlook, forecasting, finance]
timestamp: 2026-11-13T15:00:00Z
---

# Outlook Daily

Port of the legacy `outlook` module (menu Outlook & Forecasting › Outlook Daily). Pure **manual entry**: nothing is pulled from transactions, no historical migration, Excel export only (no PDF). Every endpoint is company-scoped (`X-Company-Id`, see [conventions](../conventions.md)); there is one **period** per company + year + month.

## Period

A period always has **5 weeks**. Each week has **7 day columns** (`slots`); a column holds one date or is empty. A new period starts with every column empty — the user fills the dates (any date from 7 days before the month to 7 days after it; the same date may appear in several columns, each column keeps its own actual). Only **week 5, columns 5–7** may hold a *range* (`slots[i]` = first day, `ends[i]` = last day, at most 3 days) that counts as one column with one actual. An empty column cannot receive actual. `start_date`/`end_date` of a week are the smallest/largest dated column (null while the week has none).

The week-5 range rule is a legacy rule (FUSI-661); the 4-or-5-weeks decision of 2026-10-08 was superseded by the fixed 5 weeks of FUSI-663.

## Categories

Three levels at most, per flow (`CASH_IN` / `CASH_OUT`). A child inherits its parent's `flow_type`. **OL and actual exist only on leaf categories**; a category with children is a pure sum of its descendants. Adding the first child to a leaf deletes that leaf's own OL and actual (the response reports how many rows were reset). Deleting a category deletes all its descendants and their values. A new period has no categories — they come from [duplicate-period](./duplicate-period.md) or are added by hand.

## State (`data` of get-state and of every write)

Writes return the whole fresh state, so the UI always shows server-computed numbers. `calc` is computed by the server (the mock ports `Outlook_calculator`); the client never sends derived numbers. All arrays are **indexed by position in `weeks`** (week 1 = index 0); `slot` arrays have 7 items.

```json
{
  "exists": true,
  "can_edit": true,
  "period": { "id": 3, "year": 2026, "month": 11, "locked": false, "saldo_awal_bank": 125000000 },
  "weeks": [
    { "week_no": 1, "start_date": "2026-11-02", "end_date": "2026-11-08",
      "slots": ["2026-11-02", null, "…", null], "ends": [null, null, "…", null] }
  ],
  "calc": {
    "rows": [ { "id": 11, "parent_id": null, "flow_type": "CASH_IN", "name": "Penjualan Produk", "depth": 1, "is_leaf": true,
      "ol_week": [0, 0, 0, 0, 0], "actual_week": [0, 0, 0, 0, 0], "ach_week": [null, null, null, null, null],
      "actual_day": [[null, 0, 0, 0, 0, 0, 0], "…"], "ol_total": 0, "actual_total": 0, "ach_total": null } ],
    "totals": { "CASH_IN": "<agg>", "CASH_OUT": "<agg>", "SURPLUS": "<agg>" },
    "saldo_awal_set": true,
    "saldo_awal_row": { "total": 0, "ol_week": [], "actual_week": [], "actual_day": [[]] },
    "saldo_day": [[]], "saldo_week": [], "saldo_ol_week": [],
    "saldo_akhir": 0, "saldo_akhir_date": "2026-11-30",
    "rekon": { "date": "2026-11-30", "status": "balance", "outlook": 0, "bank": 0, "selisih": 0 },
    "resume": {
      "rows": [ { "id": 11, "parent_id": null, "flow_type": "CASH_IN", "name": "…", "depth": 1, "is_leaf": true,
        "target_mtd": [], "actual_mtd": [], "ach_mtd": [], "ol_week": [], "actual_week": [], "ach_week": [] } ],
      "totals": { "CASH_IN": "<resume agg>", "CASH_OUT": "<resume agg>", "SURPLUS": "<resume agg>" },
      "saldo": [],
      "saldo_awal": { "monthly": 0, "weeks": [ { "target_mtd": 0, "actual_mtd": 0, "ol_week": 0, "actual_week": 0 } ] }
    }
  },
  "lampiran": { "rows": [], "count": 0, "max": 500, "day_totals": {}, "total": 0 }
}
```

`<agg>` = `{ ol_week[], actual_week[], ach_week[], actual_day[][], ol_total, actual_total, ach_total }`; `<resume agg>` = the resume row without identity fields. `actual_day[w][slot]` is `null` for an empty column.

### Calculation rules (legacy-confirmed)

- Rows are ordered per flow, depth-first, by `sort_order`. Totals per flow = sum of the root rows; `SURPLUS` = Cash In − Cash Out (OL, actual per day/week/total).
- **Achievement** = `round(actual / OL × 100, 2)`, `null` when OL is 0 (shown as `-`, decision OD-07). UI colour bands (compared at 1 decimal): ≤ 80 low, < 100 middle, ≥ 100 high; Cash In low = red / middle = orange / high = green, **Cash Out reversed** (low = green, high = red).
- **Saldo** runs through the day columns in column order (week 1 slot 1 → week 5 slot 7; empty columns add nothing): `saldo_day` = running balance after that column; `saldo_week[w]` = balance after the week (an undated week carries the previous one); `saldo_ol_week[w]` = opening balance + cumulative OL surplus. `saldo_awal_row`: week 1 = month opening balance; later weeks = previous week's closing (OL and actual separately); each day column = the balance of the column to its left. An unset opening balance counts as 0 (`saldo_awal_set` false).
- **`saldo_akhir`** = opening + Total Cash In − Total Cash Out over **all dated columns** (including columns outside the month). `saldo_akhir_date` = last day of the period month.
- **`rekon`** compares `saldo_akhir` with the total Saldo Kas/Bank (Posisi Kas & Bank) on `saldo_akhir_date`, exact to the cent. `status`: `balance`, `tidak_balance`, `belum_diisi` (opening balance not set — cannot compare), `tidak_tersedia`. `selisih` = outlook − bank (null unless comparable). Display only; **Posting › Closing is rejected when it is not `balance`** (legacy `closing_gate`) — that gate is a Posting concern and is not mocked here.
- **Resume Weekly** is a read model of the same aggregates: `target_mtd`/`actual_mtd` are cumulative to that week, `ach_*` as above. Shows every category level. Its Saldo Awal row: monthly = month opening balance; per week `target_mtd = ol_week` = the week's OL opening, `actual_mtd = actual_week` = the week's actual opening. `saldo[w]` = `saldo_week[w]`.

## Closing-period lock

`period.locked` is true when the month is at or before Posting's `closed_until` ([conventions](../conventions.md#closing-period-lock-locked)). A locked period is **read-only**: create-period, update-column, update-opening-balance, create/update/delete-category, save-entry and the Lampiran writes are refused with `422 { "message": "Periode <bulan tahun> sudah closing, Outlook tidak bisa diubah" }`. [duplicate-period](./duplicate-period.md) still works **from** a locked period (source is only read) but refuses a locked **target**. Reading and Excel export stay allowed. The UI hides edit controls and shows `ClosingBadge`.

## Lampiran

Per-period manual list of unbudgeted spend: one row = keterangan, `sumber_dana` (`CASH_IN` / `CASH_OUT`) and an amount per day of the month (`hari`, day number → amount; zero/empty omitted). Information only — it never touches OL, actual, saldo or `rekon`. The vertical totals (`day_totals`, `total`) are **Cash In − Cash Out** (Cash Out rows count negative); a row's own `total` is the plain sum of what was typed. At most 500 rows per period.

## Excel

Export is a **snapshot of calculated values** (Daily + Resume Weekly + Lampiran, no formulas — decision OD-08). The prototype builds it in the browser from the loaded state; the real backend may serve it from a `GET` endpoint instead. There is no endpoint file for it.

## Endpoints

| Method | Path | Contract |
|---|---|---|
| GET | `/outlook/state` | [get-state](./get-state.md) |
| POST | `/outlook/periods` | [create-period](./create-period.md) |
| POST | `/outlook/periods/:id/duplicate` | [duplicate-period](./duplicate-period.md) |
| PUT | `/outlook/periods/:id/columns/:week_no/:slot` | [update-column](./update-column.md) |
| PUT | `/outlook/periods/:id/opening-balance` | [update-opening-balance](./update-opening-balance.md) |
| POST | `/outlook/periods/:id/categories` | [create-category](./create-category.md) |
| PUT | `/outlook/periods/:id/categories/:category_id` | [update-category](./update-category.md) |
| DELETE | `/outlook/periods/:id/categories/:category_id` | [delete-category](./delete-category.md) |
| PUT | `/outlook/periods/:id/entries` | [save-entry](./save-entry.md) |
| POST | `/outlook/periods/:id/lampiran` | [create-lampiran](./create-lampiran.md) |
| PUT | `/outlook/periods/:id/lampiran/:lampiran_id` | [update-lampiran](./update-lampiran.md) |
| DELETE | `/outlook/periods/:id/lampiran/:lampiran_id` | [delete-lampiran](./delete-lampiran.md) |

Every write returns `{ "data": { "state": <State>, "result"?: … }, "message": "…" }`.
