---
type: API Endpoint
title: Delete Journal Expense
description: Delete a submitted cash disbursement journal.
method: DELETE
path: /journal-expense/:id
status: mock
tags: [journal, expense, write]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-11-06T08:00:00Z
---

# Delete Journal Expense

Only journals with status `submitted` can be deleted. The prototype removes the
row from its in-memory store.

`200`: `{ "message": "Jurnal pengeluaran dihapus" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat dihapus" }` for approved
or rejected journals.

**Periode closing:** a `submitted` journal whose `date` falls in a closed period ([Posting & Closing](../posting/index.md)) is `locked` and cannot be deleted: `422 { "message": "Periode <bulan tahun> sudah closing, jurnal tidak bisa dihapus" }`. The UI hides Edit / Hapus and shows the Closing badge.
