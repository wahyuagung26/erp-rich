---
type: API Endpoint
title: Update Journal Income Status
description: Move a cash receipt journal through its approval workflow.
method: PATCH
path: /journal-income/:id/status
status: mock
tags: [journal, income, approval, write]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-11-06T13:00:00Z
---

# Update Journal Income Status

Identical semantics to [update-journal-status](../journal/update-journal-status.md).

## Request

```json
{ "status": "approved", "date": "2026-08-03" }
```

| Field    | Type   | Rules                                                                                            |
| -------- | ------ | ------------------------------------------------------------------------------------------------ |
| `status` | enum   | `submitted → approved/rejected`, `rejected → submitted`, `approved → submitted` (Batalkan Approval)                                          |
| `date`   | string | optional, only on `status: approved` — `YYYY-MM-DD`; overrides the journal date at approval time |

## Response

`200`: `{ "data": JournalIncome, "message": "..." }`

## Notes

- **Batalkan Approval:** `approved → submitted` — clears `approved_by` / `approved_at`, journal becomes editable again, history gets "Approval Dibatalkan". Success message: `"Approval dibatalkan"`.
- **Periode closing:** once the journal's `date` is in a closed period ([Posting & Closing](../posting/index.md)) it is frozen — every status change (approve, reject, Batalkan Approval, resubmit) is refused: `422 { "message": "Periode <bulan tahun> sudah closing, status jurnal tidak bisa diubah" }`. The UI shows the Closing badge instead of the action buttons and bulk-approve skips `locked` rows.
- Approving stamps `approved_by` (current user's name) and `approved_at` (now), and applies `date` if sent.
- Rejecting sets a prototype rejection message; a rejected journal can be submitted again, which clears `approved_by` / `approved_at`.
- Bulk approve on the list page calls this endpoint once per selected id, without `date`.

Approving with a `date` in a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
