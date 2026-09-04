---
type: API Endpoint
title: Create Customer
description: Add a new customer. Server assigns `id` and `code`.
method: POST
path: /customer
status: mock
tags: [customer, write]
resource: /frontend/src/mocks/modules/customer.ts
timestamp: 2026-09-04T10:00:00Z
---

# Create Customer

Backs `views/customer/pages/PageCustomerTambah.vue`. Client-side validation:
`frontend/src/views/customer/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{
  "name": "PT Samudra Edukasi Raya",
  "phone": "0812-3456-7890",
  "email": "akuntansi@sera.co.id",
  "address": "Perum Griya Sakinah Al Kautsar Blok C No 30, Jiwan",
  "city": "Madiun",
  "bank_name": "BCA",
  "bank_account": "1234567890",
  "npwp": "1000-0000-0746-8535",
  "pkp": false,
  "top_days": 30,
  "notes": ""
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required; min 3 |
| `top_days` | number | required; integer ≥ 0 (`0` = tunai) |
| `email` | string | optional; email format when non-empty |
| `phone` `address` `city` `bank_name` `bank_account` `npwp` `notes` | string | optional |
| `pkp` | boolean | default `false` |

`code`, `id`, and `company_id` are **not** accepted from the client — the server
assigns them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 7, "code": "CUST-0007", "...": "...", "deleted_at": null }, "message": "Customer ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
