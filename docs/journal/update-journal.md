---
type: API Endpoint
title: Update Journal
description: Edit a submitted manual journal.
method: PUT
path: /journal/:id
status: mock
tags: [journal, write]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-09-07T10:00:00Z
---

# Update Journal

The request body uses the same fields as [Create Journal](./create-journal.md).
Only journals with status `submitted` can be edited. The status remains
`submitted` after the update.

`200`: `{ "data": Journal, "message": "Jurnal diperbarui" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat diedit" }` for locked
statuses, or the normal journal validation error for invalid data.
