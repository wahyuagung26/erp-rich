---
type: API Endpoint
title: Update Journal Income
description: Edit a submitted cash receipt journal.
method: PUT
path: /journal-income/:id
status: mock
tags: [journal, income, write]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-09-07T18:00:00Z
---

# Update Journal Income

Same body as [Create Journal Income](./create-journal-income.md). Only journals
with status `submitted` can be edited; the status stays `submitted` after.

`200`: `{ "data": JournalIncome, "message": "Jurnal pemasukan diperbarui" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat diedit" }` for locked
statuses, or the normal validation error for invalid data.
