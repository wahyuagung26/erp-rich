---
type: API Endpoint
title: List Deliverable Sales Invoices
description: Picker source for the create form — approved sales invoices that do not have a surat jalan yet.
method: GET
path: /delivery-note/deliverable-invoices
status: mock
tags: [delivery-note, read, lookup]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-06T17:00:00Z
---

# List Deliverable Sales Invoices

Backs the `Invoice Penjualan` `AsyncSelect` in `FormDeliveryNote.vue` (new surat jalan only; the edit form shows the stored invoice read-only).
`GET /sales-invoice` cannot express "has no surat jalan", so this lookup lives on the module that owns that rule.

## Request

### Query

| Name | Type | Required | Notes |
|---|---|---|---|
| `q` | string | no | matches invoice number, customer code/name; case-insensitive |
| `page`, `per_page` | int | no | see [conventions](../conventions.md#pagination-list-endpoints) |

## Response

`200`, newest invoice date first:

```json
{
  "data": [
    { "id": 6, "number": "RIN.INV260820/001", "date": "2026-08-20", "customer_id": 2, "customer_code": "CUST-0002", "customer_name": "Toko Sumber Rejeki" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1, "last_page": 1 }
}
```

## Errors

Standard only (`401`).

## Notes

Rows are invoices with `approval_status = approved` and no surat jalan. Deleting a surat jalan or an invoice's un-approval does not need special handling: the next call recomputes.
