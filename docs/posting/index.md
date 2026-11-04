---
type: OKF Module
title: Posting & Closing
description: Posting workspace — period posting run plus monthly closing with a reconciliation overview and a guarded re-open.
tags: [posting, closing, reconciliation, accounting]
timestamp: 2026-11-05T22:00:00Z
---

# Posting & Closing

"Posting" is one workspace with two tabs, consumed by `frontend/src/views/posting/`:

- **Posting** — run the period posting (placeholder in the prototype: no real job breakdown yet).
- **Closing Bulanan** — FAT validates a period through the reconciliation overview, closes it, or re-opens the last closed period.

Company-scoped (`X-Company-Id`). Periods are `YYYY-MM`. Ports the legacy `posting` module (FUSI-438/439/553).

## Rules

- **Closing is sequential.** Only `next_period` (= `closed_until` + 1 month) can be closed, and only once it has started (`next_period <= current_period`).
- **Re-open** — only the last closed period (`closed_until`), one step back per action; `reason` is mandatory and logged. Needs special access (`can_reopen`).
- A re-opened period is **pending re-post**: it must be posted again (Posting tab) before the next closing can run.
- Reconciliation is **advisory**: a failed check is shown in red but does not block closing.
- Posting is rejected for a locked period (`period <= closed_until`).

## Entities

### `ClosingStatus`

| Field | Type | Notes |
|---|---|---|
| `closed_until` | string \| null | last closed period; `null` when nothing is closed |
| `next_period` | string | the period that can be closed next |
| `current_period` | string | the running month |
| `can_close` | boolean | `next_period <= current_period` and no pending re-post |
| `can_reopen` | boolean | user has re-open access **and** `closed_until` is not null |
| `history` | `ClosingHistory[]` | closed periods, newest first |
| `reopen_history` | `ReopenHistory[]` | re-open events, newest first |
| `repost_pending` | `{ period, posted }[]` | re-opened periods awaiting re-post; `posted: true` once re-posted |

`ClosingHistory`: `{ period, closed_by, closed_at, total_debit, total_credit, profit }` (snapshot at closing).
`ReopenHistory`: `{ period, reason, opened_by, opened_at }`.

### `ClosingReconciliation`

| Field | Type | Notes |
|---|---|---|
| `period` | string | |
| `closed` | boolean | `period <= closed_until` |
| `status` | enum | `ok`, `warning`, or `error` — worst of `checks` |
| `summary` | object | `{ total_debit, total_credit, profit }` for the period (approved journals) |
| `checks` | `ReconCheck[]` | `trial_balance`, `balance_sheet`, `pending_journals` |

`ReconCheck`: `{ key, label, status: 'pass'|'fail'|'warn', unit: 'rupiah'|'dokumen', rows: { label, value }[], difference: number }`.
`difference` is `0` for a passing check; for `pending_journals` it is the total pending count.

### `PostingRun`

`{ period, posted_by, posted_at }` — latest run per period.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/posting` | [list-posting](./list-posting.md) |
| POST | `/posting` | [run-posting](./run-posting.md) |
| GET | `/posting/closing` | [get-closing-status](./get-closing-status.md) |
| GET | `/posting/closing/reconciliation` | [get-closing-reconciliation](./get-closing-reconciliation.md) |
| POST | `/posting/closing` | [close-period](./close-period.md) |
| POST | `/posting/closing/reopen` | [reopen-period](./reopen-period.md) |
