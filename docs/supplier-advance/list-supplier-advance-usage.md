---
type: API Endpoint
title: List Supplier Advance Usage
description: Read-only usage/pemakaian history of a supplier advance (payments applied against supplier payables).
method: GET
path: /supplier-advance/:id/usage
status: mock
tags: [supplier-advance, read]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# List Supplier Advance Usage

Backs `views/supplier-advance/components/RiwayatPemakaian.vue`. Usage rows are
created by the AP module in Legacy and are **read-only** in this prototype — there
is no create/update/delete endpoint here. The parent's `used` / `remaining` are the
sum of these `amount`s.

## Response

`200`: `{ "data": SupplierAdvanceUsage[] }`

`404`: `{ "message": "Uang muka supplier tidak ditemukan" }`
