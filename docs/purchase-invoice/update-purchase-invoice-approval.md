---
type: API Endpoint
title: Approve Purchase Invoice
description: Approve a pending invoice (one-way); generates the kontrabon number.
method: PATCH
path: /purchase-invoice/:id/approval
status: mock
tags: [purchase-invoice, write]
resource: /frontend/src/mocks/modules/purchase-invoice.ts
timestamp: 2026-11-05T23:30:00Z
---

# Approve Purchase Invoice

Backs the **Setujui** action in `PagePurchaseInvoiceDetail.vue`; the UI confirms first.

## Request

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `PurchaseInvoice.id` |

### Body

```json
{ "status": "approved" }
```

`status` accepts only `approved`.

## Response

`200`: `{ "data": { ...PurchaseInvoice }, "message": "Invoice disetujui" }` — sets `approval_status`,
`approved_by`, `approved_at`, and `kontrabon_number` (`KB-RICH/<seq>/<MM>/<YYYY>`).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Invoice pembelian tidak ditemukan" }` |
| `422` | `status` is not `approved`, or the invoice is already approved | `{ "message": "..." }` |

## Notes

Approval is one-way: there is no reject or unapprove. A repeated approve does not create a
second kontrabon (it is rejected with `422`).
