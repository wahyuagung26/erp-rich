---
type: OKF Endpoint
title: Delete Outlook Lampiran Row
method: DELETE
path: /outlook/periods/:id/lampiran/:lampiran_id
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Delete Outlook Lampiran Row

Deletes the row with its per-day amounts. Returns `200 { data: { state }, message: "Lampiran dihapus" }`. Errors: `404` period/row; locked period ([lock](./index.md#closing-period-lock)).
