---
type: API Endpoint
title: Create Sales Return
description: Add a sales return against an approved invoice; starts `pending`.
method: POST
path: /sales-return
status: mock
tags: [sales-return, write]
resource: /frontend/src/mocks/modules/sales-return.ts
timestamp: 2026-11-06T17:00:00Z
---

# Create Sales Return

Backs `PageSalesReturnTambah.vue`. Client validation: `views/sales-return/schema.ts`; the backend must re-validate.

## Request

### Body

```json
{
  "sales_invoice_id": 1,
  "date": "2026-10-12",
  "warehouse_id": 1,
  "reason": "Barang diterima dalam kondisi rusak",
  "lines": [ { "product_id": 1, "quantity": 1 } ]
}
```

| Field | Type | Rules |
|---|---|---|
| `sales_invoice_id` | number | required; invoice must be `approved` |
| `date` | string | required; `YYYY-MM-DD`; not after today, not before the invoice date, **not in a closed period** |
| `warehouse_id` | number | required; existing warehouse ("Gudang Penerima") |
| `reason` | string | required; max 250 |
| `lines[].product_id` | number | must belong to the invoice; unique |
| `lines[].quantity` | number | `≥ 0` and `≤ quantity_sold − quantity_returned_before`; lines with `0` are dropped; at least one line `> 0` |

`price`, `discount`, amounts and labels are never accepted from the client.

## Response

`201`: `{ "data": { ...SalesReturn }, "message": "Retur penjualan ditambahkan" }` — `approval_status: pending`, `number` `RET.<kode perusahaan><yymmdd>/<nnn>`.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation (`sales_invoice_id`, `date`, `warehouse_id`, `reason`, `lines`) | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |

**Periode closing:** a `date` in a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` ([conventions](../conventions.md#closing-period-lock-locked)).
