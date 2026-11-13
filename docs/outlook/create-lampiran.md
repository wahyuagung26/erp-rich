---
type: OKF Endpoint
title: Create Outlook Lampiran Row
method: POST
path: /outlook/periods/:id/lampiran
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Create Outlook Lampiran Row

Body `{ keterangan, sumber_dana, hari }`. `keterangan` required, whitespace collapsed, ≤ 255 chars. `sumber_dana` `CASH_IN` | `CASH_OUT`. `hari` = `{ "<day number 1..days in month>": amount }`; zero/empty entries are dropped, a day outside the month or a non-number is an error.

Returns `201 { data: { state, result: { id } }, message: "Lampiran ditambahkan" }`. Errors: `404`; `422 { message: "Data Lampiran tidak valid", errors: { keterangan | sumber_dana | hari: [..] } }`; `422` at 500 rows; locked period ([lock](./index.md#closing-period-lock)).

The UI keeps a new row as a local draft until Keterangan and Sumber Dana are filled, then creates it; existing rows save automatically through [update-lampiran](./update-lampiran.md). See [Outlook Daily](./index.md#lampiran).
