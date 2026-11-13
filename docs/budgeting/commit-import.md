---
type: OKF Endpoint
title: Commit Multi-Department Import
method: POST
path: /budgeting/import/commit
status: mock
resource: budgeting
timestamp: 2026-11-13T00:00:00Z
---

# Commit Multi-Department Import

Accepts the same body as [preview](./preview-import.md). Revalidate the complete batch under an appropriate company-level serialization gate and commit atomically; no document changes if any department fails. New budgets are Draft; replaced Draft or Ditolak documents retain status and document number. Return `{data: {documents: [{id, number, department_name}]}}`. A preview is advisory and never substitutes for commit-time validation. See [Budgeting](./index.md).
