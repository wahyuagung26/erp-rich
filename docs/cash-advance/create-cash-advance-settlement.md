---
type: API Endpoint
title: Create Cash Advance Settlement
description: Record a settlement/usage against an approved operational cash advance.
method: POST
path: /cash-advance/:id/settlement
status: mock
tags: [cash-advance, settlement, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-11-05T16:00:00Z
---

# Create Cash Advance Settlement

Backs the "Tambah Penyelesaian" action on `PageCashAdvanceDetail.vue` /
`PageCashAdvanceEdit.vue`. Only available (and only accepted server-side) while the
parent advance's `status` is `approved` and its `remaining` is `> 0`. On success the
parent `CashAdvance.used`/`remaining` are recomputed from the sum of all its
settlement rows.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | the owning `CashAdvance` id |

### Body

```json
{
  "date": "2026-08-10",
  "description": "Pembelian ATK kantor",
  "attachments": [{ "name": "kwitansi.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }],
  "lines": [
    { "account_id": 2, "department_id": 1, "cash_flow": "OPERASI_OUT", "detail_description": "Pembelian ATK", "debit": 500000, "credit": 0 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `description` | string | optional ("Keterangan") |
| `attachments` | object[] | required; 1–10 files, each PDF/JPG/JPEG/PNG, max 5 MB per file |
| `lines` | object[] | required; at least one expense line (below) |

Each `lines[]` item:

| Field | Type | Rules |
|---|---|---|
| `account_id` | number | required; non-deleted [`Account`](../account/index.md) |
| `department_id` | number | required; active [`Department`](../department/index.md) |
| `cash_flow` | string \| null | optional; must exist in [`CashFlow`](../cash-flow/index.md) when sent |
| `detail_description` | string | optional |
| `debit` / `credit` | number | `>= 0`; exactly one of the two is `> 0` |

`amount` is **not sent** — the server computes it as Σ`debit` − Σ`credit` of `lines`;
it must be `> 0` and `<=` the advance's current `remaining`.

## Response

`201`:

```json
{
  "data": {
    "id": 6, "cash_advance_id": 2, "number": "PU-2609-001", "date": "2026-08-10",
    "description": "Pembelian ATK kantor",
    "attachments": [{ "name": "kwitansi.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }],
    "lines": [
      { "account_id": 2, "account_code": "6000101", "account_name": "Beban Gaji Pokok", "department_id": 1, "department_code": "FIN", "department_name": "Finance", "cash_flow": "OPERASI_OUT", "cash_flow_name": "Operasi Out", "detail_description": "Pembelian ATK", "debit": 500000, "credit": 0 }
    ],
    "amount": 500000, "remaining_after": 100000
  },
  "message": "Penyelesaian uang muka ditambahkan"
}
```

The frontend re-fetches [get-cash-advance](./get-cash-advance.md) and
[list-cash-advance-settlement](./list-cash-advance-settlement.md) afterward to
refresh `used`/`remaining` and the history table.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | `id` does not match a `CashAdvance` | `{ "message": "Uang muka operasional tidak ditemukan" }` |
| `422` | advance not `approved`, invalid date, invalid line, total not `> 0`, total exceeds remaining, or missing attachments | `{ "message": "...", "errors": { "lines": ["..."] } }` |
