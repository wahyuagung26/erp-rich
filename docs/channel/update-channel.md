---
type: API Endpoint
title: Update Channel
description: Edit an existing sales channel's name/notes. Code is immutable.
method: PUT
path: /channel/:id
status: mock
tags: [channel, write]
resource: /frontend/src/mocks/modules/channel.ts
timestamp: 2026-09-07T00:00:00Z
---

# Update Channel

Backs `views/channel/pages/PageChannelEdit.vue`. The form shows `code` disabled — this
endpoint ignores `code` even if sent; `name` and `notes` can change.

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
{ "name": "Toko Offline", "notes": "Penjualan langsung di gerai utama" }
```

`code`, `id`, and `company_id` are ignored if sent — a row can't be moved to
another company via this endpoint.

## Response

`200`: `{ "data": { ...Channel }, "message": "Channel diperbarui" }`

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Channel tidak ditemukan" }` |
| `422` | validation | `{ "message": "...", "errors": { "name": ["..."] } }` |
