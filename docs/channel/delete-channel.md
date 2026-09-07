---
type: API Endpoint
title: Delete Channel
description: Soft-delete a sales channel — sets `deleted_at`, keeps the row.
method: DELETE
path: /channel/:id
status: mock
tags: [channel, write]
resource: /frontend/src/mocks/modules/channel.ts
timestamp: 2026-09-07T00:00:00Z
---

# Delete Channel

Backs the delete action in `PageChannelTable.vue` (row) and `PageChannelDetail.vue`,
both behind a confirm dialog.

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type |
|---|---|
| `id` | number |

## Response

`200`:

```json
{ "message": "Channel dihapus" }
```

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, already soft-deleted, or belongs to a different company than the active one | `{ "message": "Channel tidak ditemukan" }` |

## Notes

- **Soft delete.** The row is kept; `deleted_at` is set to the current ISO timestamp.
  After this the channel is invisible to [list-channel](./list-channel.md) and
  [get-channel](./get-channel.md), and its `code` frees up for reuse within the
  company.
- No restore endpoint yet — add `POST /channel/:id/restore` when the UI needs it.
