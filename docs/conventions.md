---
type: API Convention
title: Shared API Conventions
description: Response envelope, pagination, sorting, auth, and error shape inherited by every endpoint in this bundle.
tags: [api, convention]
timestamp: 2026-11-06T13:00:00Z
---

# Shared API Conventions

Base URL comes from `VITE_APP_API_URL`. Every endpoint file below assumes these.

## Response envelope

| Case | Shape |
|---|---|
| Single item | `{ "data": { ... }, "message"?: string }` |
| List | `{ "data": [ ... ], "meta": { "page", "per_page", "total", "last_page" }, "message"?: string }` |
| Error | `{ "message": string, "errors"?: { "<field>": string[] } }` |

Frontend always reads the payload from `.data` (and `.meta` for list pagination).

## Identifiers

Every entity's `id` is an **auto-increment integer** (database primary key), assigned by the
server. Business codes (`Akun.code` like `1-1000`, `Jurnal.number`) are separate string fields.

## Pagination (list endpoints)

Request query params:

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | 1 | 1-based |
| `per_page` | int | 10 | |
| `sort_by` | string | — | column field name |
| `sort_order` | `asc` \| `desc` | `asc` | |

`meta` (flat, no nesting):

```json
"meta": { "page": 1, "per_page": 10, "total": 18, "last_page": 2 }
```

## List KPI summary (optional `meta.summary`)

A list that shows KPI tiles above its table (`components/base/KpiFilter.vue`) returns the tile numbers next
to the page meta, in the **same response**:

```json
{ "data": [], "meta": { "page": 1, "per_page": 10, "total": 3, "last_page": 1,
  "summary": { "pending": { "count": 2, "amount": 33300000 }, "approved": { "count": 1 } } } }
```

- Keys are tile ids defined by each list's doc; `count` is always present, `amount` (Rupiah) only for tiles that show one.
- Numbers are computed by the server over **all** matching rows — never from the current page — and honour the
  list's search (`q`) and date range, but **ignore the status filters** (approval/delivery/invoice/tax status),
  so a tile keeps showing its own count while it is the active filter.
- A tile is only a shortcut: clicking it sets the same filter params the page's dropdowns use, so the dropdowns
  and the tiles are always in sync and no extra query parameter exists.

## Auth

`Authorization: Bearer <token>` on every request (frontend reads `localStorage.token`).
`401` (except on `/auth/login`) → frontend clears the token and redirects to `/login`.

## Company scoping

Some resources (currently: Supplier, Customer, Merk) are scoped to the session's
active company. The frontend sends an `X-Company-Id` request header on every
request to a scoped endpoint (GET, POST, PUT, DELETE alike), sourced from
`stores/company.ts`'s `activeId` and attached automatically by the axios request
interceptor (`utils/api.ts`) — the same way `Authorization` is attached. The UI
never exposes it as a form field or filter control.

- **List / get** without a resolvable `X-Company-Id` degrade gracefully: list
  returns an empty page, get returns `404`, rather than erroring — this covers
  the brief window before the active company has resolved on app load.
- **Create** without a resolvable `X-Company-Id` is a real error: `422`
  `{ "message": "Pilih perusahaan aktif terlebih dahulu" }`.
- **Get / update / delete** on a row belonging to a different company than the
  active one returns the same `404` "tidak ditemukan" as a genuinely missing or
  soft-deleted row — existence in another company is never revealed.

## Record history (`/<resource>/:id/history`)

Documents of the Pembelian module expose an audit timeline through one shared shape, read by the
global `HistoryModal` (`components/common/HistoryModal.vue`, opened with
`useHistory().open({ kode, endpoint })`). The modal does not know the module — any resource that
serves `GET /<resource>/:id/history` with this shape can use it.

`200`:

```json
{
  "data": [
    {
      "id": 3,
      "at": "2026-11-05T14:40:00.000Z",
      "actor": "Sri Wahyuni",
      "title": "Diubah",
      "kind": "updated",
      "summary": null,
      "changes": [{ "label": "Harga Satuan · Kulkas 2 Pintu", "from": "375.000", "to": "400.000" }]
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `at` | string | ISO timestamp of the event |
| `actor` | string | who did it (user name, or `Sistem` for automatic events) |
| `title` | string | display label of the event, e.g. `Dibuat`, `Diubah`, `Disetujui` |
| `kind` | enum | `created`, `updated`, `approved`, `rejected`, `info` — only drives the timeline dot colour |
| `summary` | string \| null | one-line context (reference number, reason…) |
| `changes` | array | field-level diff of an update: `label`, `from`, `to` — all **display-ready strings**, `–` for empty; `[]` when the event has none |

Events are returned **newest first**. Every successful write that changes a document appends one event;
deleting the document deletes its history. Unknown id → `404` with the module's own "tidak ditemukan" message.

## Closing-period lock (`locked`)

A document whose `date` falls in a closed period ([Posting & Closing](./posting/index.md), `period <= closed_until`) is **frozen**.

- Responses carry a read-only, server-computed `locked: boolean` on the record (omitted on create/update responses).
- While `locked`, the server refuses with `422 { "message": "Periode <bulan tahun> sudah closing, <alasan>" }` (no `errors` object): **edit**, **delete**, and every **approval change** (approve, reject, resubmit, cancel approval). Reading, printing and history stay allowed.
- The UI hides those actions and shows the shared `ClosingBadge` (lock icon + "Closing") instead.
- Applies to: [Jurnal Umum](./journal/index.md), [Jurnal Pemasukan](./journal-income/index.md), [Jurnal Pengeluaran](./journal-expense/index.md), [Order Pembelian](./purchase-order/index.md), [Penerimaan](./purchase-receipt/index.md), [Invoice](./purchase-invoice/index.md), [Uang Muka Supplier](./supplier-advance/index.md), [Retur Pembelian](./purchase-return/index.md). Retur settlements and Hutang Supplier payments are locked by their **own** `date` (see their modules).
- **Date into a closed period:** create and update (and, for journals, approve with a new `date`) with a `date` in a closed period is refused with `422 { "message": "Validasi gagal", "errors": { "date": ["Periode <bulan tahun> sudah closing, tanggal tidak boleh di periode yang sudah closing"] } }` — the form shows it on the date field.
- Invoice / retur **faktur pajak** (`PUT .../tax-invoice`) is locked with the record; [tax-invoice-import](./tax-invoice-import/index.md) marks locked rows `skipped` ("Periode sudah closing").
- Not covered: creating a receipt / invoice from a source document dated in a closed period (only the new document's own `date` is checked).

## Status field

Each endpoint file carries `status:` in frontmatter:

- `mock` — only the mock implements it; contract may still change.
- `implemented` — backend implements it and matches this file.
