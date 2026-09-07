---
type: OKF Module
title: Channel (Master Channel)
description: CRUD for sales channel master data — code + name + notes. Soft-delete, company-scoped.
tags: [channel, master-data]
timestamp: 2026-09-07T00:00:00Z
---

# Channel

Master data for sales channels. Consumed by `frontend/src/views/channel/` (list,
detail, tambah, edit). Company-scoped — see [conventions](../conventions.md#company-scoping).

`code` is entered by the user at creation and is **immutable** afterward — the edit
form shows it disabled, and the backend must ignore any `code` sent on update.
`code` uniqueness is checked within the active company only — two companies may
each have their own `CH01` code. Same contract as [Sales](../sales/index.md),
with a `notes` field instead of `address`.

## Entity: `Channel`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `company_id` | number | required; scopes the row to a company — see [conventions](../conventions.md#company-scoping) |
| `code` | string | required, user-entered, unique within the company across non-deleted rows; **immutable after create** — "Kode Channel" |
| `name` | string | required; min 2 — "Nama Channel" |
| `notes` | string | optional — "Keterangan" |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/channel` | [list-channel](./list-channel.md) |
| GET | `/channel/:id` | [get-channel](./get-channel.md) |
| POST | `/channel` | [create-channel](./create-channel.md) |
| PUT | `/channel/:id` | [update-channel](./update-channel.md) |
| DELETE | `/channel/:id` | [delete-channel](./delete-channel.md) |
