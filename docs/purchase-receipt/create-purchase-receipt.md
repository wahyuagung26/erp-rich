---
type: API Endpoint
title: Create Purchase Receipt
description: Add a new purchase receipt against an approved purchase order. Server assigns the transaction number.
method: POST
path: /purchase-receipt
status: mock
tags: [purchase-receipt, write]
resource: /frontend/src/mocks/modules/purchase-receipt.ts
timestamp: 2026-11-06T13:00:00Z
---

# Create Purchase Receipt

Backs `views/purchase-receipt/pages/PagePurchaseReceiptTambah.vue`. Client-side validation:
`frontend/src/views/purchase-receipt/schema.ts` (Valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "purchase_order_id": 2,
  "delivery_note_number": "SJ-2026-0091",
  "description": "Penerimaan sebagian produk PO",
  "department_id": 10,
  "date": "2026-09-08",
  "lines": [{ "product_id": 1, "quantity": 40, "warehouse_id": 1 }]
}
```

| Field | Type | Rules |
|---|---|---|
| `purchase_order_id` | number | required; must reference an `approved` purchase order |
| `delivery_note_number` | string | required after trim; max 30 chars |
| `description` | string | required after trim; max 250 chars |
| `department_id` | number | required; active department |
| `date` | string | required; `YYYY-MM-DD`; cannot be after today |
| `lines` | array | at least one line; only lines with `quantity > 0` are sent |

Each line contains `product_id` (must belong to the referenced PO), `quantity` (`> 0`, and
not greater than that product's current `remaining_quantity` — see
[get-purchase-order-receivable-lines](./get-purchase-order-receivable-lines.md)), and
`warehouse_id` (required, active warehouse). Client does not send `id`, `number`,
`invoice_status`, or any resolved/computed display field.

## Response

`201`:

```json
{
  "data": {
    "id": 1,
    "number": "BM-RICH/0001/09/2026",
    "purchase_order_id": 2,
    "purchase_order_number": "PO-RICH/0002/09/2026",
    "purchase_order_date": "2026-09-05",
    "purchase_order_description": "Contoh PO supplier PKP",
    "supplier_id": 7,
    "supplier_code": "SUP007",
    "supplier_name": "Supplier PKP Contoh",
    "delivery_note_number": "SJ-2026-0091",
    "description": "Penerimaan sebagian produk PO",
    "department_id": 10,
    "department_code": "Produksi",
    "department_name": "Produksi",
    "invoice_status": "not_invoiced",
    "date": "2026-09-08",
    "warehouse_label": "Gudang Pusat",
    "created_by": "Admin",
    "lines": [
      {
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Produk Contoh",
        "brand_name": "Merk Contoh",
        "unit_name": "Pieces",
        "ordered_quantity": 100,
        "received_quantity": 0,
        "remaining_quantity": 100,
        "quantity": 40,
        "warehouse_id": 1,
        "warehouse_code": "GD1",
        "warehouse_name": "Gudang Pusat"
      }
    ]
  },
  "message": "Penerimaan pembelian ditambahkan"
}
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | PO not approved, a line exceeds its remaining quantity, or no line has a positive quantity | `{ "message": "..." }` (no `errors`) |

Field validation errors can use `purchase_order_id`, `delivery_note_number`, `description`,
`department_id`, `date`, or `lines`.

The response's `lines` always mirrors every line of the referenced PO, not only the products
submitted with a positive quantity — untouched products come back with `quantity: 0`, same
as [get-purchase-order-receivable-lines](./get-purchase-order-receivable-lines.md).

**Periode closing:** a `date` in a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` ([conventions](../conventions.md#closing-period-lock-locked)).
