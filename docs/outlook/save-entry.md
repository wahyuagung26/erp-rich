---
type: OKF Endpoint
title: Save Outlook Entry
method: PUT
path: /outlook/periods/:id/entries
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Save Outlook Entry

Saves **one grid cell** (the grid auto-saves a cell when it is left). Body:

```json
{ "category_id": 11, "kind": "ol", "week_no": 2, "amount": 15000000 }
{ "category_id": 11, "kind": "actual", "week_no": 2, "slot": 3, "amount": 2500000 }
```

`kind: "ol"` = the weekly target of that category; `kind: "actual"` = the amount in one day column (`slot` 1–7, which must hold a date). `amount` `null`/`0`/`""` deletes the value. Amounts are numbers (may be negative), at most 9 999 999 999 999.99 in absolute value, 2 decimals.

Only **leaf** categories accept values (`422 Kategori ini memiliki sub kategori; OL/actual hanya bisa diisi pada kategori paling bawah`). Returns `200 { data: { state }, message: "Tersimpan" }`.

Errors: `404` period/category; `422` unknown week, empty column (`Kolom 3 minggu 2 belum bertanggal. Isi tanggal kolomnya lebih dulu`), invalid amount (`errors.amount`); locked period ([lock](./index.md#closing-period-lock)).
