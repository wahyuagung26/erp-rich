---
type: OKF Module
title: Dashboard
description: Read-only financial summary for the current period.
tags: [dashboard, summary]
timestamp: 2026-09-03T00:00:00Z
---

# Dashboard

Consumed by `frontend/src/views/dashboard/index.vue`. Read-only; aggregates data
owned by [jurnal](../jurnal/index.md) and (later) other modules.

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/dashboard/summary` | [dashboard-summary](./dashboard-summary.md) |
