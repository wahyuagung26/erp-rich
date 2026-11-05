---
type: API Endpoint
title: Delete Journal Income
description: Delete a submitted cash receipt journal.
method: DELETE
path: /journal-income/:id
status: mock
tags: [journal, income, write]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-11-06T08:00:00Z
---

# Delete Journal Income

Only journals with status `submitted` can be deleted. The prototype removes the
row from its in-memory store.

`200`: `{ "message": "Jurnal pemasukan dihapus" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat dihapus" }` for approved
or rejected journals.

**Periode closing:** a `submitted` journal whose `date` falls in a closed period ([Posting & Closing](../posting/index.md)) is `locked` and cannot be deleted: `422 { "message": "Periode <bulan tahun> sudah closing, jurnal tidak bisa dihapus" }`. The UI hides Edit / Hapus and shows the Closing badge.
