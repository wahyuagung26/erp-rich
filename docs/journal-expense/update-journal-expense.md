---
type: API Endpoint
title: Update Journal Expense
description: Edit a submitted cash disbursement journal.
method: PUT
path: /journal-expense/:id
status: mock
tags: [journal, expense, write]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-11-06T13:00:00Z
---

# Update Journal Expense

Same body as [Create Journal Expense](./create-journal-expense.md). Only journals
with status `submitted` can be edited; the status stays `submitted` after.

`200`: `{ "data": JournalExpense, "message": "Jurnal pengeluaran diperbarui" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat diedit" }` for locked
statuses, or the normal validation error for invalid data.

**Periode closing:** a `submitted` journal whose `date` falls in a closed period ([Posting & Closing](../posting/index.md)) is `locked` and cannot be edited: `422 { "message": "Periode <bulan tahun> sudah closing, jurnal tidak bisa diedit" }`. The UI hides Edit / Hapus and shows the Closing badge.

Moving the `date` into a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }`.
