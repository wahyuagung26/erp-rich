---
type: API Endpoint
title: Update Supplier Advance
description: Edit a supplier advance that has not yet been used. Once used, it is immutable.
method: PUT
path: /supplier-advance/:id
status: mock
tags: [supplier-advance, write]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Update Supplier Advance

Same body as [Create Supplier Advance](./create-supplier-advance.md). `number`
stays the same; `used` / `remaining` / `last_payable_number` are recomputed from
the existing usage rows (never user-editable).

**Business rule:** an advance with at least one usage row ("sudah dipakai di
Hutang Supplier") cannot be edited. The mock rejects with the exact Legacy
message below; the edit page shows the same warning and prevents saving.

`200`: `{ "data": SupplierAdvance, "message": "Uang muka supplier diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | the advance has usage rows | `{ "message": "Uang muka yang sudah dipakai di Hutang Supplier tidak boleh diubah" }` |
| `422` | normal validation error | `{ "message": "...", "errors": { "amount": ["..."] } }` |
