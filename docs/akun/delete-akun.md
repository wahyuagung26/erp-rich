---
type: API Endpoint
title: Delete Akun
description: Remove an account.
method: DELETE
path: /akun/:id
status: mock
tags: [akun, write]
resource: /frontend/src/mocks/modules/akun.ts
timestamp: 2026-09-03T00:00:00Z
---

# Delete Akun

Backs the row delete action in `PageAkunTable.vue` (behind a confirm dialog).

## Request

### Path params

| Name | Type |
|---|---|
| `id` | string |

## Response

`200`:

```json
{ "message": "Akun dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found | `{ "message": "Akun tidak ditemukan" }` |
| `409` | account is referenced by journal entries | `{ "message": "Akun dipakai di jurnal, tidak bisa dihapus" }` |

## Notes

- Mock deletes unconditionally. Backend should soft-delete or block when the
  account is referenced (`409`). Prefer setting `active: false` over deletion.
