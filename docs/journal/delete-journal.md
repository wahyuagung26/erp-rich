---
type: API Endpoint
title: Delete Journal
description: Delete a submitted manual journal.
method: DELETE
path: /journal/:id
status: mock
tags: [journal, write]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-09-07T10:00:00Z
---

# Delete Journal

Only journals with status `submitted` can be deleted. The prototype removes the
row from its in-memory store.

`200`: `{ "message": "Jurnal dihapus" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat dihapus" }` for
approved or rejected journals.
