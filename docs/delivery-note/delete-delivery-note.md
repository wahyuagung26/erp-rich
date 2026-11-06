---
type: API Endpoint
title: Delete Delivery Note
description: Hard-delete a surat jalan, which makes its invoice eligible for a new one.
method: DELETE
path: /delivery-note/:id
status: mock
tags: [delivery-note, write]
resource: /frontend/src/mocks/modules/delivery-note.ts
timestamp: 2026-11-06T17:00:00Z
---

# Delete Delivery Note

Backs the delete action in `PageDeliveryNoteTable.vue` and `PageDeliveryNoteDetail.vue`, both behind a confirm dialog.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `DeliveryNote.id` |

## Response

`200`: `{ "message": "Surat jalan dihapus" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Surat jalan tidak ditemukan" }` |

## Notes

Hard delete by design (no cancel lifecycle; legacy does the same). History is deleted with the record and the invoice gets `Surat Jalan Dihapus`.
No stok / jurnal effect. Not closing-locked. The invoice may then get a new surat jalan and may be un-approved again.
