---
type: API Endpoint
title: Create Purchase Invoice
description: Create an invoice from a not-yet-invoiced purchase receipt. Server assigns the number.
method: POST
path: /purchase-invoice
status: mock
tags: [purchase-invoice, write]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-06T13:00:00Z
---

# Create Purchase Invoice

Backs `PagePurchaseInvoiceTambah.vue`. Client validation: `frontend/src/views/purchase-invoice/schema.ts`
(Valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "purchase_receipt_id": 1,
  "date": "2026-09-08",
  "supplier_invoice_number": "INV-SUP-2026-001",
  "description": "Tagihan penerimaan sebagian PO",
  "lines": [{ "product_id": 1, "price": 375000 }]
}
```

| Field | Type | Rules |
|---|---|---|
| `purchase_receipt_id` | number | required; receipt must exist and be `not_invoiced` |
| `date` | string | required; `YYYY-MM-DD`; cannot be after today |
| `supplier_invoice_number` | string | required after trim; max 30 chars |
| `description` | string | optional; max 250 chars |
| `lines` | array | exactly one entry per received product of the receipt (`quantity > 0`) |

Each line has `product_id` (must be a received product of the receipt) and `price` (`> 0`).
Quantity, department, supplier, and PKP are taken from the receipt/PO — never from the client.

## Response

`201`: `{ "data": {
    "id": 1,
    "number": "BL-RICH/0001/09/2026",
    "date": "2026-09-08",
    "purchase_receipt_id": 1,
    "purchase_receipt_number": "BM-RICH/0001/09/2026",
    "purchase_order_id": 2,
    "purchase_order_number": "PO-RICH/0002/09/2026",
    "supplier_id": 7,
    "supplier_code": "RC00001",
    "supplier_name": "PT Rahadhyan Integrasi Nusantara",
    "department_id": 10,
    "department_code": "PRD",
    "department_name": "Produksi",
    "supplier_invoice_number": "INV-SUP-2026-001",
    "description": "Tagihan penerimaan sebagian PO",
    "pkp_active": true,
    "approval_status": "pending",
    "approved_by": null,
    "approved_at": null,
    "kontrabon_number": null,
    "tax_invoice": null,
    "created_by": "Admin",
    "lines": [
      {
        "product_id": 1,
        "product_code": "PRD001",
        "product_name": "Kulkas 2 Pintu",
        "brand_name": "Samsung",
        "unit_name": "Pieces",
        "quantity": 40,
        "price": 375000,
        "dpp": 15000000,
        "ppn": 1650000,
        "total": 16650000
      }
    ],
    "dpp": 15000000,
    "ppn": 1650000,
    "total": 16650000
  }, "message": "Invoice pembelian ditambahkan" }`

Side effect: the source receipt becomes `invoice_status: "invoiced"`.

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |
| `422` | receipt already invoiced, or lines do not match the receipt | `{ "message": "..." }` (no `errors`) |

Field errors can use `purchase_receipt_id`, `date`, `supplier_invoice_number`, `description`, or `lines`.

**Periode closing:** a `date` in a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` ([conventions](../conventions.md#closing-period-lock-locked)).
