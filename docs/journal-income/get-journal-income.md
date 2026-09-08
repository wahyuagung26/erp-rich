---
type: API Endpoint
title: Get Journal Income
description: Get one cash receipt journal with normalized detail labels.
method: GET
path: /journal-income/:id
status: mock
tags: [journal, income, read]
resource: /frontend/src/mocks/modules/journal-income.ts
timestamp: 2026-09-07T18:00:00Z
---

# Get Journal Income

## Response

`200`: `{ "data": JournalIncome }`

Header and detail lines include resolved account, department, and cash-flow labels
for display and edit forms. The balancing cash debit line is not in `lines` —
render it from `cash_account_*` + `cash_in`.

`404`: `{ "message": "Jurnal pemasukan tidak ditemukan" }`
