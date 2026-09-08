---
type: API Endpoint
title: Get Supplier Advance
description: Get one supplier advance with normalized detail labels.
method: GET
path: /supplier-advance/:id
status: mock
tags: [supplier-advance, read]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Get Supplier Advance

## Response

`200`: `{ "data": SupplierAdvance }`

Includes resolved department / supplier / cash account / cash-flow labels and the
computed `used` / `remaining` / `last_payable_number` for display and edit forms.

`404`: `{ "message": "Uang muka supplier tidak ditemukan" }`
