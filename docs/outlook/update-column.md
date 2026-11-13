---
type: OKF Endpoint
title: Update Outlook Day Column
method: PUT
path: /outlook/periods/:id/columns/:week_no/:slot
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Update Outlook Day Column

Sets or clears the date of one day column (`week_no` 1–5, `slot` 1–7). Body `{ start, end? }`.

- `start` = `YYYY-MM-DD` within the period month ± 7 days; `null`/`""` **clears the column and deletes its actual** (the response `result.removed_actual` = how many cells; the UI confirms first when the column holds actual).
- `end` is only accepted for **week 5, slot 5–7**: a range `start..end` of at most 3 days becomes one column labelled e.g. `30-31` with one actual. `end` before `start` is refused; `end` equal to `start` or empty = single day. Sending `end` for any other column is `422`.
- Changing the date never moves actual: the numbers belong to the column. The same date may be used by several columns.

Returns `200 { data: { state, result: { removed_actual } }, message: "Tanggal kolom diperbarui" | "Tanggal dikosongkan" | "Rentang tanggal diperbarui" }`; no change → message `Tanggal tidak berubah`.

Errors: `404` period/week; `422` invalid slot/date (`errors.start` / `errors.end`), locked period ([lock](./index.md#closing-period-lock)).
