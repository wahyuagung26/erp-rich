---
type: OKF Endpoint
title: Update Outlook Opening Balance
method: PUT
path: /outlook/periods/:id/opening-balance
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Update Outlook Opening Balance

Body `{ amount }` — the bank opening balance of the month (the input in the "Saldo Awal" row, cell Total OL). A number (may be negative); `null`/`""` unsets it, after which `calc.saldo_awal_set` is false and the balance check reads `belum_diisi`.

Returns `200 { data: { state }, message: "Saldo awal disimpan" }`. Errors: `404`; `422 { errors: { amount: ["Isi dengan angka"] } }` (not a number or above 9 999 999 999 999.99 in absolute value); locked period ([lock](./index.md#closing-period-lock)).
