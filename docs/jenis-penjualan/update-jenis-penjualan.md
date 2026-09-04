---
type: API Endpoint
title: Update Jenis Penjualan
description: Edit an existing sales type's name or its four account references. Code is immutable.
method: PUT
path: /jenis-penjualan/:id
status: mock
tags: [jenis-penjualan, write]
resource: /frontend/src/mocks/modules/jenis-penjualan.ts
timestamp: 2026-09-05T12:00:00Z
---

# Update Jenis Penjualan

Backs `views/jenis-penjualan/pages/PageJenisPenjualanEdit.vue`. The form shows
`code` disabled — this endpoint ignores `code` even if sent. Unlike `code`, the
four account references **are** editable here — re-validated the same as on create.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

### Body

```json
{ "name": "Bahan Baku Impor", "akun_pendapatan_id": 5, "akun_hpp_id": 6, "akun_persediaan_id": 7, "akun_biaya_id": 2 }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...JenisPenjualan }, "message": "Jenis penjualan diperbarui" }` —
`akun_*_code`/`akun_*_name` are re-resolved from the (possibly changed) ids.

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Jenis penjualan tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
| `422` | any `akun_*_id` not found, soft-deleted, or belongs to a different company | `{ "message": "...", "errors": { "akun_pendapatan_id": ["Akun pendapatan tidak valid"] } }` |
