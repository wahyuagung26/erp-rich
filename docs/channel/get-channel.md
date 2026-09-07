---
type: API Endpoint
title: Get Channel
description: Fetch one sales channel by id.
method: GET
path: /channel/:id
status: mock
tags: [channel, read]
resource: /frontend/src/mocks/modules/channel.ts
timestamp: 2026-09-07T00:00:00Z
---

# Get Channel

Backs `views/channel/pages/PageChannelDetail.vue` (read-only view) and
`PageChannelEdit.vue` (loads the record into the form).

## Request

### Headers

| Name | Type | Notes |
|---|---|---|
| `X-Company-Id` | number | see [conventions](../conventions.md#company-scoping) |

### Path params

| Name | Type | Notes |
|---|---|---|
| `id` | number | `Channel.id` |

## Response

`200`: `{ "data": { ...Channel } }` — same shape as one row of [list-channel](./list-channel.md).

## Errors

| Status | When | Body |
|---|---|---|
| `404` | id not found, soft-deleted, or belongs to a different company than the active one | `{ "message": "Channel tidak ditemukan" }` |
