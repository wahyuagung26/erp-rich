---
type: OKF Endpoint
title: Create Outlook Period
method: POST
path: /outlook/periods
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Create Outlook Period

Body `{ year, month }`. Creates the period with 5 weeks, all day columns empty, no categories, no opening balance. Returns `201 { data: { state }, message: "Periode dibuat" }`.

Errors: `422` invalid year/month; `422` month already closed in Posting (`Periode <bulan tahun> sudah closing, periode Outlook tidak bisa dibuat`); `409 { message: "Periode <bulan tahun> sudah tersedia" }` when it exists; `422 { message: "Pilih perusahaan aktif terlebih dahulu" }` without a company.

See [Outlook Daily](./index.md) and [duplicate-period](./duplicate-period.md) (the way categories get into a new period).
