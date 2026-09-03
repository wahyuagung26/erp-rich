---
type: API Endpoint
title: Create Perusahaan
description: Add a new company. Client supplies `code`; server assigns `id`.
method: POST
path: /perusahaan
status: mock
tags: [perusahaan, write]
resource: /frontend/src/mocks/modules/perusahaan.ts
timestamp: 2026-09-03T16:30:00Z
---

# Create Perusahaan

Backs `views/perusahaan/pages/PagePerusahaanTambah.vue`. Client-side validation:
`frontend/src/views/perusahaan/schema.ts` (valibot) — the backend must re-validate.

## Request

### Body

```json
{
  "code": "RIN",
  "short_name": "PT RIN",
  "legal_name": "PT Rahadhyan Integrasi Nusantara",
  "npwp": "31.234.567.8-421.000",
  "logo_url": "",
  "address": "Jalan Kaum Kaler, RT.023/RW.003, Manonjaya, Kab. Tasikmalaya, Jawa Barat",
  "company_type": "pt",
  "hr_enabled": true,
  "report_header_color": "#B0F2B1"
}
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | required; unique across non-deleted rows; trimmed |
| `short_name` | string | required; min 2 |
| `company_type` | string | required; one of `pt` `cv` `ud` `firma` `perorangan` `koperasi` `yayasan` |
| `report_header_color` | string | required; `#RRGGBB` hex |
| `hr_enabled` | boolean | default `false` |
| `legal_name` `npwp` `logo_url` `address` | string | optional |

`id` is **not** accepted from the client — the server assigns it.

## Response

`201`:

```json
{ "data": { "id": 4, "code": "RIN", "...": "...", "deleted_at": null }, "message": "Perusahaan ditambahkan" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `422` | validation, or `code` already used | `{ "message": "...", "errors": { "code": ["Kode perusahaan sudah dipakai"] } }` |
