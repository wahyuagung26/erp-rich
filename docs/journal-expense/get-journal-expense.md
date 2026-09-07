---
type: API Endpoint
title: Get Journal Expense
description: Get one cash disbursement journal with normalized detail labels.
method: GET
path: /journal-expense/:id
status: mock
tags: [journal, expense, read]
resource: /frontend/src/mocks/modules/journal-expense.ts
timestamp: 2026-09-07T16:00:00Z
---

# Get Journal Expense

## Response

`200`: `{ "data": JournalExpense }`

Header and detail lines include resolved account, department, and cash-flow labels
for display and edit forms. The balancing cash credit line is not in `lines` —
render it from `cash_account_*` + `cash_out`.

`404`: `{ "message": "Jurnal pengeluaran tidak ditemukan" }`
