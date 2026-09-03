# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

`erp-finance-v2/` is the modern rewrite of the legacy CodeIgniter app **ERP-FUSIDIGITAL**
(accounting/finance ERP: jurnal, laporan, retur, pembelian, perpajakan, akses departemen).

- `frontend/` — Vue 3 + TypeScript SPA (built out; all work happens here for now).
- `docs/` — the API contract (OKF bundle). Source of truth for both mock and backend.
- `backend/` — empty placeholder.

Not a git repo yet. Business/meeting context lives at
`/Users/wahyuagung/Sites/RIN/knowledge/ERP-FUSIDIGITAL/` — consult it before finance-domain work.

## Build strategy: frontend-first prototype

Build **all UI against the mock first**, module by module. The backend is written
only after the screens for a module are done and its contract has settled. Therefore:

**When you build or change a frontend module, the API contract in `docs/<module>/`
is part of that work — not an afterthought.** Order per module:

1. Write / update the endpoint files in `docs/<module>/` (see below).
2. Implement the mock in `frontend/src/mocks/modules/<module>.ts` to match them exactly.
3. Build the UI against the mock.

If the shape has to change while building the UI, change the `docs/` file in the
same commit. A mock endpoint with no matching `docs/` file is a bug.

### `docs/` — Open Knowledge Format bundle

`docs/` is an [OKF](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)
bundle: a directory tree of Markdown files with YAML frontmatter, **one file per
endpoint**, the file path is the identity. Structure:

```
docs/
├── index.md            # module registry
├── conventions.md      # envelope, pagination, auth, errors — every endpoint inherits this
├── _TEMPLATE.md        # copy this for a new endpoint
└── <module>/
    ├── index.md        # entity shape + endpoint list
    └── <verb>-<resource>.md   # one endpoint (frontmatter: type, title, method, path, status, resource, ...)
```

`status:` in frontmatter tracks reality: `mock` (only the mock has it) → `implemented`
(backend matches the file). Keep endpoint files terse; link related concepts with
Markdown links (`[create-akun](./create-akun.md)`).

### Keeping mock ⇄ docs ⇄ UI in sync

These three sets must stay 1:1 — one endpoint = one `docs/<module>/<x>.md` file =
one handler in `src/mocks/modules/<module>.ts`, and every endpoint is called by some
view or composable. On **any** change to a module, reconcile all three before finishing:

- **Add** an endpoint → doc file + mock handler + wire the caller, same commit.
- **Change** a request/response shape → edit the doc first, then the mock, then the
  view/`schema.ts`. The doc is the contract; it wins.
- **Remove** an endpoint (its last caller is gone) → **delete** the doc file and the
  mock handler and drop it from the module's `index.md` endpoint list. Do not leave
  "might need it later" files — git history keeps them.
- **Rename** → move the file (path is the identity) and fix inbound Markdown links.

A doc file whose endpoint no caller hits, a mock handler with no doc, or a doc with no
mock, is **stale — fix or delete it in the same pass**, don't defer. Quick check when
touching a module: grep the endpoint path across `src/` (callers), `src/mocks/modules/`
(handler), and `docs/` (contract) — all three or none. Update the `timestamp:` in
frontmatter whenever you edit a doc file.

## Frontend (`frontend/`)

Before any UI work, load the **`frontend` skill** (`.claude/skills/frontend/`) — it's the
short checklist of traps this codebase has already hit (raw elements instead of `base/`
components, the closed Tailwind palette, "typechecks but was never rendered").

### Commands

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, mock API auto-enabled
npm run build        # vue-tsc typecheck + production build — the CI gate
npm run typecheck    # vue-tsc --noEmit only
npm run format       # prettier --write src
npm run format:check
```

No test framework is configured. `npm run typecheck` + `npm run build` is the minimum bar.
There is no lint step beyond Prettier (tabs, no semicolons, single quotes, printWidth 150).

### Stack

Vue 3.5 (`<script setup lang="ts">`, strict TS) · Vite 7 · Pinia 3 (Options-store style) ·
Vue Router 4 (history) · Tailwind 3.4 · valibot · @tabler/icons-vue · dayjs · Axios.

Conventions mirror the RICH micro-frontend apps (`../FE-INTEGRASI-*`, canonical doc
`../FE-INTEGRASI-HR/architecture.md`) **except** this project uses TypeScript, not plain JS,
and is standalone (no module federation, no `integrasi-components`).

### Architecture — the parts that span files

**Single axios instance + swappable mock.** All HTTP goes through `src/utils/api.ts`. In dev,
`src/mocks/` attaches `axios-mock-adapter` to *that same instance* (gated by `VITE_USE_MOCK` in
`.env`). Setting `VITE_USE_MOCK=false` removes the mock with zero application-code change —
`main.ts` only dynamically imports `src/mocks` when the flag is `true`.

**Mock is centralized and per-module.** `src/mocks/index.ts` is the only entry point: it lists
`registerXxx` functions, one per module. Each lives in `src/mocks/modules/<module>.ts` and
implements exactly the endpoints in `docs/<module>/`. Shared in-memory state is the single
`src/mocks/db.ts` object (so cross-module reads like the dashboard aggregating journals work);
seed data in `src/mocks/fixtures/`; `paginate` / `sortBy` / `ListParams` in `src/mocks/lib.ts`.
Adding a module = new file in `modules/`, one line in `index.ts`, matching `docs/`.

**Backend contract** the code assumes (full detail in `docs/conventions.md`): list responses are
`{ data: [], meta: { pagination } }`, item responses `{ data: {} }`. `pagination` =
`{ page, per_page, total, last_page }`. Requests send `page`, `per_page`, `sort_by`,
`sort_order`, plus filter params.

**List pages are built on `useTableList` composable** (`src/composables/useTableList.ts`), which
owns the fetch-on-mount + refetch-on-(page|limit|sort|filter) loop. A list view wires
`useTableList` to `<Table>` / `<TablePagination>` / `<TableLimitor>` and a debounced
`applyFilters`. `<Table>` is API-compatible with the RICH table: `rows` = column defs
`{ label, field, isSort?, align? }`, `columns` = row data, slots `#table-header` /
`#table-content`, emit `handleSort`.

**Feature module layout** — a module touches five places: contract `docs/<module>/`,
mock `src/mocks/modules/<module>.ts`, view `src/views/<module>/` (`schema.ts` valibot helper ·
`pages/Page<X>Table|Tambah|Edit.vue` · `components/Form<X>.vue` shared by Tambah & Edit),
route `src/routes/<module>.ts` (`export default [...] satisfies RouteRecordRaw[]`, aggregated in
`src/routes/index.ts` which nests app routes under `DefaultLayout`; full-screen pages like
`/login` are top-level), and a nav entry in `src/constant/nav.ts`.

**Auth** (`stores/user.ts`): `login({username,password})` → `POST /auth/login` → stores
`token` + `user` in `localStorage`, so a reload restores the session. `logout()` clears both.
A `401` on any non-login request clears the token and redirects to `/login`. **Mock mode is
NOT auto-authenticated** — the mock `/auth/login` accepts `admin` / `password`.

**Routing guard** (`src/router/index.ts`): unauthenticated → redirect `/login` with a
`redirect` query; authenticated hitting `/login` → `/dashboard`. `meta.roles` (`RoleName[]`
from `src/constant/roles.ts`) checked after auth. `meta.breadcrumb` feeds `<Breadcrumb>`
(reads `route.matched`). `RouteMeta` is augmented in `router/index.ts` itself.

**Global overlay state** is store-driven, mounted once in `DefaultLayout`:
`useConfirm().ask(opts, onConfirm)` → `stores/modal.ts` → `<ConfirmDialog>`;
`useToast().success(msg)` → `stores/toast.ts` → `<ToastHost>`.

**Chrome state** (`stores/ui.ts`, persisted to localStorage): sidebar rail collapsed,
and `density` (`comfortable` | `compact`) which `<Table>` and forms read.

### Design system

Full rules in `frontend/DESIGN_SYSTEM.md`. Enforced expectations when adding UI:

- **Borderless**: white `.panel` on grey `bg-canvas`, no borders, no shadows in-page. Shadow
  (`shadow-overlay`) only on modals/dropdowns/toasts. No nested cards / box-in-box.
- **Proximity over dividers**: group with spacing + `.subhead` tinted rows, not boxes. A
  hairline (`border-hairline`) is a last resort (table row dividers, sticky header underline).
- **Filled inputs** (`bg-fill`, no border); focus uses the global ring.
- **Numeric spine**: every amount/account-code/date renders in `font-mono` + `.tnum`
  (tabular). Money goes through `<Amount>` (negatives red + parentheses). `src/utils/format.ts`
  has `money`/`number`/`date`.
- Colors are RGB-channel CSS variables in `src/assets/tokens.css` (so Tailwind alpha
  modifiers work and dark mode is a later `.dark {}` block). Accent `primary` = `#0E7C6B`;
  changing it is one edit in `tokens.css`. Semantic names (`primary/danger/warning/success/info`,
  plus `canvas/panel/fill/hairline/ink`) match RICH.
- Type scale names: `xs s m l heading-s heading-m heading-l` (base is `m` = 13px).
- The Tailwind palette is **replaced, not extended** — only the tokens above plus
  `white`/`black`/`transparent`/`current` exist. No `gray-*`, `blue-*`, etc. Use arbitrary
  values (`bg-[#121925]`) only for one-off brand surfaces (the `views/auth/` navy panel).
- `<Input>` takes a `#suffix` slot for a trailing icon/button (login eye toggle, search icon).

`views/auth/LoginView.vue` keeps the legacy split-screen layout and the navy Rahadhyan brand
panel, but the form uses design-system components (`<Input>`, `<Button>`, `<FormField>`, tokens).
The card has a border + `shadow-overlay` (it floats on a white panel, so it needs the definition).

### UI text vs code

UI strings are Bahasa Indonesia. Code comments are English, one line where possible.
