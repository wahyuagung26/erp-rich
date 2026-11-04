---
type: API Endpoint
title: Re-open Period
description: Re-open the last closed period (one step back), with a mandatory reason.
method: POST
path: /posting/closing/reopen
status: mock
tags: [closing, write, audit]
resource: /frontend/src/mocks/modules/posting.ts
timestamp: 2026-11-05T22:00:00Z
---

# Re-open Period

"Buka Closing Periode" — only the last closed period can be re-opened.

## Request

```json
{ "reason": "Koreksi jurnal penyesuaian kas" }
```

| Field | Type | Rules |
|---|---|---|
| `reason` | string | required, trimmed, min 10 chars; stored in the audit log |

## Response

`200`: `{ "data": ReopenHistory, "message": "Periode ... dibuka kembali" }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | reason missing / too short | `{ "message": "Validasi gagal", "errors": { "reason": ["..."] } }` |
| `422` | nothing is closed | `{ "message": "Belum ada periode yang ditutup" }` |

## Notes

- `closed_until` moves back one month; the period's entry leaves `history` and is added to `repost_pending` (`posted: false`).
- Access: special right only (legacy `pjbc`); a user without it gets `403` in the real backend (the mock always allows).
