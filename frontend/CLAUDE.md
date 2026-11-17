# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
cp .env.example .env   # first setup only: .env is gitignored (local); .env.example is the committed default
npm run dev          # http://localhost:5173, mock API auto-enabled (check console for "[mock] API mocking enabled")
npm run prototype    # vite + the same mock served over HTTP on :3100 (no .env edit); Ctrl-C stops both
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
hairline between rows, sticky grey (`bg-fill`) rounded header band, hover tint, and the `field: 'action'` column pinned to the right edge (sticky, with a divider while content is cut off) so a wide table never needs a sideways scroll to reach row actions.

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

Shared document overlays follow the same pattern and take only an `endpoint` that follows a shared contract
(`docs/conventions.md` / `docs/purchase-invoice/index.md`), so any module can reuse them:
`useHistory().open({ kode, endpoint })` → `<HistoryModal>` (`GET /<resource>/:id/history`) and
`useFakturPajak().open({ kode, endpoint, onSaved })` → `<FakturPajakModal>`. In the mock, every write handler
calls `recordHistory()` (`mocks/history.ts`) so the timeline fills as you use the app.

**Chrome state** (`stores/ui.ts`, persisted to localStorage): sidebar rail collapsed, `feel`
(`cold` | `warm`: tints neutral surfaces + sidebar, brand primary untouched) and `contentWidth` (`narrow` | `full`).

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
  `<form>`. A hairline (`border-hairline`) is a last resort: table row dividers,
  stat-tile separators.
- **Outlined inputs** (`border border-ink-subtle/30 bg-panel` — white field with a light border, like dashboard-kpi-it; disabled → `bg-fill`); focus uses the global ring.
- **Grid cells are ghost inputs** (owner 2026-11-16): inside a table/matrix with many editable cells (Budget matrix, Outlook grids) use `<Input ghost>` / `<MoneyInput ghost>` / `GridInput` — plain text until hovered (`bg-fill` tint) or focused (outline), no per-cell border, no `Rp` block, no pencil button. Cells stay real always-live inputs, so Tab/Enter and form drafts keep working (do NOT use `InlineEdit` there: its blur cancels). Stack at most two ghost lines in a cell; quick-fill actions are icon buttons, not text buttons. An empty cell shows no border either (owner 2026-11-16); the hover tint is the affordance. Standalone form fields stay outlined. **A cell holding one value fills its whole `td` Excel-style** (owner 2026-11-16): the `td` has no padding (`!p-0`), the input is square with no resting border (`GridInput` and `<MoneyInput cell>` fill the td with `absolute inset-0`, so the td is `relative !p-0` or sticky and the row height comes from other cells, e.g. `h-[27px]` on the name cell; `MoneyInput` also needs `!absolute inset-0` as class; `<Input cell>` stays in flow), hover tints the whole cell, focus is a solid 2px inset `ring-primary` border.
- **Matrix / grid tokens** (owner 2026-11-16; Budget matrices and Outlook grids must match): text `text-s` (12px); header cells `bg-fill`, `text-ink-muted`, weight 600 (same as `<Table>`); group bands (OPEX, CASH IN/OUT) `bg-ink-muted` with white text, weight 600; subtotal/footer rows `bg-fill`, weight 600; row separators `border-hairline`; numbers via `<Amount>` or `tnum`. Only density may differ per grid (cell padding, band height). A new matrix reuses these values, never its own black/grey or 13px. Label columns (Kategori, Akun) wrap onto a second line, never `truncate` with an ellipsis (`break-words` + `!whitespace-normal`, a min row height such as `h-[27px]`).
- **Matrix group separators** (owner 2026-11-17; Budget/Revisi `BudgetMatrix`, `RealizationMatrix` and the three Outlook grids; Outlook uses `border-l border-l-ink-subtle/30` on the first cell of a group plus the global `.weeks-band` background for spanned band/add rows, `--wk` = one week, `--sub` = start of its second group): groups of columns (YTD | quarter or month | totals) are divided by a vertical `inset 1px` shadow in `--sep` on the group's first cell, never a per-cell border, so widths do not change and the line stays continuous through every header row, data row, subtotal, footer and band row. Band rows keep real frozen YTD / Total cells (only the month cells are one spanned cell, `.months-band`, which draws the lines as a repeating background sized by `--grp`), so a group line scrolling under a frozen column is hidden in every row type alike; the frozen YTD column owns its right-edge line (outer shadow). The background depends on fixed column widths: change a column width and `--grp` / the 448px must change with it.
- **High density**: base font 13px (`text-m`); one fixed table/form density (no toggle).
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
- **Transaction references** (PO, penerimaan, invoice, SO a form is created from): `<ReferencePicker>` (modal with a detail table, search + paging, click a row), not a dropdown — users want the detail before committing. Same props as `AsyncSelect` plus `title` and `:columns`. When the form copies data from the reference (lines, header), pass `:reset-warning="draft.lines.length ? '…' : undefined"`: changing/clearing then asks to confirm and emits nothing on Batal. Reference: `FormPurchaseReceipt.vue`.
- **Reference dropdowns** (master data only): any dropdown whose options come from another module's data (Brand,
  Branch, Account, Sub Account, Account Group, Supplier, etc.) **must** use `<AsyncSelect>` (search
  - infinite scroll, `initial-label` from the denormalized code/name on edit) — never `<Select>`,
    which loads everything at once. `<Select>` is for fixed enums only (status, type). Reference:
    `FormProduct.vue`, `FormSalesExpense.vue`.
- **Row actions**: the action column of a list table is one `<RowActions :id base @remove :can-modify>` kebab menu (Detail / Edit / Hapus), never a row of icon buttons — it stays one icon wide however many actions a row has. `can-modify=false` leaves only "Detail". Extra items: `:actions="[{ label, icon, onClick, danger?, hidden? }]"` (render between Edit and Hapus, still shown when `can-modify` is false).
- **Inline edit in tables**: a table whose cells save on their own (Harga Produk) uses `<InlineEdit kind="money|number|text" :model-value @save>` — value + pencil, click → input + ✓ (Enter saves, Esc/blur cancels), like dashboard-kpi-it. Grids that submit with a form (e.g. PO/receipt lines) keep plain always-visible inputs.
- **Responsive variants render ONE, never both**: when desktop and phone need different markup (e.g. table → per-row cards), switch with `useIsMobile()` (`src/composables/useIsMobile.ts`, matchMedia < 640px) and `v-if="isMobile"` / `v-else` — never render both and hide one with `hidden sm:block`. Pure sizing tweaks on a single element (`max-sm:w-full`, `sm:grid-cols-3`) stay as CSS classes. Reference: `views/cash-position/pages/PageCashPosition.vue`.
- **Action button placement**: form pages (Tambah/Edit) put primary actions at the **end of the
  flow, right-aligned** (`flex flex-wrap justify-end gap-2`; Batal secondary, then Simpan). Detail/read-only pages put all actions **top-right** via
  `PageHeader #actions`, ordered `[← Kembali] [✎ Edit] [🗑 Hapus]` (all iconed, matching the table
  row-action icons: Kembali = subtle + `IconArrowLeft`, Edit = primary + `IconPencil`, Hapus =
  subtle + `IconTrash`). Since `Panel` is full width, `PageHeader` actions align to its right edge
  automatically — no extra wrapper needed.
- **List toolbar: at most 3 controls, search included** (owner rule 2026-11-16). Any further filter goes in `<AdvancedFilter :count @reset>` (button "Filter Lanjutan" + right `<Drawer>`), placed inside the `<FilterBar>`. The drawer controls bind to the page's own filter refs and apply at once (so KPI tiles that preset those refs keep working); `count` is how many drawer filters are active (badge), `@reset` clears them. Keep the date range (`DateRangePicker`, wide popover) in the toolbar, never in the drawer. When a page filters by one of several dates ("Tanggal Invoice" / "Jatuh Tempo"), the date-type select and the range are ONE control, counted once: `<DateRangePicker v-model:field :field-options>`. Reference: `PageSupplierPayableTable.vue`.
- **Keyword search is debounced** (owner 2026-11-17): a search input calls its fetch through `useDebounce(fn)` with no wait argument, so every list, `AsyncSelect` and `ReferencePicker` share `SEARCH_DEBOUNCE_MS` (400 ms, `composables/useDebounce.ts`) — never hard-code a number. `useTableList` and `AsyncSelect` apply only the newest response, so a slow earlier request cannot overwrite a later search.
- `FilterBar` shows a reload button when given `@refresh` (e.g. `<FilterBar :loading="loading"
@refresh="runSearch">`) — every list page wires this; an explicit "apply filter & reload" is
  expected, not instant-filter-as-you-type alone.
- `Input` has a `#suffix` slot (trailing icon/button, e.g. password toggle) and an `addon` prop
  (unit label glued to the right, e.g. `addon="hari"`). `class` passed to `Input` sizes the wrapper,
  not the `<input>` itself. Same for `Select`: both are `w-full` themselves, so a plain `w-24` / `flex-1` class on them loses and the box collapses or stretches (Duplikasi modal month box was 46px and read blank). Use `!w-*`, `max-w-*`, or put the component in a sized wrapper (`<div class="w-24 shrink-0">`).

`views/auth/LoginView.vue` keeps the legacy split-screen layout and navy Rahadhyan brand panel, but
the form uses design-system components (`<Input>`, `<Button>`, `<FormField>`, tokens). Its card has
a border + `shadow-overlay` since it floats on a white panel and needs the definition.
