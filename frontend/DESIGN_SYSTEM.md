# Design System — ERP Finance v2

Modern flat · Law of Proximity · Borderless Design · Functional Minimalism.
Data-heavy B2B finance UI: tenang, operasional, padat informasi.

## Prinsip → aturan

| Prinsip | Aturan konkret |
|---|---|
| **Borderless** | Panel = putih (`bg-panel`) di atas canvas abu (`bg-canvas`), **tanpa border, tanpa shadow**. Yang memisahkan permukaan adalah gap canvas (`gap-2` di app shell). Shadow (`shadow-overlay`) **hanya** untuk overlay: modal, dropdown, toast. |
| **Law of Proximity** | Grouping lewat **jarak**, bukan kotak/bar. Section di dalam form = `<section class="space-y-3">` dengan `<h3 class="subhead">` (label uppercase `text-ink-subtle`, **tanpa background** — bar abu `bg-fill` dulu terbaca box-in-box di antara input yang juga `bg-fill`), antar-section `space-y-8` di `<form>`. **Tidak ada nested card / box-in-box.** Kontrol serumpun rapat (`gap-2`). |
| **Functional Minimalism** | Hairline (`border-hairline`) dipakai hanya bila whitespace tak cukup: pembatas baris tabel, garis bawah header sticky, pemisah stat tile. Input **filled**: `bg-fill`, tanpa border; fokus pakai ring global. |
| **High density** | Base font **13px** (`text-m`). Skala tipe rapat. Tabel & form punya mode `comfortable`/`compact` (toggle di topbar, disimpan di `stores/ui`). |
| **Signature — numeric spine** | `font-mono` + `tnum` hanya bila kesejajaran digit membantu baca kolom: **nominal** (lewat `<Amount>`, rata kanan, negatif = merah + kurung) dan **tanggal**. Bukan untuk identifier (kode akun, nomor transaksi/faktur), telepon, atau nilai yang sudah jadi frasa ("30 hari", "Tunai") — itu teks biasa. Di input form, prop `mono` boleh untuk field berformat tetap (kode, NPWP, no. rekening, telepon) karena bantu mengeja; tidak untuk teks bebas. |

## Token (`src/assets/tokens.css`)

Warna disimpan sebagai channel RGB di CSS variable → alpha modifier Tailwind tetap jalan
(`bg-primary/10`), dan tema gelap tinggal menukar blok variable nanti.

| Grup | Token | Nilai | Tailwind |
|---|---|---|---|
| Surface | canvas / panel / fill / hairline | `#F7F8FA` / `#FFFFFF` / `#F2F3F5` / `#ECEEF1` | `bg-canvas` … |
| Ink | ink / ink-muted / ink-subtle | `#1A1D21` / `#5B6169` / `#8A9099` | `text-ink` … |
| Accent | **primary** | `#0E7C6B` (deep ledger-green) | `bg-primary` `text-primary-dark` `bg-primary-soft` |
| Semantik | danger / warning / success / info | `#C0362C` / `#B7791F` / `#0E7C6B` / `#2B6CB0` | `*-soft` untuk background |

> Ganti accent ke biru RICH `#3F6AD8`: ubah `--c-primary` (+`-dark`/`-soft`) di `tokens.css`. Satu tempat.

**Tipe:** Inter (teks, termasuk kode & nomor transaksi) + JetBrains Mono (nominal & tanggal — lihat numeric spine). Skala: `xs 10 · s 12 · m 13 (base) · l 14 · heading-s 16 · heading-m 20 · heading-l 28`.
**Radius:** `rounded-md` = 6px di mana-mana; `rounded-chip` = 4px. **Spacing:** kelipatan 4px.
**Lebar konten:** `DefaultLayout` sudah membungkus tiap halaman `mx-auto max-w-[1200px]`. Di dalamnya — halaman list: `<Panel>` full; halaman form: `<Panel class="max-w-5xl">` (form kecil `max-w-xl`) **rata kiri** (sejajar breadcrumb/judul), cap di Panel bukan di `<form>` dalam, jangan `mx-auto`.

## Komponen (`src/components/base/`)

Primitif: `Button` `Input` `Textarea` `Select` `Checkbox` `RadioGroup` `Switch`
`DatePicker` `FormField` · Data: `Table` `TablePagination` `TableLimitor` `Amount`
`StatTile` `Badge` · Layout: `Panel` `PageHeader` `FilterBar` `Tabs` `Breadcrumb` ·
Status: `EmptyState` `Skeleton` `Spinner` · Overlay: `Modal` `ConfirmDialog`.

`Input` punya slot `#suffix` (ikon/tombol di dalam field, mis. toggle password) dan prop `addon`
(label satuan menempel di kanan, gaya input-group Bootstrap — mis. `addon="hari"`).
`class` yang dilempar ke `Input` mengatur lebar wrapper, bukan `<input>`-nya.

`Table` API kompatibel dengan pola RICH (`rows` = definisi kolom, `columns` = data baris,
slot `#table-header` / `#table-content`, emit `handleSort`) — lihat `architecture.md`.

## Dark mode

Token & `darkMode: 'class'` sudah disiapkan. UI gelap **belum** dibangun — cukup
tambahkan blok `.dark { --c-… }` di `tokens.css` saat dibutuhkan.
