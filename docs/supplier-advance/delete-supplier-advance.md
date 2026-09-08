---
type: API Endpoint
title: Delete Supplier Advance
description: Delete a supplier advance that has not yet been used.
method: DELETE
path: /supplier-advance/:id
status: mock
tags: [supplier-advance, write]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Delete Supplier Advance

The prototype removes the row from its in-memory store.

`200`: `{ "message": "Uang muka supplier dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `422` | the advance has usage rows | `{ "message": "Uang muka yang sudah dipakai di Hutang Supplier tidak boleh dihapus" }` |
