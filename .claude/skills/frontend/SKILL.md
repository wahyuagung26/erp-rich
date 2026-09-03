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

- primitives: `Button Input Textarea Select Checkbox RadioGroup Switch DatePicker FormField
  Table TablePagination TableLimitor Modal ConfirmDialog Badge Tabs Breadcrumb PageHeader
  FilterBar Panel EmptyState Skeleton Spinner Amount StatTile`
- composables: `useTableList` (the whole list/table/sort/filter/paginate loop), `useToast`,
  `useConfirm`, `useDebounce`, `onClickOutside`

`<Input>` takes a `#suffix` slot (trailing icon/button). If a base component is *close* but
missing one thing, add the missing thing to the component (a slot, a variant) — don't inline
a one-off copy in the view. A raw `<input>`/`<table>`/`<dialog>` in a view is a review smell.

Money/dates/numbers → `src/utils/format.ts` + `<Amount>`. Never hand-format currency.

## 2. The Tailwind palette is CLOSED

`tailwind.config.js` **replaces** the palette — it does not extend it. The only colors that
exist are the tokens defined there plus `white black transparent current`. These silently
produce **nothing** (no class, no error, TypeScript can't see it):

- `text-gray-500`, `bg-slate-100`, `border-zinc-200`, any `*-<number>` from stock Tailwind
- `bg-[url('data:image/svg+xml,...')]` and other exotic arbitrary values Tailwind's parser rejects
- (historically) `text-white` before `white` was added to the config

Use the tokens: `canvas panel fill hairline ink ink-muted ink-subtle ink-invert primary
primary-dark primary-soft danger warning success info` (+ `-soft` variants). One-off brand
colours (the `views/auth/` navy `#121925`, gold `#d4a04a`) may use `[#hex]` arbitrary values.

## 3. Feature module = five places, docs first

`docs/<module>/` (OKF contract) → `src/mocks/modules/<module>.ts` → `src/views/<module>/` →
`src/routes/<module>.ts` (+ aggregate in `routes/index.ts`) → `src/constant/nav.ts`.
Keep the three sets 1:1 (endpoint ↔ doc file ↔ mock handler). Details: root `CLAUDE.md`.

## 4. Definition of done — run ALL of these before claiming it works

```bash
cd frontend
npx vue-tsc --noEmit          # or: npm run build
npx prettier --check src
```

Then **render the actual page** — typecheck cannot see a no-op class, a broken flex layout,
an invisible-on-invisible colour, or a mock that returns the wrong shape:

- `npm run dev`, open the route in a browser, look at it. For auth-gated routes, log in first
  (`admin` / `password`).
- No browser? `playwright-core` with the system Chrome works without downloading a browser:
  `chromium.launch({ channel: 'chrome' })` — script it in the scratchpad, screenshot each
  route, assert no `console` errors, then Read the screenshots.
- Or hand the user a screenshot and ask.

A change that passes `vue-tsc` but was never rendered is **not done**.

## 5. Design rules (full list: DESIGN_SYSTEM.md)

Borderless (white panels on grey canvas, shadow only on overlays, no nested cards) · group by
spacing + `.subhead`, not boxes · filled inputs · amounts/codes/dates in `font-mono .tnum`,
right-aligned · density prop (`comfortable`/`compact`). `views/auth/LoginView.vue` deliberately
keeps the legacy split-screen layout + navy brand panel — that exception is intentional.
