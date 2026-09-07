---
type: API Endpoint
title: Update Journal Expense
description: Edit a submitted cash disbursement journal.
method: PUT
path: /journal-expense/:id
status: mock
tags: [journal, expense, write]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-09-07T16:00:00Z
---

# Update Journal Expense

Same body as [Create Journal Expense](./create-journal-expense.md). Only journals
with status `submitted` can be edited; the status stays `submitted` after.

`200`: `{ "data": JournalExpense, "message": "Jurnal pengeluaran diperbarui" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat diedit" }` for locked
statuses, or the normal validation error for invalid data.
