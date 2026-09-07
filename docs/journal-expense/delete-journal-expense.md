---
type: API Endpoint
title: Delete Journal Expense
description: Delete a submitted cash disbursement journal.
method: DELETE
path: /journal-expense/:id
status: mock
tags: [journal, expense, write]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-09-07T16:00:00Z
---

# Delete Journal Expense

Only journals with status `submitted` can be deleted. The prototype removes the
row from its in-memory store.

`200`: `{ "message": "Jurnal pengeluaran dihapus" }`

`422`: `{ "message": "Hanya jurnal submitted yang dapat dihapus" }` for approved
or rejected journals.
