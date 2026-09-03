---
type: API Endpoint
title: Create Jurnal
description: Post a balanced journal entry.
method: POST
path: /jurnal
status: mock
tags: [jurnal, write]
resource: /frontend/src/mocks/modules/jurnal.ts
timestamp: 2026-09-03T00:00:00Z
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
  "description": "Pembayaran listrik September",
  "lines": [
    { "akun_id": "a-6200", "debit": 1200000, "credit": 0 },
    { "akun_id": "a-1100", "debit": 0, "credit": 1200000 }
  ]
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `description` | string | required |
| `lines` | array | ≥ 2 items |
| `lines[].akun_id` | string | required; must be an active `Akun` |
| `lines[].debit` / `.credit` | number | ≥ 0; exactly one > 0 per line |

Server rejects unless `sum(debit) === sum(credit)` and `> 0`.

## Response

`201`:

```json
{
  "data": {
    "id": "j-1730620000000", "number": "JU-2609-001", "date": "2026-09-03",
    "description": "Pembayaran listrik September", "total": 1200000,
    "lines": [
      { "akun_id": "a-6200", "akun_code": "6-6200", "akun_name": "Beban Listrik & Air", "debit": 1200000, "credit": 0 },
      { "akun_id": "a-1100", "akun_code": "1-1100", "akun_name": "Bank BCA", "debit": 0, "credit": 1200000 }
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
