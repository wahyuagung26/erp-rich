---
name: frontend
description: >-
  Playbook + definition-of-done for building or changing UI in erp-finance-v2/frontend
  (Vue 3 + TS + Tailwind design system). Use whenever writing or editing a view, base
  component, layout, form, table, or the design tokens; when adding a feature module; or
  when reviewing frontend changes. Encodes the traps this codebase has already bitten us with.
user-invocable: true
---

# Frontend playbook — erp-finance-v2

Read `frontend/architecture.md` and `frontend/DESIGN_SYSTEM.md` once per task. This skill is
the short list of things that have gone wrong and the check that catches them.

## 1. Reuse before you write

Before writing raw `<input>`, `<select>`, `<button>`, `<table>`, a modal, a spinner, a toast,
a debounce, or a list-fetch loop — **look in `src/components/base/` and `src/composables/`**.
It is almost certainly already there:

- primitives: `Button Input Textarea Select Checkbox RadioGroup Switch DatePicker
  DateRangePicker FormField Table TablePagination RowActions InlineEdit Modal ConfirmDialog Badge Tabs Breadcrumb
  PageHeader FilterBar Panel EmptyState Skeleton Spinner Amount StatTile`
- composables: `useTableList` (the whole list/table/sort/filter/paginate loop), `useToast`,
  `useConfirm`, `useDebounce`, `onClickOutside`

**Dropdown that references another menu's data** (Merk, Cabang, Akun, Sub Akun, …) → `AsyncSelect` (search + infinite scroll; pass `initial-label` from the denormalized code/name on edit; `@select` gives the picked row). Never an eager-fetch `<Select>` — plain `Select` is only for fixed enums.

`<Input>` takes a `#suffix` slot (trailing icon/button) and an `addon` prop (trailing unit
label, Bootstrap input-group style — e.g. `addon="hari"`). If a base component is *close* but
missing one thing, add the missing thing to the component (a slot, a variant) — don't inline
a one-off copy in the view. A raw `<input>`/`<table>`/`<dialog>` in a view is a review smell.

Money/dates/numbers → `src/utils/format.ts` + `<Amount>`. Never hand-format currency.

**List pages**: wire `<FilterBar :loading="loading" @refresh="runSearch">` on every list — it
renders a trailing reload button (owner expects an explicit "apply filter & reload"). The
`useTableList` shape is uniform: `{ columns, pagination, loading, fetchList, handleSort, pageTo,
applyFilters }` + a debounced `runSearch = useDebounce(() => applyFilters({...}), 250)`.

**`<Table>` custom columns.** `#table-header` is a *per-cell* slot inside the column `v-for` —
overriding it means handling every field yourself, including reproducing the sort button. So a
select-all / bulk-action control goes in a **toolbar row above the table**, not in a header
cell; only per-row controls (a row checkbox) go through `#table-content`.

## 2. Vue gotchas that pass `vue-tsc` and blow up (or blank out) at runtime

- **`structuredClone` throws `DataCloneError` on a Vue reactive Proxy.** Copying `props.*` or
  store state into a local `reactive()` — use a shallow spread, nested by hand
  (`{ ...v, attachment: v.attachment && { ...v.attachment }, lines: v.lines.map(l => ({ ...l })) }`)
  or `toRaw`, **never `structuredClone(props.initialValue)`**. `structuredClone` is only safe on
  plain (non-reactive) objects. This one typechecks clean and crashes on first render —
  exactly the trap the "render the page" step exists for.
- **Uploading a `FormData` through `api` needs `headers: { 'Content-Type': 'multipart/form-data' }`.** The shared
  instance defaults to JSON, so axios serialises the FormData to `{}` and the file is silently dropped (the mock/backend
  then sees no file). See `views/tax-invoice-import/pages/PageTaxInvoiceImport.vue`.
- **`#actions` slot content must be wrapped in one flex container.** `PageHeader` and `Panel`
  render the slot's children as *direct flex items* of a `justify-between` row, so two or more
  buttons spray edge-to-edge across the whole width. Always
  `<template #actions><div class="flex flex-wrap items-center gap-2">…</div></template>`.

## 3. The Tailwind palette is CLOSED

`tailwind.config.js` **replaces** the palette — it does not extend it. The only colors that
exist are the tokens defined there plus `white black transparent current`. These silently
produce **nothing** (no class, no error, TypeScript can't see it):

- `text-gray-500`, `bg-slate-100`, `border-zinc-200`, any `*-<number>` from stock Tailwind
- `bg-[url('data:image/svg+xml,...')]` and other exotic arbitrary values Tailwind's parser rejects
- (historically) `text-white` before `white` was added to the config

Use the tokens: `canvas panel fill hairline ink ink-muted ink-subtle ink-invert primary
primary-dark primary-soft danger warning success info` (+ `-soft` variants). One-off brand
colours (the `views/auth/` navy `#121925`, gold `#d4a04a`) may use `[#hex]` arbitrary values.

## 4. Feature module = five places, docs first

`docs/<module>/` (OKF contract) → `src/mocks/modules/<module>.ts` → `src/views/<module>/` →
`src/routes/<module>.ts` (+ aggregate in `routes/index.ts`) → `src/constant/nav.ts`.
Keep the three sets 1:1 (endpoint ↔ doc file ↔ mock handler). Details: root `CLAUDE.md`.

## 4a. The CRUD contract — validation & error handling

Every module follows the same shape for validation and failure. Don't invent a per-module
variant.

- **`schema.ts`** — one valibot schema + a `validate<Entity>(data): Record<string,string> |
  null` helper that returns `{ field: firstMessage }` (flatten the issues, first message per
  field) or `null` when valid. Enum option lists and their label/tone maps live here too.
- **`components/Form<X>.vue`** — `props: { initial?: Partial<Form>, submitLabel?, loading? }`,
  `emits: { submit: [Form] }`. `const form = reactive({...})` seeded field-by-field from
  `props.initial?.x ?? default` (**not** `structuredClone` — §2). Local `errors =
  ref<Record<string,string>>({})`, passed per field as `<FormField :error="errors.x">`.
  `onSubmit()` runs `validate`, assigns `errors.value`, and `emit('submit', { ...form })`
  only when it passed. Expose a `setServerErrors(e: Record<string,string[]>)` that merges
  `{ k: msgs[0] }` into `errors` — `defineExpose({ setServerErrors })`.
- **`pages/Page<X>Tambah|Edit.vue`** — own `saving` / `loading` / `notFound` + a `formRef`.
  `save()`:
  ```ts
  saving.value = true
  try {
    await api.post('/x', payload)               // or api.put(`/x/${id}`, payload)
    toast.success('… ditambahkan')              // past-tense, Bahasa
    router.push('/x')                            // list, or the detail route after an edit
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 422) {
      formRef.value?.setServerErrors(err.response.data?.errors ?? {})
      return                                     // STAY on the form — never redirect on error
    }
    throw err
  } finally { saving.value = false }
  ```
  `load()` on Edit/Detail: `try { … } catch { notFound.value = true }` → render an empty
  state (never a toast for a failed load). A record whose state forbids editing (approved,
  locked, already fulfilled…) → an empty-state panel explaining why, not a disabled form.
- **List delete** — `useConfirm().ask({ type: 'danger', confirmText: 'Hapus' }, cb)`; in the
  callback `try { await api.delete(…); toast.success(…); refetch() } catch (e) {
  toast.error(axios.isAxiosError(e) ? e.response?.data?.message ?? fallback : fallback) }`.
- **Mock side mirrors it** — field errors return `422 { message: 'Validasi gagal', errors: {
  <field>: [msg] } }`; a business-rule block (state guard) returns `422 { message }` with no
  `errors`; a missing id returns `404 { message }`. Re-check every rule server-side — the
  client `validate` is UX, not the gate.
- **401 is global** (the shared axios instance clears the token and routes to login). Never
  add a per-call 401 branch.

## 5. Definition of done — run ALL of these before claiming it works

```bash
cd frontend
npx vue-tsc --noEmit          # or: npm run build
npx prettier --check src
```

Prettier is scoped to `src/` only. Do **not** run `prettier --write` on the root docs
(`DESIGN_SYSTEM.md`, `architecture.md`, `CLAUDE.md`) — it reflows their Markdown tables and
breaks cells that contain an unescaped `|`. Edit those by hand.

Then **render the actual page** — typecheck cannot see a no-op class, a broken flex layout,
an invisible-on-invisible colour, or a mock that returns the wrong shape:

- `npm run dev` in one terminal (it may land on 5174+ if a stale vite is up — read the port
  from its output), then **`node scripts/screenshot.mjs /journal /journal/tambah …`** — the
  committed CDP driver: launches headless Chrome, seeds `localStorage` auth (no login form),
  renders each route to `.screenshots/`, and exits non-zero if any route logged a console
  error. `BASE_URL` / `OUT_DIR` env override the defaults. Read the PNGs, or hand one to the user.
- The script exists because no browser lib is installed (`playwright`/`puppeteer` are NOT deps).
  Extend it there rather than rewriting a one-off driver in the scratchpad each session.

A change that passes `vue-tsc` but was never rendered is **not done**.

## 6. Design rules (full list: DESIGN_SYSTEM.md)

- **Borderless**: white panels on grey canvas, shadow only on overlays, no nested cards.
- **Sections grouped by whitespace + a clear heading**: each group is a `<section
  class="space-y-3">` with an `<h3 class="subhead">` (now a plain uppercase `text-m font-semibold text-ink`
  label — the old full-bleed grey bar was removed, it read as box-in-box next to filled
  inputs), `space-y-8` between sections on the `<form>`. **No subtitle that just restates the
  heading** — a `<p class="text-s text-ink-subtle">` under the `<h3>` is only for micro-copy
  explaining behaviour the user can't infer ("this account is auto-credited for the total",
  "TOP 0 = cash / COD"), never a description of the section. Legacy screens carry filler
  subtitles; drop them on port.
- **Outlined inputs** (white `bg-panel` + `border border-ink-subtle/30`, disabled = `bg-fill`); **`.tnum` (Inter tabular digits — never `font-mono`) only for money (`<Amount>`) and dates** — NOT codes,
  transaction numbers, phone, or formatted phrases ("30 hari").
- **Page width**: `DefaultLayout` already wraps every page in `mx-auto max-w-[1200px]`. EVERY page
  (list, tambah/edit, detail) uses a full-width `<Panel>`, identical to the list — **no `max-w-*` on
  the page root, the Panel, or a wrapper** (owner decision 2026-11-04; the old `max-w-5xl` rule is
  superseded). Cap width only on short fields (code `max-w-[200px]`, city `max-w-xs`, days `w-24`,
  NPWP `w-72`); free text (name, address, notes) stretches.
- **Density** prop (`comfortable`/`compact`).
- **Responsive: render ONE variant, never both.** If desktop and phone need different markup
  (a table → per-row cards), switch with `const isMobile = useIsMobile()`
  (`src/composables/useIsMobile.ts`, < 640px) and `v-if="isMobile"` / `v-else`. Do NOT render both
  and hide one with `hidden sm:block` / `sm:hidden` — the hidden copy still mounts and bloats the
  DOM. CSS classes are fine only for sizing one element (`max-sm:w-full`, `sm:grid-cols-3`).
  Reference: `PageCashPosition.vue`.
- **Action buttons**: forms → primary at the END of the flow, **right-aligned**
  (`<div class="flex flex-wrap justify-end gap-2 pt-2">`, Batal `variant="secondary"` then Simpan);
  detail/read pages → all actions (`[← Kembali] [✎ Edit] [🗑 Hapus]`, all icon+label) in
  `PageHeader #actions`, wrapped in one `<div class="flex flex-wrap items-center gap-2">` (see §2 —
  an unwrapped slot sprays the buttons across the header). A status `<Badge>` for the record goes
  first inside that same flex div.
- **Minimalism here = borderless surfaces + whitespace grouping, NOT fewer controls.** Do not
  trim conventional affordances for aesthetics — this project's reviewer has repeatedly asked
  for them back: keep the explicit **Back** button (a breadcrumb is not a substitute), keep
  visible **field labels**, give a clickable code column a real link colour (`text-primary-dark`),
  don't shrink form width so far it looks unfinished. When unsure, keep the standard control.
- `views/auth/LoginView.vue` deliberately keeps the legacy split-screen layout + navy brand
  panel — that exception is intentional.

## 7. Owner conventions asked for repeatedly — apply BEFORE the first screenshot

Each of these cost a correction round in the Pembelian (PO / receipt / uang muka supplier) polish.
The owner's standing instinct is **"make it seamless with the pages that already exist"** — so
before designing any list/form/detail, open the closest finished sibling and copy it:
list → `PageCashAdvanceTable.vue` / `PageJournalExpenseTable.vue`; line-item form →
`FormJournalLines.vue` (Jurnal Umum "Detail Jurnal"); detail → `PageJournalDetail.vue`.

**List pages (`PageXTable.vue`)**
- Column order: **Tanggal is always the leftmost column**, then Nomor, then Departemen/Supplier…, money last, action column last.
- The identifier column header is **"Nomor"** — never "No. Transaksi", "Nomor Transaksi", "BM #". Same label on detail pages and docs.
- **No "No" (row-index) column.** Keep `show-limit` default and `TablePagination` like the other lists.
- Departemen / Supplier / Pembuat = **stacked cell**: `<div class="leading-snug"><p class="text-ink">{{ name }}</p><p class="text-s text-ink-muted">{{ code }}</p></div>`. Secondary info (keterangan — never "oleh {pembuat}", the owner removed it) goes as a muted second line under Nomor, not as extra columns.
- Anything that must not break mid-token — nomor, voucher, tanggal, status `Badge` — gets `whitespace-nowrap`. Adding a column makes the table squeeze these first; after adding/reordering columns, screenshot at the default viewport and look for "JM-2608-/001"-style wraps and mid-word ellipses.
- Several statuses (approval + delivery) = stacked badges in one cell, not two columns.

**Line-item forms (PO, receipt, anything with lines)**
- Copy the Jurnal Umum "Detail Jurnal" shape: one table, `bg-fill` header with required `*`, an always-visible inline entry row (Enter saves, + / ✓ / ✕ icon buttons), muted empty-state row, saved rows with edit/delete icons, and the **totals in a `<tfoot>` bar under the table**.
- Totals/Ringkasan never sit in a separate block beside or below the table's section; never invent a new summary widget.
- Don't show disabled/derived fields that only restate other fields.

**Field labels & hints** — the users are finance staff, not developers. A label must say *what it is for*, not the column name: "Gudang Penerima" (+ hint "Gudang tempat barang dari PO ini diterima"), "Alamat Supplier" (+ hint "Terisi otomatis dari data supplier, bisa diubah untuk PO ini"). Use `FormField hint` for any field whose purpose or auto-fill behaviour isn't obvious; check the legacy app's wording when unsure.

**Working notes (avoid known time-wasters)**
- macOS: `sed -i ''` (BSD sed). Parallel Bash calls get blocked by the auto-mode classifier — send screenshot/server commands one at a time.
- Edit routes are `/<module>/edit/:id` (not `/<module>/:id/edit`); check `src/routes/<module>.ts` before screenshotting.
- The dev server is usually already running on 5173/5174 — read the port, don't start a second.
- Changing a list/form's fields still means docs/ ⇄ mock ⇄ UI in the same pass, and bumping the doc's `timestamp:`.
