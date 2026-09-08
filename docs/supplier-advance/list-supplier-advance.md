---
type: API Endpoint
title: List Supplier Advance
description: Paginated, searchable, sortable list of supplier advances.
method: GET
path: /supplier-advance
status: mock
tags: [supplier-advance, read, list]
resource: /frontend/src/mocks/modules/supplier-advance.ts
timestamp: 2026-09-08T10:00:00Z
---

# List Supplier Advance

Backs `views/supplier-advance/pages/PageSupplierAdvanceTable.vue` (via `useTableList`).

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `page`, `per_page`, `sort_by`, `sort_order` | — | no | `sort_by` accepts `date`, `number`, `supplier_name`, `remaining` |
| `field` | string | no | `number` \| `supplier` \| `date` \| `description`; when omitted `q` matches every column |
| `q` | string | no | search text, matched against `field` (or all columns when `field` is empty) |

`used` / `remaining` / `last_payable_number` are computed per row from the
advance's usage rows, so they are always current without being stored twice.

## Response

`200`:

```json
{
  "data": [
    {
      "id": 1, "number": "UMS-RICH/0001/09/2026", "date": "2026-09-05",
      "department_id": 10, "department_code": "Produksi", "department_name": "Produksi",
      "supplier_id": 12, "supplier_code": "RC00007", "supplier_name": "PT Rahadhyan International Capital Haven",
      "amount": 250000000, "used": 150000000, "remaining": 100000000,
      "last_payable_number": "AP-RICH.CEM/0002/09/2026",
      "description": "DEPOSIT PEMBELIAN E-MONEY RICHSO.XXX.XXXXXXX",
      "cash_account_id": 17, "cash_account_code": "1001302", "cash_account_name": "Bank CIMB Niaga - 9200 (IDR)",
      "advance_type": "TITIPAN-PO", "cash_flow": "OPERASI_OUT_STOK", "cash_flow_name": "Operasi Out - Stok",
      "attachment": { "name": "bukti.pdf", "type": "application/pdf", "size": 1024, "data_url": "data:application/pdf;base64,..." }
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 3, "last_page": 1 }
}
```
