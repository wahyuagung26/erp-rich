---
type: OKF Endpoint
title: Update Outlook Lampiran Row
method: PUT
path: /outlook/periods/:id/lampiran/:lampiran_id
status: mock
resource: outlook
timestamp: 2026-11-13T15:00:00Z
---

# Update Outlook Lampiran Row

Replaces the whole row: body `{ keterangan, sumber_dana, hari }` exactly as [create-lampiran](./create-lampiran.md) (`hari` replaces all per-day amounts). Returns `200 { data: { state }, message: "Lampiran disimpan" }`. Errors: `404` period/row (`Baris Lampiran tidak ditemukan pada periode ini`); `422` as create; locked period ([lock](./index.md#closing-period-lock)).
