---
type: OKF Module
title: Company (Master Company)
description: CRUD for company master data — identity, type, status, and per-company report styling. Soft-delete.
tags: [company, master-data]
timestamp: 2026-09-05T00:00:00Z
---

# Company

Master data for companies / badan usaha. Consumed by `frontend/src/views/company/`
(list, detail, tambah, edit). Fields mirror the legacy "Form Perusahaan" screen
(Informasi Perusahaan + Pengaturan).

Unlike [customer](../customer/index.md) / [supplier](../supplier/index.md), `code` is
**entered by the user** and must be unique — it is not server-assigned.

## Entity: `Company`

| Field | Type | Notes |
|---|---|---|
| `id` | number | auto-increment, server-assigned |
| `code` | string | **required, user-entered, unique**; short handle e.g. `RIN` — "Kode Perusahaan" |
| `short_name` | string | required; min 2 — "Nama Pendek" e.g. `PT RIN` |
| `legal_name` | string | optional — "Nama Legal / PT" e.g. `PT Rahadhyan Integrasi Nusantara` |
| `npwp` | string | optional; tax number |
| `logo_url` | string | optional; data URL or hosted URL of the company logo (JPG/PNG/GIF/WEBP, ≤ 2 MB). Empty keeps the current logo on update |
| `address` | string | optional — "Alamat" |
| `company_type` | string | required; one of `pt` `cv` `ud` `firma` `perorangan` `koperasi` `yayasan` — "Tipe Perusahaan" |
| `hr_enabled` | boolean | "Pendataan Karyawan?" — enable this company for the HR module |
| `report_header_color` | string | hex `#RRGGBB`; header background for all report previews / Excel exports of this company. Default `#B0F2B1` |
| `deleted_at` | string \| null | soft-delete marker (ISO 8601); non-null rows are excluded from every list and from get-by-id. **This is the only active/inactive concept — there is no separate status field**; a company is "nonaktif" by being soft-deleted |

## Endpoints

| Method | Path | File |
|---|---|---|
| GET | `/company` | [list-company](./list-company.md) |
| GET | `/company/:id` | [get-company](./get-company.md) |
| POST | `/company` | [create-company](./create-company.md) |
| PUT | `/company/:id` | [update-company](./update-company.md) |
| DELETE | `/company/:id` | [delete-company](./delete-company.md) |
