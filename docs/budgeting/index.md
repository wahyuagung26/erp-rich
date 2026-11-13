---
type: OKF Module
title: Budgeting
description: Annual budgets, revision workflow and realization comparison.
tags: [budgeting, finance]
timestamp: 2026-11-13T12:00:00Z
---

# Budgeting

Annual planning by company, department and year. Every endpoint is company-scoped and must enforce the user's accessible departments; a user without access sees no documents. All-department reporting requires explicit authorization. The prototype mock grants the demo user all company departments and uses illustrative realization data; it is not a ledger.

## Documents

A document has `id`, `company_id`, `number`, `department_id`, `department_code`, `department_name`, `year`, `description`, `status`, `created_at`, `lines`, `total`, `history` and `ytd_snapshot`, `ytd_snapshot_year`, `ytd_snapshot_month` (null until approval; month 0 means no completed month). A revision additionally has `budget_id`, `budget_number`, `initial_lines`, `initial_total` and `revision_month_start`; a budget additionally has `revisions`. Each history event has `action`, `at`, `by` (actor name), `from`, `to` and `note`. Each line has `account_id`, `account_code`, `account_name`, `section`, `prefix` (`EXP` for OPEX accounts, `CPX` for CAPEX), `sign` (+1 revenue, -1 expense/CAPEX), `code`, `description`, and `months` (exactly 12 nonnegative numbers). Total is the sum of monthly values multiplied by the account's sign; CAPEX reduces profit after capital expenditure. Detail codes follow the legacy format `AWALAN/OBG{tahun}/KODE_DEPT/NNN` (no hyphen before the year, KODE_DEPT exactly 3 characters, at most 50 characters), for example `EXP/OBG2027/FAT/001`; the prefix must match the account's group, the year must equal the budget year, and the code is case-insensitively unique across active company budgets. Department and year are immutable on update. Cancelled budgets are hidden from the budget list.

Only one non-cancelled budget exists per company/department/year. Draft and Ditolak can be edited, submitted or cancelled; Diajukan can be approved or rejected with a note. Only approved budgets without any revision may be unapproved. Approval freezes account-level current-year YTD up to the previous completed month. Revisions are based on an approved budget, within an open current-year period; only one non-cancelled revision per budget. Months before the later of the period start month and current month retain original amounts. Revision preserves original line identities; amounts in editable months may change. Revision percentage change is `(revised - initial) / abs(initial)` when initial is nonzero, otherwise +100%, -100%, or 0% according to the revised total. Approved revisions are effective in realization; draft and rejected revisions are not. Budgeting does not post a journal or stock movement, so ledger closing does not by itself lock these annual planning documents; the revision period controls revisable months.

Realization in the eventual backend is derived from company-scoped approved manual and automatic journals, filtered to permitted departments, and compared by account, not by detail code. Company-wide mode requires the all-department permission, including journals without a department. Historical approved documents without a YTD snapshot must show it unavailable, not recalculate it as if frozen.

## Endpoints

| Method | Path | Contract |
|---|---|---|
| GET | `/budgeting/budgets` | [list-budgets](./list-budgets.md) |
| GET | `/budgeting/budgets/:id` | [get-budget](./get-budget.md) |
| POST | `/budgeting/budgets` | [create-budget](./create-budget.md) |
| PUT | `/budgeting/budgets/:id` | [update-budget](./update-budget.md) |
| POST | `/budgeting/budgets/:id/actions` | [action-budget](./action-budget.md) |
| GET | `/budgeting/revisions` | [list-revisions](./list-revisions.md) |
| GET | `/budgeting/revisions/:id` | [get-revision](./get-revision.md) |
| POST | `/budgeting/revisions` | [create-revision](./create-revision.md) |
| PUT | `/budgeting/revisions/:id` | [update-revision](./update-revision.md) |
| POST | `/budgeting/revisions/:id/actions` | [action-revision](./action-revision.md) |
| GET | `/budgeting/accounts` | [list-accounts](./list-accounts.md) |
| GET | `/budgeting/period` | [get-period](./get-period.md) |
| PUT | `/budgeting/period` | [update-period](./update-period.md) |
| POST | `/budgeting/import/preview` | [preview-import](./preview-import.md) |
| POST | `/budgeting/import/commit` | [commit-import](./commit-import.md) |
| GET | `/budgeting/ytd` | [get-ytd](./get-ytd.md) |
| GET | `/budgeting/realization` | [get-realization](./get-realization.md) |
| POST | `/budgeting/realization/recalculate` | [recalculate-realization](./recalculate-realization.md) |

## Excel prototype

The form can download an XLSX template and load a single department's rows into the form. Import validates the sheet header, then reports each row as OK, warning (all twelve months zero) or error (unknown account, malformed or duplicate code, wrong year or prefix, missing description, negative or non-numeric amount). Rows with errors are skipped, the rest are loaded; loading replaces every current form line only after the user confirms, and does not save the document. Normal server validation runs again on save, including codes already used by other budgets. The template and import run in the browser for the prototype. Document detail and realization export XLSX; realization percentages are stored as fractions with percentage number format. Multi-department import has an atomic preview and commit; ledger recalculation is not implemented in the mock.
