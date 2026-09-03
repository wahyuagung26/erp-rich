# Architecture & Standards — ERP Finance v2 Frontend

Adaptasi standar RICH FE (`FE-INTEGRASI-*`) untuk aplikasi **standalone** (tanpa
module federation), dengan **TypeScript** dan design system flat bawaan.

## 1. Stack

| Aspek | Pilihan |
|---|---|
| Framework | Vue 3.5 (`<script setup lang="ts">`) |
| Build | Vite 7 |
| Bahasa | **TypeScript** (strict) |
| State | Pinia 3 (Options-store style) |
| Routing | Vue Router 4 (history) |
| HTTP | Axios — satu instance `src/utils/api.ts` |
| Mock | `axios-mock-adapter` di-attach ke instance yang sama (dev only) |
| Styling | Tailwind 3.4 + token CSS variable + `@layer components` |
| Validasi | `valibot` |
| Ikon | `@tabler/icons-vue` |
| Tanggal | `dayjs` |
| Format | Prettier — tab, tanpa semicolon, single quote, printWidth 150 |

## 2. Struktur

```
src/
├── assets/          tokens.css (design token) + main.css (@tailwind + @layer)
├── components/
│   ├── base/        primitif design system (lihat DESIGN_SYSTEM.md)
│   └── common/      AppSidebar, AppTopbar, UserMenu, DensityToggle, ToastHost
├── composables/     useTableList, useToast, useConfirm, useDebounce, onClickOutside
├── constant/        roles.ts, nav.ts
├── layouts/         DefaultLayout (app shell). Halaman full-screen (LoginView) berdiri sendiri.
├── router/          index.ts — instance + guard (auth → /login, meta.roles)
├── routes/          index.ts (aggregator) + satu file per modul
├── stores/          user (login/logout + session restore), ui (rail/density), modal, toast
├── utils/           api.ts, format.ts (money/date), parseQuery.ts, deviceId.ts, types.ts
├── mocks/           index.ts (startMock, satu pintu) + modules/<m>.ts + db.ts + lib.ts + fixtures/
└── views/           satu folder per modul (auth, dashboard, akun, jurnal, design-system)
```

Kontrak API ditulis di `../docs/<modul>/` (OKF bundle) dan jadi source of truth —
lihat `../docs/index.md`. Alur per modul: tulis `docs/<modul>/` → buat mock
`src/mocks/modules/<modul>.ts` sesuai doc → bangun UI.

### Pola modul (`views/<modul>/`)

```
views/akun/
├── schema.ts                 valibot schema + validate helper
├── pages/
│   ├── PageAkunTable.vue     list: FilterBar + Table + Pagination
│   ├── PageAkunTambah.vue    create
│   └── PageAkunEdit.vue      edit (fetch by id)
└── components/
    └── FormAkun.vue          form dipakai ulang oleh Tambah & Edit
```

Route modul: `src/routes/<modul>.ts` → `export default [...] satisfies RouteRecordRaw[]`,
diagregasi di `src/routes/index.ts`.

## 3. Data flow list (composable `useTableList`)

```ts
const { columns, pagination, loading, limit, fetchList, handleSort, pageTo, applyFilters } =
  useTableList<Akun>({ endpoint: '/akun' })
```

- fetch saat `onMounted`, re-fetch saat page / limit / sort / filter berubah
- kirim: `page`, `per_page`, `sort_by`, `sort_order`, `...filters`
- baca: `res.data.data` (list), `res.data.meta` (flat: `page` / `per_page` / `total` / `last_page`)
- search: bungkus `applyFilters` dengan `useDebounce`

## 4. Tabel (`components/base/Table.vue`)

API kompatibel dengan RICH:

| Prop | Tipe | Isi |
|---|---|---|
| `rows` | `TableRow[]` | definisi kolom `{ label, field, isSort?, align? }` |
| `columns` | `Record<string,unknown>[]` | data baris |
| `loading` | `boolean` | spinner di tbody |
| `density` | `'comfortable' \| 'compact'` | padding sel |

Slot: `#table-header={ row, index }`, `#table-content={ row, column, index, rowIndex }`.
Emit: `handleSort(row)`. Visual: tanpa border luar, tanpa garis vertikal, hairline
antar-baris, header sticky + garis bawah hairline, hover tint.

## 5. API

```ts
import api from '@/utils/api'
await api.get('/akun', { params: { page, per_page } })
await api.post('/akun', payload)
await api.put(`/akun/${id}`, payload)
await api.delete(`/akun/${id}`)
```

- Bearer token dari `localStorage.token` via request interceptor
- 401 (selain `/auth/login`) → hapus token + redirect `/login`
- Login: `useUserStore().login({ username, password })` → `POST /auth/login`. Mock mode
  **tidak** auto-login; kredensial demo `admin` / `password`. Sesi bertahan setelah reload
  (token + user di localStorage). Kontrak: `../docs/auth/`.
- Mock: `src/mocks/modules/<modul>.ts` (didaftar di `src/mocks/index.ts`), state di
  `src/mocks/db.ts` — in-memory, mutasi bertahan selama sesi. Tiap endpoint ada
  kontraknya di `../docs/<modul>/`.

## 6. State (Pinia)

```ts
export const useXxxStore = defineStore('xxx', {
  state: () => ({ ... }),
  getters: { ... },
  actions: { ... }
})
```

Confirm dialog — pola deferred callback:

```ts
const { ask } = useConfirm()
ask({ title, message, type: 'danger', confirmText: 'Hapus' }, async () => {
  await api.delete(`/akun/${id}`)
  toast.success('Akun dihapus')
  fetchList()
})
```

Toast: `const toast = useToast(); toast.success('...')`.

## 7. Routing

Route meta (typed di `router/index.ts`): `auth?`, `roles?: RoleName[]`, `breadcrumb?`.
Guard `beforeEach` cek `meta.auth` terhadap `useUserStore` (di mode mock user selalu
ada), lalu `meta.roles`. `Breadcrumb.vue` menyusun trail dari `route.matched[*].meta.breadcrumb`.

## 8. Konvensi kode

- `<script setup lang="ts">`, props via `defineProps<{...}>()` / `withDefaults`
- import internal pakai alias `@/`
- `try / finally` untuk async; `loading` di-set `true` sebelum, `false` di `finally`
- teks UI Bahasa Indonesia; komentar kode Bahasa Inggris, satu baris
- empty state tampilkan `'Tidak ada data'` atau `'-'`

## 9. Testing

Belum dikonfigurasi. `npm run typecheck` + `npm run build` adalah gate minimum.
