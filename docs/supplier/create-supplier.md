---
type: API Endpoint
title: Create Supplier
description: Add a new supplier. Server assigns `id` and `code`.
method: POST
path: /supplier
status: mock
tags: [supplier, write]
resource: /frontend/src/mocks/modules/supplier.ts
timestamp: 2026-09-04T10:00:00Z
---

# Create Supplier

Backs `views/supplier/pages/PageSupplierTambah.vue`. Client-side validation:
`frontend/src/views/supplier/schema.ts` (valibot) — the backend must re-validate.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | required — see [conventions](../conventions.md#company-scoping) |

### Body

```json
{
  "name": "PT Sumber Rejeki",
  "address": "Jl. Merdeka 10",
  "city": "Surabaya",
  "phone": "031-5551000",
  "fax": "",
  "email": "sales@sumberrejeki.co.id",
  "contact_person": "Budi",
  "npwp": "01.234.567.8-901.000",
  "pkp": true,
  "bank_name": "BCA",
  "bank_account": "1234567890",
  "top_days": 30,
  "notes": ""
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | required; min 3 |
| `address` | string | required |
| `phone` | string | required |
| `npwp` | string | required |
| `top_days` | number | required; integer ≥ 0 |
| `email` | string | optional; email format when non-empty |
| `city` `fax` `contact_person` `bank_name` `bank_account` `notes` | string | optional |
| `pkp` | boolean | default `false` |

`code`, `id`, and `company_id` are **not** accepted from the client — the server
assigns them (`company_id` is stamped from the active company, see
[conventions](../conventions.md#company-scoping)).

## Response

`201`:

```json
{ "data": { "id": 7, "code": "SUP-0007", "...": "...", "deleted_at": null }, "message": "Supplier ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | no active company | `{ "message": "Pilih perusahaan aktif terlebih dahulu" }` |
