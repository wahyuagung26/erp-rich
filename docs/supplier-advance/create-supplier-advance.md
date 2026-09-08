---
type: API Endpoint
title: Create Supplier Advance
description: Create a supplier advance. No approval workflow — the record is ready immediately.
method: POST
path: /supplier-advance
status: mock
tags: [supplier-advance, write]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# Create Supplier Advance

Backs `views/supplier-advance/components/FormSupplierAdvance.vue`. `number` is
always server-assigned. `used` starts at `0`; `remaining` is `amount`. There is
no approval status — the advance is usable as soon as it is created.

## Request

### Body

```json
{
  "date": "2026-09-08",
  "department_id": 10,
  "supplier_id": 12,
  "amount": 250000000,
  "cash_account_id": 17,
  "advance_type": "TITIPAN-PO",
  "cash_flow": "OPERASI_OUT_STOK",
  "description": "DEPOSIT PEMBELIAN E-MONEY RICHSO.XXX.XXXXXXX",
  "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
}
```

| Field | Type | Rules |
|---|---|---|
| `date` | string | required; `YYYY-MM-DD` |
| `department_id` | number | required; active [`Department`](../department/index.md) |
| `supplier_id` | number | required; non-deleted [`Supplier`](../supplier/index.md) |
| `amount` | number | required; `> 0` |
| `cash_account_id` | number | required; must be a non-deleted `cash_bank` [`Account`](../account/index.md) |
| `advance_type` | string | required; `TITIPAN-PO` |
| `cash_flow` | string \| null | optional; must exist in [`CashFlow`](../cash-flow/index.md) when sent |
| `description` | string | optional |
| `attachment` | object | required; one PDF/JPG/JPEG/PNG, max 5 MB |

`used` / `remaining` / `last_payable_number` are ignored on write (server-computed).

## Response

`201`:

```json
{
  "data": {
    "id": 4, "number": "UMS-RICH/0004/09/2026", "date": "2026-09-08",
    "department_id": 10, "department_code": "Produksi", "department_name": "Produksi",
    "supplier_id": 12, "supplier_code": "RC00007", "supplier_name": "PT Rahadhyan International Capital Haven",
    "amount": 250000000, "used": 0, "remaining": 250000000, "last_payable_number": null,
    "description": "DEPOSIT PEMBELIAN E-MONEY RICHSO.XXX.XXXXXXX",
    "cash_account_id": 17, "cash_account_code": "1001302", "cash_account_name": "Bank CIMB Niaga - 9200 (IDR)",
    "advance_type": "TITIPAN-PO", "cash_flow": "OPERASI_OUT_STOK", "cash_flow_name": "Operasi Out - Stok",
    "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
  },
  "message": "Uang muka supplier ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | invalid amount / bad refs / missing attachment / empty `advance_type` | `{ "message": "...", "errors": { "amount": ["..."] } }` |
