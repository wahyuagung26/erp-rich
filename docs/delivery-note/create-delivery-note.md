---
type: API Endpoint
title: Create Delivery Note
description: Create the surat jalan of an approved sales invoice. Server assigns the number.
method: POST
path: /delivery-note
status: mock
tags: [delivery-note, write]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-13T12:00:00Z
---

# Create Delivery Note

Backs `PageDeliveryNoteTambah.vue`. Client validation: `views/delivery-note/schema.ts` (Valibot) — the backend must re-validate.
Not closing-locked: a `date` in a closed period is accepted.

## Request

### Body

```json
{
  "sales_invoice_id": 6,
  "date": "2026-11-06",
  "delivery_address": "Jl. Rungkut Industri III No. 7, Surabaya",
  "recipient": "Pak Hendra",
  "driver": "Sutrisno",
  "vehicle": "L 8123 XY",
  "description": "",
  "lines": [{ "variant_id": 1, "quantity": 2 }]
}
```

| Field | Type | Rules |
|---|---|---|
| `sales_invoice_id` | number | required; `approved` invoice that has no surat jalan yet |
| `date` | string | required; `YYYY-MM-DD`; not after today |
| `delivery_address` | string | required after trim; max 250 chars |
| `recipient` `driver` | string | optional; max 100 chars |
| `vehicle` | string | optional; max 50 chars |
| `description` | string | optional; max 250 chars |
| `lines` | array | at least one; the client sends only lines with `quantity > 0` |

Each line: `variant_id` (one of the invoice's lines, unique per request) and `quantity` (`> 0`, ≤ that line's `invoice_quantity`).
The client never sends `id`, `number`, `created_by` or any resolved field.

## Response

`201`: `{ "data": { ...DeliveryNote }, "message": "Surat jalan ditambahkan" }` — `lines` mirrors every invoice line (products not shipped come back with `quantity: 0`).

## Errors

| Status | When | Body |
|---|---|---|
| `422` | field validation | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` — fields: `sales_invoice_id`, `date`, `delivery_address`, `recipient`, `driver`, `vehicle`, `description`, `lines` |
| `422` | invoice not approved | `{ "message": "Validasi gagal", "errors": { "sales_invoice_id": ["Invoice belum disetujui"] } }` |
| `422` | invoice already has a surat jalan | `{ "message": "Validasi gagal", "errors": { "sales_invoice_id": ["Invoice ini sudah memiliki surat jalan <nomor>"] } }` |

## Notes

Writes history `Dibuat` on the surat jalan and `Surat Jalan Dibuat` (summary = number) on the invoice. Never moves stok or jurnal.
