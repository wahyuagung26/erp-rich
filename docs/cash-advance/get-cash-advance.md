---
type: API Endpoint
title: Get Cash Advance
description: Get one operational cash advance with normalized detail labels.
method: GET
path: /cash-advance/:id
status: mock
tags: [cash-advance, read]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Get Cash Advance

## Response

`200`: `{ "data": CashAdvance }`

Includes resolved department / cash account / advance account / cash-flow labels
for display and edit forms.

`404`: `{ "message": "Uang muka operasional tidak ditemukan" }`
