---
type: API Endpoint
title: Update Journal Income
description: Edit a submitted cash receipt journal.
method: PUT
path: /journal-income/:id
status: mock
tags: [journal, income, write]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-11-06T13:00:00Z
---

# Update Journal Income

Same body as [Create Journal Income](./create-journal-income.md). Only journals
with status `submitted` can be edited; the status stays `submitted` after.

`200`: `{ "data": JournalIncome, "message": "Jurnal pemasukan diperbarui" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat diedit" }` for locked
statuses, or the normal validation error for invalid data.

**Periode closing:** a `submitted` journal whose `date` falls in a closed period ([Posting & Closing](../posting/index.md)) is `locked` and cannot be edited: `422 { "message": "Periode <bulan tahun> sudah closing, jurnal tidak bisa diedit" }`. The UI hides Edit / Hapus and shows the Closing badge.

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
