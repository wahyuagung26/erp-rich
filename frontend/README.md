# ERP Finance v2 — Frontend

Starterkit frontend untuk ERP finance B2B. Vue 3 + Vite + TypeScript, dengan
design system flat/borderless bawaan dan mock API (tanpa backend).

## Jalankan

```bash
npm install
npm run dev          # http://localhost:5173 — mock API aktif
```

Cek console: `[mock] API mocking enabled`.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server (mock API) |
| `npm run build` | `vue-tsc` + build produksi |
| `npm run typecheck` | Type-check saja |
| `npm run format` | Prettier |

## Rute

| Path | Isi |
|---|---|
| `/login` | Login v2 (layout sama dg ERP legacy). Demo: `admin` / `password` |
| `/dashboard` | Stat tiles + jurnal terakhir |
| `/akun` | Bagan Akun — CRUD lengkap (list, tambah, edit, hapus) |
| `/jurnal` | Jurnal Umum — list + form multi-baris debit/kredit |
| `/design-system` | Showcase semua token & komponen |

## Strategi: frontend dulu

Semua UI dibangun dulu di atas mock, per modul. Backend menyusul setelah layar
sebuah modul selesai. Kontrak API tiap modul ditulis di
[`../docs/<module>/`](../docs/index.md) (OKF) — itu source of truth, mock & backend ikut.

Alur per modul: tulis `docs/<module>/` → buat `src/mocks/modules/<module>.ts`
sesuai doc → bangun UI.

## Sambung ke backend

1. Set `VITE_APP_API_URL` di `.env`.
2. Set `VITE_USE_MOCK=false` → `src/mocks` tidak di-load, `src/utils/api.ts`
   langsung menembak backend. Tidak ada kode aplikasi yang berubah.

Kontrak lengkap: [`../docs/`](../docs/index.md) (mulai dari `conventions.md`).

## Dokumen

- [`../docs/`](../docs/index.md) — kontrak API (OKF bundle).
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — prinsip visual + token.
- [`architecture.md`](./architecture.md) — struktur, konvensi, pola.
