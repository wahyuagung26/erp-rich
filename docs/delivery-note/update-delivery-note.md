---
type: API Endpoint
title: Update Delivery Note
description: Edit a surat jalan; the invoice reference is immutable.
method: PUT
path: /delivery-note/:id
status: mock
tags: [delivery-note, write]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-06T17:00:00Z
---

# Update Delivery Note

Backs `PageDeliveryNoteEdit.vue`. Full-object PUT, same body and rules as [create-delivery-note](./create-delivery-note.md).
`sales_invoice_id` cannot change: the body's value is ignored and the stored one kept. Not closing-locked (edit and `date` in a closed period are allowed).

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `DeliveryNote.id` |

### Body

Same as [create-delivery-note](./create-delivery-note.md).

## Response

`200`: `{ "data": { ...DeliveryNote }, "message": "Surat jalan diperbarui" }`. `id`, `number`, `sales_invoice_id`, `created_by` are retained.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Surat jalan tidak ditemukan" }` |
| `422` | validation failure | `{ "message": "Validasi gagal", "errors": { "<field>": ["..."] } }` |

## Notes

Writes history `Diubah` with changes for date, address, recipient, driver, vehicle, description and per-product quantity.
