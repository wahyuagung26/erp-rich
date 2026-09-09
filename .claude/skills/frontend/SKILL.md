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
  DateRangePicker FormField Table TablePagination Modal ConfirmDialog Badge Tabs Breadcrumb
  PageHeader FilterBar Panel EmptyState Skeleton Spinner Amount StatTile`
- composables: `useTableList` (the whole list/table/sort/filter/paginate loop), `useToast`,
  `useConfirm`, `useDebounce`, `onClickOutside`

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
- **Sections grouped by whitespace + a light heading**: each group is a `<section
  class="space-y-3">` with an `<h3 class="subhead">` (now a plain uppercase `text-ink-subtle`
  label — the old full-bleed grey bar was removed, it read as box-in-box next to filled
  inputs), `space-y-8` between sections on the `<form>`. **No subtitle that just restates the
  heading** — a `<p class="text-s text-ink-subtle">` under the `<h3>` is only for micro-copy
  explaining behaviour the user can't infer ("this account is auto-credited for the total",
  "TOP 0 = cash / COD"), never a description of the section. Legacy screens carry filler
  subtitles; drop them on port.
- **Filled inputs**; **`font-mono .tnum` only for money (`<Amount>`) and dates** — NOT codes,
  transaction numbers, phone, or formatted phrases ("30 hari").
- **Form width**: `DefaultLayout` centres every page in `mx-auto max-w-[1200px]`. Inside that,
  a form `<Panel class="max-w-5xl">` **left-aligned** (edge lines up with breadcrumb / page
  title / the list page's full-width Panel); never `mx-auto` on the Panel, never a full-width
  Panel with the width cap on an inner `<form>`. **Two exceptions → Panel goes full-width** (no
  cap, same as the list): a form with a wide line-item `<table>`, or a form with too few /
  too short fields to fill 5xl (small master data). See the DESIGN_SYSTEM.md "small forms"
  addendum.
- **Density** prop (`comfortable`/`compact`).
- **Action buttons**: forms → primary at the END of the flow; detail/read pages → all actions
  (`[← Kembali] [✎ Edit] [🗑 Hapus]`, all icon+label) in `PageHeader #actions`, wrapped in one
  `<div class="flex flex-wrap items-center gap-2">` (see §2 — an unwrapped slot sprays the
  buttons across the header), with the whole column (`PageHeader` + `Panel`) wrapped in
  `max-w-5xl` so they align with the Panel edge. A status `<Badge>` for the record goes first
  inside that same flex div.
- **Minimalism here = borderless surfaces + whitespace grouping, NOT fewer controls.** Do not
  trim conventional affordances for aesthetics — this project's reviewer has repeatedly asked
  for them back: keep the explicit **Back** button (a breadcrumb is not a substitute), keep
  visible **field labels**, give a clickable code column a real link colour (`text-primary-dark`),
  don't shrink form width so far it looks unfinished. When unsure, keep the standard control.
- `views/auth/LoginView.vue` deliberately keeps the legacy split-screen layout + navy brand
  panel — that exception is intentional.
