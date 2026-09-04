---
type: API Endpoint
title: Create Jurnal
description: Post a balanced journal entry.
method: POST
path: /jurnal
status: mock
tags: [jurnal, write]
resource: /frontend/src/mocks/modules/jurnal.ts
timestamp: 2026-09-03T09:00:00Z
---

# Create Jurnal

Backs `views/jurnal/components/FormJurnalLines.vue`. The form blocks submit until
`sum(debit) === sum(credit)` and every line has an account + one non-zero side —
the backend must re-check.

## Request

### Body

```json
{
  "date": "2026-09-03",
  "description": "Pembayaran gaji September",
  "lines": [
    { "akun_id": 2, "debit": 1200000, "credit": 0 },
    { "akun_id": 1, "debit": 0, "credit": 1200000 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `description` | string | required |
| `lines` | array | ≥ 2 items |
| `lines[].akun_id` | number | required; must be a non-deleted [`AkunPerkiraan`](../akun-perkiraan/index.md) |
| `lines[].debit` / `.credit` | number | ≥ 0; exactly one > 0 per line |

Server rejects unless `sum(debit) === sum(credit)` and `> 0`.

## Response

`201`:

```json
{
  "data": {
    "id": 6, "number": "JU-2609-001", "date": "2026-09-03",
    "description": "Pembayaran gaji September", "total": 1200000,
    "lines": [
      { "akun_id": 2, "akun_code": "6000101", "akun_name": "Beban Gaji Pokok", "debit": 1200000, "credit": 0 },
      { "akun_id": 1, "akun_code": "1000101", "akun_name": "Kas Kecil", "debit": 0, "credit": 1200000 }
    ]
  },
  "message": "Jurnal disimpan"
}
```

`number` and `total` are server-assigned; `akun_code` / `akun_name` are resolved server-side.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | not balanced / bad line / unknown `akun_id` | `{ "message": "Jurnal tidak seimbang", "errors": { "lines": ["Total debit dan kredit harus sama"] } }` |

## Notes

- Both mock and backend resolve `akun_code` / `akun_name` from `akun_id`; the
  client only sends `akun_id`.
