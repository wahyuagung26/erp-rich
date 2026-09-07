---
type: API Endpoint
title: Get Journal
description: Get one manual journal with normalized detail labels.
method: GET
path: /journal/:id
status: mock
tags: [journal, read]
resource: /frontend/src/mocks/modules/journal.ts
timestamp: 2026-09-07T10:00:00Z
---

# Get Journal

## Response

`200`: `{ "data": Journal }`

The detail lines include resolved account, department, and cash-flow labels for
display and edit forms.

`404`: `{ "message": "Jurnal tidak ditemukan" }`
