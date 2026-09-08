---
type: API Endpoint
title: Update Cash Advance
description: Edit a submitted operational cash advance.
method: PUT
path: /cash-advance/:id
status: mock
tags: [cash-advance, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Update Cash Advance

Same body as [Create Cash Advance](./create-cash-advance.md). Only advances with
status `submitted` can be edited; the status stays `submitted` after. `used` is
preserved from the existing row (not user-editable); `remaining` is recomputed
from the new `amount`.

`200`: `{ "data": CashAdvance, "message": "Uang muka operasional diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | `amount` less than the already-`used` amount, locked status, or normal validation error | `{ "message": "..." }` |
