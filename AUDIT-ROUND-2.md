# Audit Round 2 — Findings (2026-04-26)

> Round 2 of the mobile-first UI/UX audit. Round 1 closed the headline
> blockers (input affordances, modal hardening, list + FAB foundation,
> component coverage primitives, useMedia + SplitPane, SwipeableRow,
> Bluetooth-keyboard support, comprobante WebView + rasterization).
> Round 2 sweeps the surface for remaining gaps before declaring the
> audit closed.

**Audit scope.** Code-level audit run from the closeout branch — no
real-device verification. Findings tagged `needs-device-QA` require a
dev laptop with iPad / Android sim / Tauri webview to validate.

**Severity legend.**

- **Blocker** — a user can't complete a core flow because of this.
- **High** — degrades the Cachink "fewer clicks, more value" promise
  for a meaningful slice of users.
- **Medium** — improvement that pays off in the audit's specific
  user contexts (cashier behind counter, market vendor, food truck).
- **Low** — polish; valid concern but ROI is small for Phase 1.
- **Judgment call** — both sides have merit; documenting the choice
  prevents future re-litigation.

---

## Executive Summary

### Top issues that affect users today

1. **Skeleton + ErrorState don't announce status to screen readers**
   (Medium) — `aria-busy` / `aria-live` missing. Cashiers using
   VoiceOver lose the "loading" / "error" cue.
2. **PeriodPicker is rendered as plain buttons, not a radiogroup**
   (Medium) — period filters on Estados Financieros + Indicadores
   should be `role="radiogroup"` with `aria-checked` per chip.
3. **Gauge has no `role="meter"` / `aria-valuenow`** (Medium) — a
   value-displaying primitive without numeric semantics is opaque
   to assistive tech.
4. **8 component groups have no Storybook coverage** (Medium) —
   ErrorState, FAB, List, PeriodPicker, Scanner, SearchBar, Skeleton,
   the entire `fields/` folder. Round 1 audit-line "every primitive
   ships with stories + visual baseline" remains unmet.
5. **MoneyField has no edge-case tests for MAX_SAFE bigint, negatives,
   or non-MX locale typing** (Medium) — the audit's #1 blocker class
   "money input bugs in a finance app destroy trust" — happy paths
   covered, edges not.

### Top quick wins (low effort, high impact)

1. **Add `role="status" aria-busy="true" aria-label="Cargando"` to
   `<Skeleton>`** — single-line edit per variant; closes finding 3.1.
2. **Add `role="alert" aria-live="polite"` to `<ErrorState>`** — same
   shape; closes finding 3.2.
3. **Add ConfirmDialog top-of-file JSDoc** — sole component in the
   library missing one; one paragraph fixes the inconsistency
   (finding 6.1).

### Top "tech debt that will hurt in 3 months"

1. **Field-primitive Storybook coverage gap** — the `<fields/>` folder
   is the audit Round 1 hero (RhfTextField, RhfMoneyField, RhfDateField,
   etc.). No stories means no Playwright visual baselines. A future
   refactor that subtly changes the masked-password toggle or the
   money formatter will pass tests but break visual parity.
2. **Three carry-over slices** — T02b SplitPane mounts, T09b swipe
   wiring, T01–T05 + T07 route refactor. All documented but the longer
   they sit unscheduled the harder it gets to keep ADR-042's
   architectural intent fresh in contributors' heads.
3. **No "Round 2 visual baseline" run** — every primitive added in
   Phases A–E ships with Vitest unit tests but no Playwright visual
   snapshot. A future Tamagui/RN bump can quietly shift pixels with no
   gate. Recommended: dedicate 1 day to running
   `pnpm --filter @cachink/ui test:visual` once the dev laptop is
   available, then commit baselines.

---

## 1. Storybook Coverage (was `criterion` 6 in Round 1)

| Component        | Stories | Severity | Notes                                      |
| ---------------- | ------- | -------- | ------------------------------------------ |
| ErrorState       | 0       | Medium   | Round 1 primitive                          |
| FAB              | 0       | Medium   | Round 1 primitive                          |
| List             | 0       | Medium   | Round 1 primitive                          |
| PeriodPicker     | 0       | Low      | Existed pre-audit, never had stories       |
| Scanner          | 0       | Low      | Pre-existing; gesture-bound, hard to story |
| SearchBar        | 0       | Medium   | Round 1 primitive                          |
| Skeleton         | 0       | Medium   | Round 1 primitive                          |
| `fields/` folder | 0       | High     | 7 primitives — entire input family         |

**Recommended fix:** one PR per group, ~½ day each. Use the existing
`Btn/btn.stories.tsx` template — header meta + 3–6 variant stories
per primitive. Effort: **S** per component, **M** for the whole sweep.

---

## 2. Test Depth + Edge Cases (criterion 7 in Round 1)

### 2.1 Below the 5-test floor

| Component                           | Test count | Severity           |
| ----------------------------------- | ---------- | ------------------ |
| `tests/search-bar.test.tsx`         | 3          | Medium             |
| `tests/hello-badge.test.tsx`        | 3          | Low (placeholder)  |
| `tests/components/scanner.test.tsx` | 3          | Low (pre-existing) |
| `tests/error-state.test.tsx`        | 4          | Medium             |
| `tests/fab.test.tsx`                | 4          | Medium             |
| `tests/skeleton.test.tsx`           | 4          | Medium             |

**Recommended fix:** add 1–2 tests each — keyboard navigation, hit
target, prop pass-through. Effort: **S** total.

### 2.2 Money / Date / Integer edge cases (`fields/`) — High severity

The `tests/fields.test.tsx` covers happy paths. Missing:

| Field        | Edge case                             | User impact                                                                                                          |
| ------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| MoneyField   | `Number.MAX_SAFE_INTEGER` boundary    | A user types a million-peso sale; bigint overflow is silent                                                          |
| MoneyField   | Negative values                       | `-50` — should reject (refunds are a different flow) or accept consistently                                          |
| MoneyField   | Non-MX locale typing                  | iPad set to en-US — user types `1,234.56` (US) instead of `1,234.56` (MX); hopefully both work, but no test confirms |
| MoneyField   | Trailing-zero strip                   | `100.00` typed → does it round-trip back to `100.00` after blur, or render as `100`?                                 |
| DateField    | Invalid input rejection               | User types `2026-13-45` — what happens?                                                                              |
| IntegerField | Overflow at `Number.MAX_SAFE_INTEGER` | Inventory `cantidad` field                                                                                           |

**Recommended fix:** add 1 test per row. Effort: **S** per row, **M**
for the matrix.

---

## 3. Accessibility Surface (criterion 4 in Round 1, 7 / 9 in charter)

### 3.1 Loading + error semantics — High severity

| Component      | Missing prop                          | User impact                          |
| -------------- | ------------------------------------- | ------------------------------------ |
| `<Skeleton>`   | `aria-busy="true"` + `role="status"`  | VoiceOver doesn't announce "loading" |
| `<ErrorState>` | `role="alert"` + `aria-live="polite"` | Assistive tech misses the error      |

**Recommended fix:** wrap the root `<View>` of each component with the
ARIA props. Effort: **S**, single file each.

### 3.2 Heading semantics — Medium severity

`<SectionTitle>` renders `<Text>` — not a heading. Web AT can't
navigate by heading. Add `role="heading"` + `aria-level={2}` (matches
the typographic hierarchy below `<TopBar>`'s `<h1>`).

**Recommended fix:** one prop addition. Effort: **S**.

### 3.3 Numeric / status semantics — Medium severity

| Component        | Missing                                                               | Recommendation                                                                                                                       |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `<Kpi>`          | Combined aria-label                                                   | `aria-label={\`${label}: ${value}\`}` so a screen reader hears "Margen Operativo: 1.250.000 pesos" instead of two disconnected reads |
| `<Gauge>`        | `role="meter"` + `aria-valuenow/min/max/text`                         | A gauge without value semantics is opaque                                                                                            |
| `<PeriodPicker>` | `role="radiogroup"` on root, `role="radio"` + `aria-checked` per chip | Period filters are a single-choice group                                                                                             |
| `<Tag>`          | (no action — confirmed decorative-only via ADR-043)                   | —                                                                                                                                    |

**Recommended fix:** per-component edits. Effort: **S** each, **M**
for the trio.

### 3.4 List role — Low severity

`<List>` web variant renders a `<View>` (`<div>`) without
`role="list"`. Tamagui doesn't auto-add it. Native renders FlatList
which is a `<ScrollView>`. Browsers can't infer "list" semantics from
a div tree.

**Recommended fix:** add `role="list"` on the web variant root, and
`accessibilityRole="list"` on native. Effort: **S**.

---

## 4. System-Level Regression Checks ✅

All Round 1 system fixes verified **in place** by code review:

- Modal native uses `position:'absolute'` (not `'fixed'`) ✅
- Modal native wraps content in `<KeyboardAvoidingView>` ✅
- MoneyField uses memoized callback with stable deps to prevent
  double-fire ✅
- Combobox autoFocus is wired through `useEffect` + `ref.current.focus()`
  (not a bare `autoFocus` prop) ✅
- Object URLs from `URL.createObjectURL` are revoked in both
  `share-file.ts` and `share.web.ts` ✅

No regressions detected from code review. **Real-device verification
remains** (`needs-device-QA`):

- iPad keyboard pop-up doesn't cover the focused input on RN modals
- Modal Escape closes on Tauri webview
- gesture-handler swipes work on iOS + Android sims
- WebView preview renders the comprobante on iPad
- view-shot rasterization produces a PNG that opens correctly when
  shared to WhatsApp / Files

**Recommended fix:** one ½-day session on a dev laptop, working through
the Maestro flows that touch each system. Effort: **M**.

---

## 5. Bundle Hygiene ✅

Clean. Specifically verified:

- Zero `lodash` / `moment` / `date-fns` imports across `packages/`
  and `apps/` (the Round 1 audit's quick-win list).
- Heavy deps (`exceljs`, `@react-pdf/renderer`, `html2canvas`, `jspdf`,
  `@sentry/browser`, `@cachink/sync-lan`, `@cachink/sync-cloud`,
  `react-native-view-shot`, `expo-file-system`, `@tauri-apps/plugin-fs`)
  all dynamic-imported per Slice 4 C20's cold-start budget.
- The cold-start performance test (`tests/perf/cold-start-artefact.test.ts`)
  is in place to catch regressions.

No findings.

---

## 6. Documentation Discoverability

### 6.1 ConfirmDialog missing top-of-file JSDoc — Low severity

Sole primitive in `packages/ui/src/components/` without a
top-of-file JSDoc comment block. All 25 other primitives follow the
"why this exists + brand contract + cross-platform notes" template.

**Recommended fix:** one ~10-line block. Effort: **S**.

### 6.2 Component-area READMEs — Low severity

Only `packages/ui/src/responsive/README.md` exists. Audit-prescribed
"breakpoint contract" is documented; no other surface has its own
README. ROADMAP.md is the workspace-level register but doesn't help
a contributor working inside `components/` find primitive contracts
without grepping JSDoc.

**Recommended fix (if scoping permits):** A 1-page
`packages/ui/src/components/README.md` that:

- Lists each primitive with one-line description
- Links to the canonical Storybook story
- Documents the platform-extension pattern (with examples from
  Modal, Scanner, SwipeableRow)

Effort: **S**, but only valuable if Storybook coverage gap (Section 1)
is closed first — otherwise the README links to nothing.

### 6.3 Carry-over slices in ROADMAP ✅

All three deferred slices are correctly tracked:

- M-1-PR5.5-T02b — per-screen `<SplitPane>` mounts
- M-1-PR4.5-T09b — per-screen swipe wiring (Ventas / Egresos /
  Productos / Clientes)
- M-1-PR3.5-T01–T05 — route refactor (NuevoEgreso, NuevaVenta, etc)

ADR-043 (Tag decorative-only, defer Chip) is in the ARCHITECTURE
index. ADR-042 (Stack pages over multi-tab modals, KAV at primitive)
is canonical.

---

## 7. Cross-Platform Parity ✅

All 8 platform-extension primitives follow CLAUDE.md §5.3:

- Icon, Input, List, Modal, Scanner, SwipeableRow, TopBar — each has
  shared contract + `.native.tsx` + (default OR `.web.tsx`).
- `fields/` follows the same pattern (DateField has its own
  `.shared.tsx` + `.native.tsx` because the picker UI differs).
- `share/` (rasterize + share) mirrors with three-file pattern.

No parity gaps detected.

---

## 8. Phase-Carry-over Verification

### 8.1 ✅ Closed in Round 2 closeout (Phases A–E)

| Slice   | Round 1 task                                               | Closure    |
| ------- | ---------------------------------------------------------- | ---------- |
| Phase A | M-1-PR2.5-T08 (Wizard emoji → Icon)                        | ✅         |
| Phase A | M-1-PR5.5-T05 (Tag-vs-Chip decision)                       | ✅ ADR-043 |
| Phase B | M-1-PR5.5-T01 (useMedia + breakpoints + README)            | ✅         |
| Phase B | M-1-PR5.5-T02 (SplitPane primitive + tests + stories)      | ✅         |
| Phase B | M-1-PR5.5-T03 (Director Home 1/2/3 col useMedia)           | ✅         |
| Phase B | M-1-PR5.5-T07 (9.3/9.4 follow-through across 7 components) | ✅         |
| Phase C | M-1-PR4.5-T09 (SwipeableRow primitive + tests + stories)   | ✅         |
| Phase D | M-1-PR3.5-T06 (Bluetooth keyboard support)                 | ✅         |
| Phase E | M-1-PR3.5-T07 (Comprobante WebView + rasterization)        | ✅         |

### 8.2 Deferred / parked

| Slice             | Why deferred                                                                                                                        | Recommended owner             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| M-1-PR5.5-T02b    | Each screen needs selectedId state + right-pane component + tap-handler fork (½–1 day × 6 screens)                                  | One PR per screen             |
| M-1-PR4.5-T09b    | Each entity needs EditarXyzUseCase + edit hook + edit screen + Maestro flows (~1 day × 4 entities)                                  | One PR per entity             |
| M-1-PR3.5-T01–T05 | Route refactor — 7+ new routes + 7+ adapters + dispatch table + Maestro flows. Maestro flows can't be validated in this environment | One slice per route migration |

---

## Out of Scope / Won't Fix (with reasoning)

These were considered during Round 2 and **not** raised:

- **Tamagui replacement.** The audit-charter blocks framework
  migrations. Tamagui's Dialog / Input / Combobox are working as
  intended; no escape-hatch needed.
- **`<Tag>` becomes tappable.** ADR-043 codified the decorative-only
  contract. Round 2 doesn't re-litigate.
- **`<Chip>` primitive.** Same — deferred per ADR-043.
- **Non-MX locale support.** CLAUDE.md §1 fixes Spanish (es-MX) as
  the only launch language. Date-format / number-format edge cases
  on a non-MX iPad are noted (Section 2.2) but not required for
  Phase 1.
- **CFDI 4.0 invoicing path on the share helper.** Out of scope per
  CLAUDE.md §13. The new `shareComprobanteAsImage` helper is a
  comprobante (informal receipt), not a fiscal invoice.
- **Round 2 covers BottomTabBar audit-line 4.7.** Round 1 closed
  this; Round 2 didn't re-test. The BottomTabBar primitive ships
  with 14 tests and the brand-faithful 3-tab layout.

---

## Suggested Round 2 Follow-up Roadmap

Group findings into 4 PRs ordered by user impact. Each PR should be
cohesive (one PR fixes "all a11y semantics", not "one a11y fix per
PR"). Don't enumerate hundreds of micro-PRs.

### PR-R2-1 — A11y Semantics Sweep (½–1 day, **High** impact)

Fixes Sections 3.1, 3.2, 3.3, 3.4 in one cohesive PR:

- `aria-busy` + `role="status"` on Skeleton
- `role="alert"` + `aria-live="polite"` on ErrorState
- `role="heading"` + `aria-level={2}` on SectionTitle
- Combined `aria-label` on Kpi (label + value)
- `role="meter"` + `aria-valuenow/min/max/text` on Gauge
- `role="radiogroup"` + `role="radio"` + `aria-checked` on PeriodPicker
- `role="list"` on List web variant; `accessibilityRole="list"` on native

Tests: per-component a11y assertions using `getByRole(...)`. Effort:
**S** per fix; one PR collects them.

### PR-R2-2 — Storybook Coverage Gap (1–2 days, **Medium-High** impact)

Closes Section 1:

- ErrorState, FAB, List, PeriodPicker, Scanner, SearchBar, Skeleton
- `fields/` family (RhfTextField, RhfMoneyField, RhfDateField, etc — 7
  field primitives)

Each gets a `*.stories.tsx` with the canonical 3–5 variant stories.
Once stories ship, run `pnpm --filter @cachink/ui test:visual` to
generate Playwright baselines. Effort: **M** total.

### PR-R2-3 — Test Edge Cases for Money/Date/Integer (½ day, **High** impact for finance trust)

Closes Section 2.2:

- MoneyField: MAX_SAFE bigint, negatives, en-US locale, trailing zeros
- DateField: invalid input rejection
- IntegerField: overflow at Number.MAX_SAFE_INTEGER

Add the rows to `tests/fields.test.tsx`. Effort: **S–M**.

### PR-R2-4 — Polish + Docs (½ day, **Low** impact, but tidies the contract)

- ConfirmDialog top-of-file JSDoc (Section 6.1)
- Below-floor primitives: search-bar, error-state, fab, skeleton get
  1–2 more tests each (Section 2.1)
- Optional `packages/ui/src/components/README.md` index page
  (only after PR-R2-2 lands so the links work)

---

## Out-of-script Finding (per audit instruction §5)

While auditing the test depth (F2), I noticed:

> **`tests/share/share-image.test.ts` mocks `html2canvas` and `jspdf`
> per file**, duplicating the same vi.mock blocks that
> `tests/share/rasterize.test.ts` defines. If Phase F's Round-2 PR
> sweeps add more rasterize-touching test files, each will paste the
> same mock. Recommendation: extract `tests/share/__mocks__/html2canvas.ts`
>
> - `tests/share/__mocks__/jspdf.ts` so the canvas / jsPDF stubs live
>   in one place. Effort: **S**, only valuable if a 3rd test file lands.

Not a Round 2 blocker; flagged so the next slice can fold it in cheaply.

---

## Round-2 Closeout

Phases A–E delivered the foundation work; Round 2 surveyed the
surface and surfaced 12 actionable findings. None are blockers. The
recommended PR-R2-1 (a11y sweep) should land before declaring the
audit fully closed because semantic gaps compound — every new
primitive added without a11y semantics extends the debt.

The three carry-over slices (T02b, T09b, route-refactor) remain the
biggest pending work. They are intentionally scoped to dedicated
PRs because each touches Maestro flows that need real-device
validation outside this environment.

_— Round 2 audit, 2026-04-26._
