# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173, mock API auto-enabled (check console for "[mock] API mocking enabled")
npm run build        # vue-tsc --noEmit && vite build — the CI gate
npm run typecheck     # vue-tsc --noEmit only
npm run format        # prettier --write src
npm run format:check
```

No test framework is configured. `npm run typecheck` + `npm run build` is the minimum bar. No
lint step beyond Prettier (tabs, no semicolons, single quotes, printWidth 150 — `.prettierrc`).

Demo login (mock mode, **not** auto-authenticated): `admin` / `password`.

## Build strategy: mock-first, per module

This is a standalone frontend prototype for a backend that doesn't exist yet — there is no
`backend/` to check against. The API contract lives in `../docs/<module>/` ([OKF
bundle](../docs/index.md): one Markdown file per endpoint, frontmatter `status: mock|implemented`).
It is the source of truth for both the mock and the eventual backend.

Order when building or changing a module: **1)** write/update `../docs/<module>/` →
**2)** implement `src/mocks/modules/<module>.ts` to match exactly → **3)** build the UI against
the mock. If the shape has to change while building UI, edit the `docs/` file in the same change.
A mock endpoint with no matching doc file, or vice versa, is a bug — fix or delete it, don't defer.

To point at a real backend: set `VITE_APP_API_URL` + `VITE_USE_MOCK=false` in `.env`. `main.ts`
only dynamically imports `src/mocks` when the flag is true, so this is zero application-code change.

## Architecture — the parts that span files

**Single axios instance + swappable mock.** All HTTP goes through `src/utils/api.ts`. In dev,
`src/mocks/index.ts` (the one entry point — lists `registerXxx` functions, one per module) attaches
`axios-mock-adapter` to _that same instance_. Shared in-memory state lives in the single
`src/mocks/db.ts` object (so cross-module reads, e.g. a dashboard aggregating journals, work); seed
data in `src/mocks/fixtures/`; `paginate` / `sortBy` / `ListParams` helpers in `src/mocks/lib.ts`.

**Backend envelope** (full detail in `../docs/conventions.md`): list responses are
`{ data: [], meta: { page, per_page, total, last_page } }` (flat, no nesting); item responses are
`{ data: {} }`. Requests send `page`, `per_page`, `sort_by`, `sort_order`, plus filter params.

**List pages run on `useTableList`** (`src/composables/useTableList.ts`):

```ts
const { columns, pagination, loading, limit, fetchList, handleSort, pageTo, applyFilters } = useTableList<Akun>({ endpoint: '/akun' })
```

Fetches on mount, refetches on page/limit/sort/filter change. Wire it to `<Table>` +
`<TablePagination>` (the one table footer: rows-per-page selector **and** page nav, rendered once
below the table) and a debounced `applyFilters` (wrap with `useDebounce`). `<Table>` is API-compatible
with the RICH table: `rows` = column defs `{ label, field, isSort?, align? }`, `columns` = row data,
slots `#table-header` / `#table-content`, emit `handleSort`. No outer border, no vertical rules,
hairline between rows, sticky header with hairline underline, hover tint.

**Feature module layout** — a module touches five places:

```
../docs/<module>/                          contract (OKF, one file per endpoint)
src/mocks/modules/<module>.ts               mock handlers, registered in src/mocks/index.ts
src/views/<module>/
├── schema.ts                               valibot schema + validate helper
├── pages/Page<X>Table|Tambah|Edit.vue       list / create / edit (Edit fetches by id)
└── components/Form<X>.vue                  shared by Tambah & Edit
src/routes/<module>.ts                      export default [...] satisfies RouteRecordRaw[]
                                             aggregated in src/routes/index.ts
src/constant/nav.ts                         nav entry
```

Full-screen pages (e.g. `/login`) are top-level routes, not nested; everything else nests under
`DefaultLayout` (the app shell — sidebar, topbar, `mx-auto max-w-[1200px]` content wrapper).

**Auth** (`stores/user.ts`): `login({ username, password })` → `POST /auth/login` → stores `token`

- `user` in `localStorage` (reload restores session); `logout()` clears both. A `401` on any
  non-login request clears the token and redirects to `/login`.

**Routing guard** (`src/router/index.ts`): unauthenticated → redirect `/login?redirect=...`;
authenticated hitting `/login` → `/dashboard`. `meta.roles` (`RoleName[]` from
`src/constant/roles.ts`) checked after auth. `meta.breadcrumb` feeds `<Breadcrumb>` (reads
`route.matched[*].meta.breadcrumb`). `RouteMeta` is augmented in `router/index.ts` itself.

**Global overlay state** is store-driven, mounted once in `DefaultLayout`:
`useConfirm().ask(opts, onConfirm)` → `stores/modal.ts` → `<ConfirmDialog>` (deferred-callback
pattern — the confirm action, e.g. a delete + toast + refetch, lives in the `onConfirm` callback,
not inline in the click handler); `useToast().success(msg)` → `stores/toast.ts` → `<ToastHost>`.

**Chrome state** (`stores/ui.ts`, persisted to localStorage): sidebar rail collapsed, and `density`
(`comfortable` | `compact`) which `<Table>` and forms read.

### Code conventions

- `<script setup lang="ts">`, props via `defineProps<{...}>()` / `withDefaults`
- Internal imports use the `@/` alias
- `try / finally` for async; set `loading = true` before, `false` in `finally`
- Empty state shows `'Tidak ada data'` or `'-'`
- UI strings are Bahasa Indonesia; code comments are English, one line where possible

## Design system

Full rules in `DESIGN_SYSTEM.md`. Enforced expectations when adding UI:

- **Borderless**: white `.panel` (`bg-panel`) on grey `bg-canvas`, no borders, no shadows in-page.
  Surfaces separate via canvas gap, not box/border. `shadow-overlay` only on modals/dropdowns/toasts.
  No nested cards / box-in-box.
- **Proximity over dividers**: group with spacing, not boxes/bars. Form sections =
  `<section class="space-y-3">` + `<h3 class="subhead">` (plain uppercase label, **no background**
  — a grey bar reads as box-in-box next to `bg-fill` inputs), `space-y-8` between sections in
  `<form>`. A hairline (`border-hairline`) is a last resort: table row dividers, sticky header
  underline, stat-tile separators.
- **Outlined inputs** (`border border-ink-subtle/30 bg-panel` — white field with a light border, like dashboard-kpi-it; disabled → `bg-fill`); focus uses the global ring.
- **High density**: base font 13px (`text-m`). Table/form `comfortable`/`compact` modes toggle via
  topbar, persisted in `stores/ui`.
- **Numeric spine**: `.tnum` (Inter tabular digits) only where digit-alignment aids column scanning — **never a monospace font; numbers, codes and dates use the same Inter family as every other field** — amounts
  (via `<Amount>`, right-aligned, negatives red + parentheses) and dates. NOT identifiers (account
  code, transaction/invoice number), phone, or formatted phrases ("30 hari") — those are plain
  Inter. `<Input mono>` now only turns on `.tnum` for fixed-format entry (code, NPWP, phone) — it does not change the font family.
- Colors are RGB-channel CSS variables in `src/assets/tokens.css` (Tailwind alpha modifiers work,
  e.g. `bg-primary/10`; dark mode is a future `.dark {}` block — tokens and `darkMode: 'class'` are
  ready but no dark UI exists yet). Accent `primary` = `#0E7C6B`; changing it is one edit in
  `tokens.css`. Semantic names (`primary/danger/warning/success/info`, plus
  `canvas/panel/fill/hairline/ink`) match RICH.
- Type scale: `xs s m l heading-s heading-m heading-l` (base is `m` = 13px). Radius: `rounded-md`
  (6px) everywhere, `rounded-chip` (4px) for chips. Spacing in multiples of 4px.
- The Tailwind palette is **replaced, not extended** — only the tokens above plus
  `white`/`black`/`transparent`/`current` exist. No `gray-*`, `blue-*`, etc. Use arbitrary values
  (`bg-[#121925]`) only for one-off brand surfaces (the `views/auth/` navy panel).
- **Content width**: `DefaultLayout` already wraps every page `mx-auto max-w-[1200px]` — never put
  `max-w-*` on a page's root element. Every page (list, tambah/edit, detail) uses `<Panel>` full
  width, identical to the list — never `max-w-5xl`/`max-w-xl` on `Panel` or its wrapper. Cap width
  only on short fields (code/identifier `max-w-[200px]`, city `max-w-xs`, days `w-24`, NPWP `w-72`);
  free-text fields (name, address, notes) stretch to the Panel width.
- **Reference dropdowns**: any dropdown whose options come from another module's data (Brand,
  Branch, Account, Sub Account, Account Group, Supplier, etc.) **must** use `<AsyncSelect>` (search
  - infinite scroll, `initial-label` from the denormalized code/name on edit) — never `<Select>`,
    which loads everything at once. `<Select>` is for fixed enums only (status, type). Reference:
    `FormProduct.vue`, `FormSalesExpense.vue`.
- **Action button placement**: form pages (Tambah/Edit) put primary actions at the **end of the
  flow** (Simpan/Batal after all fields). Detail/read-only pages put all actions **top-right** via
  `PageHeader #actions`, ordered `[← Kembali] [✎ Edit] [🗑 Hapus]` (all iconed, matching the table
  row-action icons: Kembali = subtle + `IconArrowLeft`, Edit = primary + `IconPencil`, Hapus =
  subtle + `IconTrash`). Since `Panel` is full width, `PageHeader` actions align to its right edge
  automatically — no extra wrapper needed.
- `FilterBar` shows a reload button when given `@refresh` (e.g. `<FilterBar :loading="loading"
@refresh="runSearch">`) — every list page wires this; an explicit "apply filter & reload" is
  expected, not instant-filter-as-you-type alone.
- `Input` has a `#suffix` slot (trailing icon/button, e.g. password toggle) and an `addon` prop
  (unit label glued to the right, e.g. `addon="hari"`). `class` passed to `Input` sizes the wrapper,
  not the `<input>` itself.

`views/auth/LoginView.vue` keeps the legacy split-screen layout and navy Rahadhyan brand panel, but
the form uses design-system components (`<Input>`, `<Button>`, `<FormField>`, tokens). Its card has
a border + `shadow-overlay` since it floats on a white panel and needs the definition.
