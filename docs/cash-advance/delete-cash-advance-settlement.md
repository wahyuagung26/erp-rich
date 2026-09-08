---
type: API Endpoint
title: Delete Cash Advance Settlement
description: Remove a settlement/usage record from an approved operational cash advance.
method: DELETE
path: /cash-advance/:id/settlement/:settlementId
status: mock
tags: [cash-advance, settlement, write]
resource: /frontend/src/mocks/modules/cash-advance.ts
timestamp: 2026-09-08T12:00:00Z
---

# Delete Cash Advance Settlement

Only allowed while the parent advance's `status` is `approved`. The prototype
removes the row from its in-memory store and recomputes the parent
`CashAdvance.used`/`remaining`.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | the owning `CashAdvance` id |
| `settlementId` | number | the `CashAdvanceSettlement` id |

## Response

`200`: `{ "message": "Penyelesaian uang muka dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | `id`/`settlementId` do not match | `{ "message": "..." }` |
| `422` | parent advance is not `approved` | `{ "message": "Penyelesaian hanya dapat dihapus untuk uang muka yang sudah disetujui" }` |
