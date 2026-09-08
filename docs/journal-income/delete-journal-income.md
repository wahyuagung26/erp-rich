---
type: API Endpoint
title: Delete Journal Income
description: Delete a submitted cash receipt journal.
method: DELETE
path: /journal-income/:id
status: mock
tags: [journal, income, write]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-09-07T18:00:00Z
---

# Delete Journal Income

Only journals with status `submitted` can be deleted. The prototype removes the
row from its in-memory store.

`200`: `{ "message": "Jurnal pemasukan dihapus" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat dihapus" }` for approved
or rejected journals.
