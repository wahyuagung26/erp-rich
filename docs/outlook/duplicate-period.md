---
type: OKF Endpoint
title: Duplicate Outlook Period
method: POST
path: /outlook/periods/:id/duplicate
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Duplicate Outlook Period

"Duplikasi Untuk Periode Selanjutnya". Body `{ target_year, target_month, replace? }`. Copies **only the category structure** (names, hierarchy, order) of period `:id` into the target period. OL, actual, opening balance, column dates, Lampiran and closing status are **not** copied.

- Target does not exist → it is created (5 weeks, empty columns) and filled with the structure. `201 { data: { state, result: { year, month, replaced: null } }, message: "Periode diduplikasi" }`; `state` is the **target** period (the UI navigates to it).
- Target exists and `replace` is not true → `409 { message: "Periode <bulan tahun> sudah tersedia", data: { exists: true, period_id, year, month, categories, ol_rows, actual_rows } }`. The UI asks "Ganti template <bulan tahun>?" showing those counts, then resends with `replace: true`.
- `replace: true` → every category of the target with its OL and actual is deleted and replaced by the source structure; the target's opening balance, column dates and Lampiran stay. `result.replaced = { categories, ol, actual }`, message `Template periode diganti`.

Errors: `404` unknown source; `422` invalid target; `409 { message: "Periode tujuan sama dengan periode sumber" }`; `422 Periode <bulan tahun> sudah closing, periode Outlook tidak bisa dibuat atau diganti` when the **target** month is closed. A locked **source** is allowed.

See [Outlook Daily](./index.md#closing-period-lock).
