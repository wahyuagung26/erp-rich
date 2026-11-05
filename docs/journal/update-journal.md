---
type: API Endpoint
title: Update Journal
description: Edit a submitted manual journal.
method: PUT
path: /journal/:id
status: mock
tags: [journal, write]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-11-06T13:00:00Z
---

# Update Journal

The request body uses the same fields as [Create Journal](./create-journal.md).
Only journals with status `submitted` can be edited. The status remains
`submitted` after the update.

`200`: `{ "data": Journal, "message": "Jurnal diperbarui" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat diedit" }` for locked
statuses, or the normal journal validation error for invalid data.

**Periode closing:** a `submitted` journal whose `date` falls in a closed period ([Posting & Closing](../posting/index.md)) is `locked` and cannot be edited: `422 { "message": "Periode <bulan tahun> sudah closing, jurnal tidak bisa diedit" }`. The UI hides Edit / Hapus and shows the Closing badge.

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
