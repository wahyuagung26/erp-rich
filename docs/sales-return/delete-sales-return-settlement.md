---
type: API Endpoint
title: Delete Sales Return Settlement
description: Cancel a settlement (potong piutang or dana kembali); a potong piutang also removes its invoice payment row.
method: DELETE
path: /sales-return/:id/settlements/:settlementId
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Delete Sales Return Settlement

Backs the delete icon on **Riwayat Penyelesaian** in `PageSalesReturnDetail.vue`.

## Response

`200`: `{ "data": { ...SalesReturn }, "message": "Potong piutang dibatalkan" | "Pengembalian dana dibatalkan" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | return or settlement not found | `{ "message": "..." }` |
| `422` | the settlement's period is closed (`locked = true`) | `{ "message": "Periode September 2026 sudah closing, potong piutang tidak bisa dibatalkan" }` |
