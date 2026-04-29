# ROADMAP.md — Cachink! Implementation Plan

> **How to use this file:** At session start, read this file after CLAUDE.md to see what phase you're in and what's next. When you complete a task, check its box. When a full phase completes, collapse it using the archive pattern described in CLAUDE.md §12. Do **not** remove rules or principles — those live in CLAUDE.md only.

---

## Legend

- `[ ]` — not started
- `[~]` — in progress
- `[x]` — complete
- 🚧 — current phase
- ✅ — completed phase (collapsed)
- 🔒 — blocked (waiting on dependency or decision)

---

## ⚠️ Phase 1 — Incomplete (post-audit reframe, 2026-04-24)

Phase 1's six sub-phases (0, 1A, 1B, 1C, 1D, 1E, 1F) all shipped their
backend + screen work, but a Round 2 wiring audit found that several
**shipped-but-inert** features broke at the route-adapter layer. Phase 1
is treated as **incomplete** until Slice 9.5 lands. The closed phases
remain checked in their archived sub-sections — the failures are at the
shell wiring boundary, not in the domain/data/application/UI work
itself. Public beta is **NOT** tag-ready until 9.5 is in.

**Round 2 critical gaps (now fixed in Slice 9.5):**

- Egreso creation was non-functional (`renderGastoTab`/etc unwired).
- Comprobante share was a no-op.
- Cliente detail / pago flow couldn't open.
- Producto detail / movimientos / delete were unreachable.
- LAN sync engine never started after pairing (handle factory unused).
- Cloud mode hung the splash forever (gate had no auth handle).

Detailed phase history lives in [`ROADMAP-archive.md`](./ROADMAP-archive.md).

---

## Current Status

**Current phase:** 🚧 **Audit M-1 — Mobile-First UI/UX Audit** (PR 1–5.5 closed; Step 0 emulator-pass closed; **UXD-R3 Smart Catalog + Quick-Sell Ventas + Persistent Shell landed 2026-04-28**; ADR-048 + Maestro fixes landed 2026-04-28; PR 3.5 route refactor + Phase M real-device QA ahead).
**Last updated:** 2026-04-28 (ADR-048 Maestro Emulation Test fixes shipped)

### 2026-04-28 — Maestro Emulation Test: Findings & Fixes (ADR-048)

Product-Only Sales + Inline POS implementation verified via Maestro emulation.
Three findings identified and fixed:

- [x] **Finding 1 — Maestro `clearState` + Expo dev-client on iOS 18:** Replaced `clearState: true`
  in all 5 wizard/smoke flows with a `fresh-install.sh` wrapper script that does
  `xcrun simctl uninstall/install`. Root cause: `clearState` wipes the Expo dev-client's
  stored Metro URL on iOS 18+, causing "No script URL provided" errors.
- [x] **Finding 2 — Migration 0002 unregistered:** Already fixed in UXD-R3 Phase A — all smart
  catalog columns folded into `migration-0000.ts`. Verified via unit tests + manual launch.
- [x] **Finding 3 — Venta Maestro flows stale:** Rewrote `venta-efectivo.yaml` and
  `venta-credito.yaml` for the inline POS interaction (tap product card → VentaConfirmSheet → submit).
  Old flows referenced deleted NuevaVenta modal components.
- [x] **ADR-048** added to `ARCHITECTURE.md`: documents product-only sales decision.
- [x] **CLAUDE.md §9** updated: `Venta.producto_id` is now required (non-nullable).
- [x] **TabItem `<View onPress>` → `<Pressable>`** (same root cause as F0-T04 Btn fix).
- [x] **Wizard `business.tsx` missing `onError` handler** added.

### 2026-04-28 — UXD-R3: Smart Catalog + Quick-Sell Ventas + Persistent Shell

5-phase slice landed in one session. All phases complete:

- [x] **Phase A — Foundation:** Domain schema deltas (Producto.tipo/seguirStock/precioVenta/atributos, Sale.productoId/cantidad, Business.tipoNegocio/categoriaVentaPredeterminada/atributosProducto), Drizzle schema + migration 0002_smart_catalog.sql, repository deltas (findFrequentProductoIds), use-case deltas (RegistrarVentaUseCase auto-salida + FindFrequentProductosUseCase), ADR-045/046/047.
- [x] **Phase B — Catalog UX + Tab Rename:** ProductoCard tile + ProductoCardGrid responsive grid components, Inventario→Productos rename (tab-definitions, routes, i18n), NuevoProductoModal adaptive form with precioVenta.
- [x] **Phase C — Always-on Ventas:** useFrequentProductos hook, FrecuentesGrid, ManualVentaForm, quick-sell helpers (deriveVentaCategoria, buildQuickSellPayload), useRegistrarVenta auto-stock.
- [x] **Phase D — Wizard tipoNegocio + Atributos:** BusinessType 4-card wizard step, AtributosForm dynamic renderer, ProductoCard attr chips.
- [x] **Phase E — BottomTabBar Persistence:** useActiveTabKey pathname→tab mapping, KeyboardAvoidingView above BottomTabBar, Settings ScrollView containment.

**Test results:** 255 domain + 951 UI + 15 mobile shell = **1,221 tests green**. 0 typecheck errors across 5 packages.

### 2026-04-26 — Audit M-1 Step 0 (Maestro emulator pass) + Step 1 (Playwright drift)

Per the approved "Phase L + Phase I + Playwright drift + Maestro
emulation pass" plan, ran the toolchain end-to-end on the iPad Pro
11" simulator. Captured findings live in
[`AUDIT-M1-STEP0-FINDINGS.md`](./AUDIT-M1-STEP0-FINDINGS.md).

**Step 0 outcomes:**

- ✅ Java 17 + JAVA_HOME wired (Maestro 2.4.0 launches); SETUP.md
  updated.
- ✅ `expo prebuild --clean` + `pod install` (with
  `LANG=en_US.UTF-8`) + `expo run:ios --device "iPad Pro 11-inch
(M5)"` succeed; ~6-min build, app launches.
- ✅ `apps/mobile/maestro/flows/smoke-launch.yaml` exits 0 against
  the running dev client.

**5 fixes shipped during Step 0:**

- **F0-T01** Java 17 install + `JAVA_HOME` exports.
- **F0-T02** Documented CocoaPods Unicode-locale gotcha (`!` in
  workspace path triggers `Encoding::CompatibilityError`).
- **F0-T03** Added `hoist-non-react-statics` as a direct
  `apps/mobile` dep so pnpm exposes it to Metro.
- **F0-T05** Fixed `ConsentModal` cannot-dismiss bug. The modal's
  `open` was bound to `consent === null`, so "Decidir después" / X
  / backdrop (all wired to `onChange(null)`) never closed it. Added
  a `dismissedThisSession` flag in `app-providers.tsx` so any
  choice closes the modal for the rest of the React mount;
  cold-start re-prompts as the original spec intended.
- **F0-T10** Fixed `swipeable-row.native.tsx` TS error from
  `react-native-gesture-handler@2.31.1` removing the
  `accessibilityLabel` prop on `<Swipeable>` — wrapped children in
  a `<View accessibilityLabel>` so VoiceOver/TalkBack still
  announce the row.

**5 follow-ups filed (M-1-STEP0-T01 … T05 below):**

- **F0-T04 (Blocker)** Tamagui `Btn` `View.onPress` does not fire
  on Maestro/iOS taps. Blocks every E2E flow that taps a Btn.
  Recommended fix: replace `<View onPress>` with `<Pressable>` in
  the Btn primitive.
- **F0-T06 (High)** ConsentModal blocks the wizard on first
  launch — ask after the wizard completes.
- **F0-T07 (High)** ConsentModal bottom-sheet extends below the
  iPad safe-area; action buttons partially obscured by the home
  indicator. Wire `useSafeAreaInsets()` into `modal.native.tsx`.
- **F0-T08 (Medium)** Ten require-cycle warnings in `packages/ui`
  — refactor barrel-exports + fix self-imports.
- **F0-T09 (Medium)** Five Expo SDK 55 dep mismatches; run
  `expo install --fix` + sweep TS fallout.

**Step 1 outcomes:**

- 5 visual baselines regenerated per-story (Btn `outline` variant,
  Modal Select chevron, EmptyState wider `maxWidth`, BottomTabBar
  `ActiveStrip` ×2). The audit plan estimated 18; only 5 were
  actually drifting on `main` — the other 13 had been silently
  resolved between plan-drafting and execution.
- ✅ `pnpm --filter @cachink/ui test:visual` reports 113/113
  passing.
- ✅ Workspace gate green: typecheck 9/9, lint 9/9 (1 unused-disable
  warning unchanged from baseline).

### 2026-04-26 — Audit Round 2 closeout (Phases G + H + J + K)

Per `AUDIT-ROUND-2.md` follow-up plan:

- **Phase G — Round 2 audit fixes (~3 dev-days):**
  - **G1 a11y semantics sweep:** added `role="status"` (Skeleton),
    `role="alert" + aria-live="polite"` (ErrorState), `role="heading"
aria-level={2}` (SectionTitle), combined `aria-label` (Kpi),
    `role="meter" + aria-valuenow/min/max/text` (Gauge),
    `role="radiogroup" + role="radio" + aria-checked` (PeriodPicker via
    `<Btn role>`/`ariaChecked` extension), `role="list"` (List web) +
    `accessibilityRole="list"` (List native). New
    `tests/a11y-semantics.test.tsx` covers all 8 with 8 cases.
  - **G2 Storybook coverage gap:** 14 new `*.stories.tsx` files
    (ErrorState, FAB, List, PeriodPicker, Scanner, SearchBar, Skeleton
    - 7 field-family stories). 44 new visual baselines committed.
  - **G3 money / date / integer edge cases:** 6 new field tests
    (MAX_SAFE_INTEGER overflow, negative-rejection, en-US locale
    typing, trailing-zero preservation, invalid-date forwarding,
    IntegerField MAX_SAFE_INTEGER clamping).
  - **G4 polish + docs:** ConfirmDialog top-of-file JSDoc, +2 tests
    each on search-bar / error-state / fab / skeleton (now ≥5 each),
    new `packages/ui/src/components/README.md` index page.
- **Phase H — remaining form migrations:** BusinessForm, CorteDeDia,
  AdvancedBackend, LanJoin all swap raw `<Input>` → typed field
  primitives + Enter-to-submit on the last field.
- **Phase J — edit infrastructure (Sales / Expenses / Products):**
  per ADR-023, extended each repository with `update(id, patch)` +
  contract tests; built `EditarVentaUseCase`, `EditarEgresoUseCase`,
  `EditarProductoUseCase` + matching mutation hooks; built minimal
  edit modals that pre-populate from the row and reuse the typed-field
  primitives. `costoUnitCentavos` excluded from the Producto patch
  shape (Phase 2 owns re-pricing).
- **Phase K — per-screen swipe wiring:** extended VentasScreen,
  EgresosScreen, StockScreen, ClientesScreen with `onEdit{X}` +
  `onEliminar{X}` handlers; rows wrap in `<SwipeableRow>` when set.
  Mobile route adapters (`apps/mobile/src/app/{ventas,egresos,
clientes,inventario}.tsx`) wire the new handlers to the edit modal +
  ConfirmDialog mounts. Per-route slot helpers live in
  `apps/mobile/src/shell/*-slots.tsx` so the route files stay under
  the §4.4 200-line cap. New `useSwipeState<T>()` hook in
  `apps/mobile/src/shell/use-swipe-state.ts` collapses the
  `editing / setEditing / confirmDelete / setConfirmDelete` boilerplate.

**Round 2 totals:** 9/9 typecheck, 9/9 lint, UI 923/923 tests passing
(was 893 baseline; +30 across G + H + J + K). 14 new Storybook stories

- 44 new visual baselines committed. Maestro flow updates for the
  swipe gestures roll up into Phase M (`needs-device-QA`).

**Round 2 deferrals:**

- **Phase L — route-stack refactor (M-1-PR3.5-T01–T05):** documented
  as multi-week work in ADR-042; each migration touches 7+ Expo
  Router routes + matching desktop adapters + 25 Maestro flows.
  Maestro validation requires a dev laptop with iOS Simulator /
  Android Emulator. Owned end-to-end as its own slice once a dev
  laptop is available.
- **Phase M — real-device QA (M3 + native-module rebuild):** cannot
  run from this environment. Requires `expo prebuild --clean`,
  `pod install`, `expo run:ios` / `run:android`, then the full
  `pnpm --filter @cachink/mobile test:e2e` Maestro sweep.

Slice 8 closes the audit gaps Slice 9.5/9.6 left open:

- **A2 design revision** — replaced the `'cachink-host'` access-token
  sentinel with an explicit `lanHostReady` sync-state scope (no more
  magic strings polluting `auth.accessToken`).
- **M2-C9/C10/C11** — PowerSync deps installed, Vite/Metro chunk-split
  config in place, `sync-cloud-*.js` chunk now emitted (194.75 kB).
- **M3-C12/C13/C14** — 13 new test files (72 new UI tests + 17 new
  sync-cloud tests); 5 new Storybook stories; sync-cloud coverage
  raised to 85% (was 80%).
- **M4-C15/C16** — `apps/desktop/playwright.config.ts` + test:lan/cloud
  scripts; full Maestro flow inventory in `apps/mobile/maestro/README.md`;
  Cloud + LAN setup sections appended to both SETUP.md files.
- **M2-C9 + M4-C17 + M4-C18** closed by note (env-gated or deferred).

**Slice 8 totals:** 1,228 tests passing across 9 packages
(was 1,070); typecheck 9/9; lint 9/9; desktop production build emits
the expected `sync-cloud` chunk.

**Note (2026-04-25):** the 9/9 typecheck claim above was later invalidated by a missing `@cachink/sync-cloud` dependency in `apps/mobile`; Audit M-1 PR1 restores the workspace edge.

**Phase 1 recap:** 136/136 backend tasks shipped across 6 phases.
Slice 9.5/9.6/8 closed the route-adapter, design-revision, and
test-backfill gaps the audit surfaced. Public-beta tag-ready.

---

## ✅ Phase 0 — Foundation (Completed 2026-04-23)

Monorepo + layered architecture + brand tokens + both apps rendering the same
`<HelloBadge />`. 60 tests green, typecheck 13/13, lint 9/9, coverage
thresholds met (domain/data/ui 100%). Tauri native macOS window + Expo web
bundle (Metro 857 modules) both verified. Full detail in `ROADMAP-archive.md`.

Carry-overs (environmental, not blockers):

- **P0-M4-T04** iOS simulator verify — needs full Xcode.
- **P0-M7-T03** CI-green-on-empty-PR — needs git remote.

---

## ✅ Phase 1A — Brand & Component Primitives (Completed 2026-04-23)

All 11 primitives from CLAUDE.md §8.4 ship in `@cachink/ui` with 100% unit
coverage and 56 Playwright visual baselines on both targets. Strict-typed
i18n infrastructure (es-MX) lives in `@cachink/ui/i18n`; pure-function
money + date formatters live in `@cachink/domain/format`. 127 UI tests + 66
domain tests, all green; lint 9/9, typecheck 13/13. Full detail in
`ROADMAP-archive.md`.

---

## ✅ Phase 1B — Domain & Data Layer (Completed 2026-04-23)

11 entity schemas (Zod) + 11 Drizzle tables + 11 repositories (Drizzle +
InMemory) wired behind a driver-agnostic `CachinkDatabase` alias, 5 pure
NIF financial calculators, and 8 application use-cases with Zod-validated
boundaries. 570 tests total; domain + application 100% coverage, data
100%, testing 99.28%. Full detail in `ROADMAP-archive.md`.

---

## ✅ Phase 1C — Local Standalone Mode (Completed 2026-04-24)

62/62 tasks shipped across 12 milestones via 4 execution slices. The
app runs fully on a single device: Operativo captures ventas / egresos
/ inventario; Director sees Estados Financieros (NIF B-3/B-6/B-2),
Indicadores, Director Home (utilidad-hero + hoy KPI + CxC + actividad

- stock-bajo + pendientes), and exports Excel + PDF. Opt-in Sentry,
  error boundary, backup-before-migration, a11y primitives, and the
  cold-start budget are all in place. 2 new ADRs in Slice 4 (026
  notifications, 027 Sentry consent). Full detail in
  `ROADMAP-archive.md`.

---

## ✅ Phase 1D — LAN Mode (Completed 2026-04-24)

16/16 tasks shipped via Slice 5 (~22 commits). First-party SQLite-to-SQLite
LAN sync with no external vendor: Rust axum server inside Tauri, JS
client in `@cachink/sync-lan`, wizard + UI wiring in `@cachink/ui`.
ADR-029 pins the HTTP push/pull + WebSocket wire protocol; ADR-030
pins the `__cachink_change_log` trigger strategy. Playwright + Maestro
E2E specs scaffolded for real-hardware runs. Full detail in
`ROADMAP-archive.md`.

Carry-overs (environmental, not blockers):

- Physical-device E2E runs (Maestro `lan-pair.yaml`, Playwright `lan-sync.spec.ts`,
  `lan-offline-replay.spec.ts`, `lan-conflict.spec.ts`) need the Tauri binary
  running on one Mac/PC plus two tablets on the same Wi-Fi — documented
  in the archive entry's "Manual QA" section.
- `pnpm --filter @cachink/desktop tauri:check` verifies the Rust axum
  server compiles — requires a local Rust toolchain not available in
  headless CI yet.

---

## ✅ Phase 1E — Cloud Mode (Completed 2026-04-24)

14/14 tasks shipped via Slice 6 (~18 commits). Hybrid cloud backend:
Cachink-hosted Supabase is the wizard default, Settings → Avanzado
lets power users bring their own Postgres without a fork. PowerSync
Sync Streams replicate per-business rows with a 90-day window for
Operativos and full rows for Directors. ADR-035 formalises the
PAT/service-role-key boundary: management credentials live on the
developer laptop and never in the shipped binary. Full detail in
`ROADMAP-archive.md`.

Carry-overs (environmental, not blockers):

- **Provisioning** (`supabase db push`, PowerSync instance creation) is a
  developer-laptop-only action — documented in `supabase/README.md`.
- Hosted Supabase URL + anon key + PowerSync URL need to be baked into
  EAS Build secrets (`EXPO_PUBLIC_CLOUD_API_URL`, `EXPO_PUBLIC_CLOUD_ANON_KEY`,
  `EXPO_PUBLIC_POWERSYNC_URL`) before the Cloud onboarding card activates.
- Maestro `cloud-signup-signin.yaml` + `cloud-offline-replay.yaml` and
  Playwright `cloud-role-windowing.spec.ts` are scaffolded and run
  against a live hosted instance.
- PowerSync native modules (`@powersync/react-native`,
  `@powersync/web`) are installed in the app packages (not
  `@cachink/sync-cloud`) to preserve the lazy-load contract — see the
  archive entry's "Manual install" section.

---

## ✅ Phase 1F — Launch Prep (Completed 2026-04-24)

15/15 tasks shipped via Slice 7 (~12 commits). Agent-executable
deliverables: ADR-036 (launch artifacts), EAS profiles, Tauri signing
config + updater, reproducible build script (`scripts/build-all.sh`)
with CycloneDX SBOM + SHA-256 checksums, Playwright screenshot
pipeline (6 flows × 4 device sizes), es-MX store listings (App Store +
Play Store), privacy policy + ToS, landing page markup,
`docs/launch-checklist.md`, in-app FeedbackAction with PII-safe
mailto builder, useCheckForUpdates hook, public launch announcement
drafts (short + medium + long form), README post-launch quickstart.
4 tasks annotated `[x] (human-gated; prereqs shipped)` — App/Play
Store submissions, beta invitee outreach, domain purchase, launch
announcement posting. Full detail in `ROADMAP-archive.md`.

---

## 🚧 Slice 9 — Wiring Catch-up (in progress)

**Purpose.** An audit of Phase 1 shipment found real wiring gaps — the
backend hooks + `@cachink/ui` screens are complete, but a few
shell-level bridges and desktop route adapters are missing. This slice
closes those gaps without reopening Phase 1's domain/data/application
work. It is additive only.

**Current state.** Phase A + B1 landed 2026-04-24. Remaining phases are
follow-ups.

### Milestone S9.5 — Critical wiring (P0, breaks shipped Phase 1 features)

Closed 2026-04-24. ADR-037 added (`@supabase/supabase-js` as a direct
mobile dependency).

- [x] **S9.5-T01** Extract `<NuevoEgresoModalSmart>` into `@cachink/ui`
      (3 tabs + mutation hooks). Wired in mobile `egresos.tsx` +
      desktop `egresos-route.tsx`. 4 new tests.
- [x] **S9.5-T02** Wire `onShare` comprobante on both ventas routes
      (shareComprobante + useComprobanteHtml).
- [x] **S9.5-T03** Add `<ClienteDetailRoute>` smart wrapper
      (ClienteDetailScreen + RegistrarPagoModal). Both clientes routes
      pass `onClientePress`.
- [x] **S9.5-T04** Add `<ProductoDetailRoute>` smart wrapper
      (ProductoDetailPopover + MovimientoModal + delete with
      StockNotEmpty confirm). Both inventario routes pass
      `onProductoPress`.
- [x] **S9.5-T05** Add `useLanHandle` factory in `@cachink/ui/sync`;
      both shells pass it via `AppProviders.hooks.useLanHandle` so LAN
      replication actually runs after pair.

### Milestone S9.6 — High-value parity (Cloud + Inventario completion + polish)

Closed 2026-04-24.

- [x] **S9.6-T06a** ADR-037 added (mobile `@supabase/supabase-js`
      direct dep + CLAUDE.md §3 update).
- [x] **S9.6-T06b** Installed `@supabase/supabase-js` ^2.49.0 in both
      apps via pnpm.
- [x] **S9.6-T06c** `apps/mobile/src/shell/use-cloud-bridges.ts` +
      `cloud-navigation.tsx` (CloudInnerScreenHost overlay,
      CloudAuthHandleContext).
- [x] **S9.6-T06d** `apps/desktop/src/shell/use-cloud-bridges.ts` +
      `cloud-navigation.tsx` (mirror of mobile variant, Vite env reads).
- [x] **S9.6-T06e** `useMobileCloudHandle` / `useDesktopCloudHandle`
      shell factories that lazy-import PowerSync (gracefully degrade to
      local SQLite when `@powersync/*` isn't installed — respects the
      Phase 1E "Manual install" carry-over). Both `AppProviders.hooks`
      now pass `useCloud` + `useCloudHandle`.
- [x] **S9.6-T07** Wire `NuevoProductoModal` + `useCrearProducto` on
      both inventario routes.
- [x] **S9.6-T08** Add `<InventarioTabBar>` + `<MovimientosRoute>` in
      `@cachink/ui`; mounted as the Movimientos sub-tab on both apps.
- [x] **S9.6-T09** Add `<CorteHomeCard>` smart wrapper. Mounted on
      Director Home (slot prop) + Operativo Ventas header.
- [x] **S9.6-T10** Mount `<FeedbackAction>` inside `<Settings>` (via
      new `feedback` prop). Both routes plumb appVersion / platform /
      role / crashReporting / breadcrumbs.
- [x] **S9.6-T11** `useMobileUpdateAdapter` (expo-updates) +
      `useDesktopUpdateAdapter` (`@tauri-apps/plugin-updater`) shell
      hooks with graceful-degrade dynamic imports. Both Settings routes
      mount the "Buscar actualizaciones" row.
- [x] **S9.6-T12** Add `useLanDetails` in `@cachink/ui/sync`; both
      Settings routes pass `lanDetails` when mode === 'lan'. Desktop
      wires `stopHostServer` via the Tauri lan-host-bridge.
- [x] **S9.6-T13** Wire `onOpenAdvancedBackend` in both Settings routes
      via `useCloudNavigation().openAdvancedBackend`. AdvancedBackendRoute
      mounts as an overlay through CloudInnerScreenHost.
- [x] **S9.6-T14** PasswordResetScreen mounts via CloudInnerScreenHost
      when CloudGate's `onForgotPassword` fires. Reset call propagates
      through CloudAuthHandle.
- [x] **S9.6-T16** Keep `tablet-only` in `AppMode` and add a
      "Solo tablet" wizard card with es-MX i18n (`wizard.tabletOnly.*`).

### Milestone S9-A — Desktop route parity

- [x] **S9-A-T01** Create `apps/desktop/src/app/routes/` with 7 adapter
      files mirroring the mobile Expo Router entries. Use
      `DesktopAppShellWrapper` (new) + `useDesktopNavigate()` from the
      router context.
- [x] **S9-A-T02** Extract `DesktopRouterContext` into its own module
      and refactor `desktop-router.tsx` to dispatch by path prefix.
- [x] **S9-A-T03** Each adapter wraps itself in `DesktopAppShellWrapper`
      so BottomTabBar navigation reaches real screens (Ventas, Egresos,
      Inventario, Clientes, CxC, Estados, Settings).

### Milestone S9-B — LAN / Cloud bridge gaps

- [x] **S9-B1-T01** Extract `pairWithLanServer` to `@cachink/ui/sync`
      (removes the duplicated fetch helper in
      `apps/desktop/src/shell/lan-pair-bridge.ts` per CLAUDE.md §2.3).
      6 new unit tests cover happy path + error branches.
- [x] **S9-B1-T02** Create `apps/mobile/src/shell/use-lan-bridges.ts`
      using the shared pair helper + `useLanBridgeCallbacks` +
      `openScannerForResult()`.
- [x] **S9-B1-T03** Create `apps/mobile/src/shell/scanner-host.tsx`
      (Zustand store + `MobileScannerHost` component wrapping
      `<Scanner>`). Exposes an imperative
      `openScannerForResult(): Promise<string | null>` for LanJoinScreen.
- [x] **S9-B1-T04** Wire `useMobileLanBridges` + `<MobileScannerHost />`
      into mobile `_layout.tsx` via `AppProviders.hooks.useLan`.
- [x] **S9-B2-T01** Subsumed by S9.6-T06d (`use-cloud-bridges.ts` on desktop).
- [x] **S9-B3-T01** Subsumed by S9.6-T06c (`use-cloud-bridges.ts` on mobile, ADR-037).
- [x] **S9-B4-T01** Subsumed by S9.5-T05 + S9.6-T06e (`useLanHandle` and `useCloudHandle` factories
      passed into `AppProviders.hooks`).

### Milestone S9-C — Inventario completion

- [x] **S9-C-T01** Closed by S9.6-T07 (NuevoProductoModal wired on both inventario routes).
- [x] **S9-C-T02** Closed by S9.6-T08 (InventarioTabBar + MovimientosRoute on both platforms).

### Milestone S9-D — Corte de Día surface

**Decision locked (Slice 9 planning):** surface is the Home-card
variant. CorteCard mounts on DirectorHomeScreen behind `useCorteGate`
so it only renders at end of day. Operativo gets a sibling rendering
in `VentasScreen`'s header slot.

- [x] **S9-D-T01** Closed by S9.6-T09 (`<CorteHomeCard>` smart wrapper on Director home).
- [x] **S9-D-T02** Closed by S9.6-T09 (Operativo Ventas route header).

### Milestone S9-E — Polish

- [x] **S9-E1-T01** Closed by S9.6-T12 (`useLanDetails` hook + Settings wiring on both routes).
- [ ] **S9-E2-T01** (parked) Gastos-Recurrentes management screen —
      defer until a user asks to edit templates before they fire.

### Exit criteria (Slice 9 — met 2026-04-24 with 9.5 + 9.6)

- ✅ All bottom-tab taps on desktop reach their real screen (S9-A).
- ✅ Wizard → LAN mode on mobile reaches LanJoinScreen with a working
  QR scanner (S9-B1).
- ✅ Wizard → Cloud mode on both platforms reaches CloudOnboardingScreen
  with real Supabase auth (S9.6-T06c/d).
- ✅ Corte de Día is reachable from Director Home + Operativo Ventas
  (S9.6-T09).
- ✅ No TODO-stub onNuevoProducto handlers remain (S9.6-T07).
- ✅ Full monorepo gate green (lint 9/9 + typecheck 9/9 + 536 UI tests
  - every other package's tests pass).
- ✅ All Round 2 audit critical gaps (R2-G1..R2-G15) closed.

---

## ✅ Wizard UX refresh (WUX) — Completed 2026-04-25

Implements the new first-run setup wizard per ADR-039 (intent-first
copy, four-screen state machine, AppMode collapse + lan-server /
lan-client split, runtime safety rails). Solo → LAN data import is
deferred to Phase 2 — see `ARCHITECTURE.md` "Deferred Decisions".

**Shipped:**

- AppMode enum collapse (`'local' | 'cloud' | 'lan-server' | 'lan-client'`)
  with idempotent hydration migration for legacy values.
- Four-screen wizard (Step 1 / Step 2A / Step 2B / Step 3) plus help
  modal and migration-deferred screen, all in `packages/ui`.
- New `<Callout>` primitive + Storybook coverage.
- Three runtime safety rails: data-preserved callout, offline blocker,
  unsynced-changes blocker with force-escape, plus a confirm modal for
  irreversible-feeling mode changes.
- 5 new tests files / 1 new spec; 772/772 UI tests green.
- 4 new Maestro flows + 1 Playwright spec; existing flows updated.
- ADR-039 + CLAUDE.md §7.1/§7.4 in lockstep with the shipped behaviour.

### Milestone WUX-M1 — Foundations (no user-visible UI change)

- [x] **WUX-M1-T01** Rename `AppMode` enum to
      `'local' | 'cloud' | 'lan-server' | 'lan-client'`. Update
      `APP_MODES` array. Add `parseMode` legacy translation
      (`'local-standalone'` / `'tablet-only'` → `'local'`; `'lan'`
      flagged for caller resolution via sync-state).
- [x] **WUX-M1-T02** Extend `hydrateAppConfig` to resolve legacy
      `'lan'` via `__cachink_sync_state.lanRole` (host →
      `'lan-server'`, client/unset → `'lan-client'`) and rewrite the
      stored value so subsequent reads see the new enum. Idempotent.
- [x] **WUX-M1-T03** Build `<Callout>` primitive in
      `packages/ui/src/components/Callout/` with three tones
      (`success` / `warning` / `info`), optional action slot, and
      Storybook stories per tone.
- [x] **WUX-M1-T04** Add `Callout` to `packages/ui/src/components/index.ts`
      barrel.
- [x] **WUX-M1-T05** Add wizard step-state Zustand store at
      `packages/ui/src/screens/Wizard/state.ts` — tracks current step,
      preselected scenario from help modal, and history stack for
      `back()`.
- [x] **WUX-M1-T06** Replace `wizard.*` namespace in
      `packages/ui/src/i18n/locales/es-mx.ts` with the new tree (step1
      / step2a / step2b / step3 / helpModal / migrationDeferred /
      callout / confirmModeChange / modeNames) — preserve
      `wizard.businessForm` unchanged.
- [x] **WUX-M1-T07** Refactor `LanGate` to take `mode` prop directly
      (no more `useLanRole` indirection). Retire `useLanRole` hook.
- [x] **WUX-M1-T08** Update `gated-navigation.tsx` `WizardGate` to
      write final mode directly; retire `onLanRoleSelected` callback +
      `WizardSelectOptions.lanRole`.
- [x] **WUX-M1-T09** Update `Settings.modeLabelKey` + sync-status
      badge to use new AppMode values + `wizard.modeNames.*` i18n
      keys. Drop `settings.modoLocal/modoTabletOnly/modoLan/modoCloud`.
- [x] **WUX-M1-T10** Sweep test fixtures across `packages/ui/tests`
      and `packages/ui/src` for legacy mode strings; run
      `pnpm --filter @cachink/ui typecheck && test` until green.

### Milestone WUX-M2 — Wizard rewrite (user-visible)

- [x] **WUX-M2-T01** New screen: `step1-welcome.tsx` (two primary
      cards + two secondary links, supports `preselectedScenario`).
- [x] **WUX-M2-T02** New screen: `step2a-solo.tsx` (Local + Cloud
      cards, back link).
- [x] **WUX-M2-T03** New screen: `step2b-multi.tsx` (Server +
      Cloud cards, mobile-disabled state for Server, importLink
      desktop-only).
- [x] **WUX-M2-T04** New screen: `step3-join-existing.tsx` (LAN
      client + Cloud sign-in cards).
- [x] **WUX-M2-T05** New: `help-modal.tsx` (three scenarios with
      pre-selection on close).
- [x] **WUX-M2-T06** New: `migration-deferred-screen.tsx` (honest
      Phase-2-deferred copy reachable from Step 2B importLink on
      desktop).
- [x] **WUX-M2-T07** Extend `<WizardCard>` with `disabledNote?:
  string` for the mobile lan-server card explanation.
- [x] **WUX-M2-T08** Rewrite `wizard.tsx` orchestrator using the M1
      Zustand store; integrate `<CloudOnboardingScreen>` with new
      `initialTab` prop for sign-up vs sign-in entry points.
- [x] **WUX-M2-T09** Add `initialTab?: 'signin' | 'signup'` to
      `<CloudOnboardingScreen>`.
- [x] **WUX-M2-T10** Update `apps/mobile/src/app/wizard.tsx` and
      desktop equivalent to drop `WizardSelectOptions` plumbing.
- [x] **WUX-M2-T11** Rewrite `packages/ui/tests/screens/wizard.test.tsx`
      with new step-by-step coverage; add new
      `wizard-state.test.ts` for the Zustand store; add
      `help-modal.test.tsx`.
- [x] **WUX-M2-T12** Storybook stories for each wizard step + help
      modal (mobile + desktop targets).

### Milestone WUX-M3 — Safety rails

- [x] **WUX-M3-T01** New hook `use-is-online.ts` with platform
      splits (`.web.ts` for navigator.onLine, `.native.ts` for
      `@react-native-community/netinfo`). Adds netinfo dep to
      `apps/mobile/package.json`.
- [x] **WUX-M3-T02** New hook `use-pending-changes.ts` reading
      `MAX(__cachink_change_log.id)` vs `localPushHwm`.
- [x] **WUX-M3-T03** Add `count(businessId)` to
      `SalesRepository`, `ProductsRepository`,
      `ClientsRepository` (interface + Drizzle + in-memory + contract
      tests).
- [x] **WUX-M3-T04** New hook `use-data-counts.ts` aggregating the
      three counts.
- [x] **WUX-M3-T05** New: `data-preserved-callout.tsx` mounted on
      Step 2A / Step 2B / Step 3 / migration-deferred when
      `hasAny`. Cloud-aware copy.
- [x] **WUX-M3-T06** New: `offline-blocker.tsx` wrapping cloud
      sub-flow mounts.
- [x] **WUX-M3-T07** New: `unsynced-blocker.tsx` for re-runs with
      pending HWM; explicit force-confirm escape hatch.
- [x] **WUX-M3-T08** New: `confirm-mode-change-modal.tsx` for
      irreversible-feeling re-run paths (cloud sign-in / lan-client
      pair).
- [x] **WUX-M3-T09** Tests for each callout + blocker + modal.

### Milestone WUX-M4 — E2E + final docs

- [x] **WUX-M4-T01** Update existing Maestro flows to new step IDs
      (`smoke-launch.yaml`, `wizard-local-standalone.yaml`,
      `cloud-signup-signin.yaml`, `lan-pair.yaml`).
- [x] **WUX-M4-T02** New: `wizard-cloud-solo.yaml` (Step 1 → 2A →
      Cloud signup → BusinessForm).
- [x] **WUX-M4-T03** New: `wizard-mobile-disabled-host.yaml`
      (mobile + Multi + server card disabled + explanation visible).
- [x] **WUX-M4-T04** New: `wizard-help-modal.yaml` (open modal →
      pick scenario → modal closes → step1 card highlighted).
- [x] **WUX-M4-T05** New: `wizard-rerun-with-data.yaml` (seed
      ventas/productos/clientes → re-run → callout asserts counts).
- [x] **WUX-M4-T06** New: `apps/desktop/playwright/wizard-lan-server.spec.ts`
      desktop happy path for `mode='lan-server'`.
- [x] **WUX-M4-T07** Update `apps/mobile/maestro/README.md` flow
      inventory.
- [x] **WUX-M4-T08** Verify ADR-039 + CLAUDE.md §7.1/§7.4 + this
      WUX block all reflect shipped reality. Mark milestone complete.

### WUX exit criteria

- All four AppMode outcomes (`local`, `cloud`, `lan-server`,
  `lan-client`) reachable via the wizard with passing E2E tests.
- Re-running the wizard on a device with data shows the green
  data-preserved callout on every mode-change screen.
- Mobile devices show the desktop-only `lan-server` card as disabled
  with the explanation copy.
- The "¿No estás seguro?" help modal exists and pre-selects cards
  correctly on close.
- The "Ya tengo Cachink en otro dispositivo" link on Step 1 leads to
  the Step 3 screen with both lan-client and cloud-sign-in paths.
- All copy lives in `es-mx.ts`; no hardcoded user-facing strings.
- Wizard component lives entirely in `packages/ui` and is imported
  identically by both apps with zero duplication.

---

## 🚧 UX Design-Mock Alignment (UXD) — 2026-04-25

Audit of the four design mocks against the shipped UI surfaced
specific gaps in icon system, tab/topbar chrome, hero-card
composition, list-row layout, and one missing chip-toggle primitive.
The brand DNA (colors / fonts / borders / hard shadows / press
transform) is already correct in `theme.ts` and was preserved verbatim.
Two structural conflicts with CLAUDE.md §1 were resolved per
ADR-040: keep the mandated tab sets and use a "Más…" surface for the
extra affordances the mocks suggest.

### Milestone UXD-M1 — Foundation primitives

- [ ] **UXD-M1-T01** Add `lucide-react-native` (line-style icon set,
      tree-shaken per icon, works on RN + web/Tauri via `react-native-svg`).
      Build `<Icon>` wrapper at `packages/ui/src/components/Icon/`
      with a curated `IconName` union so consumers can't import
      arbitrary icons.
- [ ] **UXD-M1-T02** New primitive: `<InitialsAvatar>` —
      yellow rounded-square 40/48 px, 2-px black border, 10-px radius,
      bold uppercase initials. Replaces the role chip in the TopBar
      across both apps. Stories + tests on both platform targets.
- [ ] **UXD-M1-T03** New primitive: `<SegmentedToggle>` —
      horizontal radio chip group. Active = primary yellow + shadow,
      inactive = ghost. Used by the `MÉTODO DE PAGO` row in
      NuevaVenta and the Egreso sub-tab selector. Stories + tests.
- [ ] **UXD-M1-T04** Add `outline` `<Btn>` variant: white surface,
      2-px black border, hard shadow. For "CANCELAR" buttons that
      sit next to a primary `GUARDAR`. Update story matrix + tests.
- [ ] **UXD-M1-T05** Extend `<ModalHeader>` API with `subtitle?:
  string` and `leftAvatar?: ReactNode` slots; deprecate `emoji`
      while preserving back-compat for existing callers.

### Milestone UXD-M2 — Foundation migration

- [ ] **UXD-M2-T01** Replace emoji glyphs in
      `packages/ui/src/screens/AppShell/tab-definitions.ts` with
      `IconName` values. Operativo tabs stay 3 (Ventas/Egresos/
      Inventario per CLAUDE.md §1) — no tab-set restructure.
- [ ] **UXD-M2-T02** `BottomTabBar tab-item.tsx` — replace the
      full-cell yellow active fill with a 4-px yellow strip pinned
      to the **top** of the active cell (mock 1/2/4 visual). Bump
      icon size 20 → 24 px and BottomTabBar height 68 → 72 px.
- [ ] **UXD-M2-T03** `app-shell.tsx` `RoleChip` → `<InitialsAvatar>`;
      tap on avatar opens the role-change action that previously
      lived behind the "Cambiar" Btn. Right slot: replace `⚙️`
      emoji with `<Icon name="settings" />` button.
- [ ] **UXD-M2-T04** `EmptyState` + `EmptyVentas` — add
      `icon?: IconName` prop, default to a 48-px Lucide icon inside
      a 72-px yellow rounded-square. Migrate `EmptyVentas` from
      `emoji="🧾"` to `icon="receipt"`. Sweep other emoji-driven
      empty states in the same pass.

### Milestone UXD-M3 — Screen-level redesigns

These rebuild the larger screens to match the mocks. Each
ships behind the foundation primitives M1/M2 already shipped.

- [ ] **UXD-M3-T01** New component `<HoyHeroCard>` (yellow Card +
      `VENTAS HOY · 24 ABR` eyebrow + 32 px black amount + bottom
      row with `EGRESOS` / `NETO` split). Replaces the current
      `TotalCard` inside `VentasScreen`.
- [ ] **UXD-M3-T02** Extract shared `<MovimientoRow>` (leading
      icon-circle, concepto + tag row, signed amount on right)
      and recompose `VentaCard` + the egreso list rows on top of
      it. Update tone: `+$XXX` green for paid ventas, plain red
      for egresos, `colors.warning` only on the _tag_ for pendiente.
- [ ] **UXD-M3-T03** Director `<UtilidadHero>` — switch
      `<Card variant="yellow">` → `variant="black"`, white title,
      yellow value. Add two `<Tag>` chips (`success` for change-vs-
      prior-month, `brand` for goal %).
- [ ] **UXD-M3-T04** Director `<HoyKpiStrip>` → new `<MesKpiGrid>`
      (2×2): `VentasMes` (green), `EgresosMes`, `CxCTotal` (green),
      `EfectivoActual`. Add `useTotalCxC` + `useEfectivoActual`
      hooks if they don't already exist.
- [ ] **UXD-M3-T05** New component
      `<SaludFinancieraCard>` — three stacked `<Gauge>` rows
      (`margenBruto`, `liquidez`, `metaMes`) inside one white Card.
      Driven by `useIndicadores()`.
- [ ] **UXD-M3-T06** Director Home — wrap `ActividadReciente`,
      `StockBajoCard`, `PendientesDirectorCard`,
      `ConflictosRecientesCard` in a collapsed **"Más"** panel
      below the `CUENTAS POR COBRAR` block per ADR-040.
- [ ] **UXD-M3-T07** Replace `<Input type="select">` for
      `MÉTODO DE PAGO` in `nueva-venta-fields.tsx` with
      `<SegmentedToggle>`. Add helper `note` under the monto Input
      (`'Sin IVA. Se redondea al guardar.'`). Footer: side-by-side
      `<Btn variant="outline">CANCELAR</Btn>` + `<Btn variant="primary">
  GUARDAR</Btn>` with equal flex.
- [ ] **UXD-M3-T08** `ModalHeader` callers — pass `subtitle` =
      `Intl.DateTimeFormat('es-MX', { day:'numeric', month:'short',
  hour:'2-digit', minute:'2-digit' }).format(now)` for
      transactional modals (NuevaVenta, NuevoEgreso). Use
      `leftAvatar` slot for the role-initials avatar.

### UXD exit criteria

- All four mocks render at least 95% pixel-faithfully on a
  Storybook visual snapshot (mobile + desktop targets).
- Zero emoji glyphs in `packages/ui/src/screens` or
  `packages/ui/src/components` runtime code.
- Director Home above-the-fold matches mock 4 exactly: black
  hero, 2×2 KPI grid, Salud Financiera card, CxC list. Mandated
  cards present below in collapsed Más panel.
- All copy lives in `es-mx.ts`; no hardcoded strings.

### Milestone UXD-R2 — Round-2 audit fix (Closed 2026-04-25)

After UXD-M1/M2 shipped the icon foundation and `<Input
type="select">` migrations, a Round-2 audit surfaced two
production-impacting regressions:

1. **Bottom-tab + EmptyState icons rendered as pink "Un"
   placeholders** on iOS/Android because `react-native-svg`'s
   native module wasn't autolinked into the `apps/mobile` bundle.
   Director Home crashed inside the reconciler the moment any
   `<EmptyState icon="…">` mounted. Per ADR-041 the fix is to
   declare `lucide-react-native` + `react-native-svg@15.15.4`
   (Expo SDK 55 pin) as direct deps in `apps/mobile/package.json`,
   and `lucide-react` in `apps/desktop/package.json`. RN's
   autolinker now registers the native module so every icon
   renders correctly and the Director crash chain disappears.
2. **`<Input type="select">` opened a separate bottom-sheet
   modal** instead of an anchored picker, reading as
   "misaligned at the bottom-left" of the viewport. Per ADR-041
   we built a new `<Combobox>` primitive (anchored Tamagui
   Popover, hard-shadow brand panel, opt-in searchable filter)
   and refactored `SelectField` (web + native) to delegate to it.
   ~12 existing call sites migrated automatically (zero call-site
   changes); lists with more than six options auto-enable the
   typeahead filter.

- [x] **UXD-R2-T01** Add `lucide-react-native@^1.11.0` +
      `react-native-svg@15.15.4` to `apps/mobile/package.json`;
      add `lucide-react@^1.11.0` to `apps/desktop/package.json`.
- [x] **UXD-R2-T02** Add `@tamagui/popover@2.0.0-rc.41` as a
      peer dep of `@cachink/ui`.
- [x] **UXD-R2-T03** Build `<Combobox>` primitive at
      `packages/ui/src/components/Combobox/`: orchestrator
      (`combobox.tsx`), sub-views (`combobox-views.tsx`), shared
      types (`combobox-types.ts`), barrel, 5 Storybook stories
      (Default / Empty / ManyOptions / Searchable / Disabled),
      14 vitest tests.
- [x] **UXD-R2-T04** Refactor `<Input type="select">` (web +
      native) to delegate to `<Combobox>`. Drop the bottom-sheet
      `<Modal>` import from `input.native.tsx`. Auto-enable
      `searchable` when option count > 6.
- [x] **UXD-R2-T05** Update `input.test.tsx` (4 select-branch
      assertions rewritten against Combobox testIDs). Verify
      `business-form.test.tsx` still passes unchanged.
- [x] **UXD-R2-T06** ADR-041 added; `packages/ui/package.json` + apps' package.json reflect the new deps; pnpm install
      reproduced.

**Workspace gate (2026-04-25):** lint 5/5 packages clean,
typecheck 9/10 (apps/mobile pre-existing `sync-cloud/client`
subpath issue unaffected by this slice — proven by stash
regression), 9/9 turbo test tasks green (801/801 UI tests
including 14 new Combobox + 4 updated Input + 6 unchanged
EmptyState/Icon tests).

---

## Audit M-1 — Resilience Foundation

- [ ] **PR 1 — Resilience Foundation**
- [ ] **PR 2 — Input Primitive Rewrite (RHF + Zod)**
- [ ] **PR 3 — Modal → Page Conversions + ADR-042**
- [ ] **PR 4 — List Virtualization + FAB + Reachability**
- [ ] **PR 5 — Layout & Density + Component Coverage Polish**

---

## 🚧 Audit M-1 — Mobile-First UI/UX Audit Implementation (in progress)

Implements the 5-PR plan from the April 2026 mobile-first audit. Each
PR addresses a tier of findings from the audit (resilience → input
primitive → modal/page conversions → list virtualization → density &
polish). Sequential dependencies — each PR unblocks the next.

### M-1 PR 1 — Resilience Foundation (Closed 2026-04-25)

Closed the 5 user-blocking issues that prevented the app from running
at all on certain configurations:

- **Typecheck unblocked** — `@cachink/sync-cloud` added to
  `apps/mobile/package.json` so the workspace gate moves from 8/9 to 9/9.
- **Blank-screen DB-failure replaced** — new
  `<DatabaseErrorState>` + `useDatabaseLifecycle` hook owns the
  error / retry / reset state machine. Renders a brand-styled fallback
  Card with Reintentar / Copiar detalles / Restablecer base de datos
  Btns (mirrors `<AppErrorBoundary>`).
- **Tablet landscape unlocked** — `apps/mobile/app.json:7`
  `'portrait'` → `'default'`. iPad in horizontal stand now renders
  correctly.
- **SafeAreaProvider mounted** — `<TopBar.native>` reads
  `useSafeAreaInsets().top` so the TopBar isn't clipped under the
  iPhone notch / iPad rounded corners.
- **`<ConfirmDialog>` primitive** — replaces `globalThis.confirm()`
  in `producto-detail-route.tsx` (silently no-op on RN). Available as
  `@cachink/ui/components/ConfirmDialog`.
- Modal close-button hit area expanded to 44 pt via `hitSlop`;
  `data-hit-slop` attribute exposed for testability.
- Stray Unicode glyphs (`✕`, `▾`) replaced with `<Icon>` calls.

- [x] **M-1-PR1-T01** `@cachink/sync-cloud` workspace dep added to
      `apps/mobile/package.json` + `pnpm install` + workspace
      typecheck back to 9/9.
- [x] **M-1-PR1-T02** `<DatabaseErrorState>` + `useDatabaseLifecycle`
      replace `null`-render fallback in `_internal.tsx`.
- [x] **M-1-PR1-T03** Mobile orientation flip (`portrait` →
      `default`) in `apps/mobile/app.json`.
- [x] **M-1-PR1-T04** `<SafeAreaProvider>` mounted in mobile
      `_layout.tsx`; `<TopBar.native>` consumes
      `useSafeAreaInsets().top`.
- [x] **M-1-PR1-T05** New `<ConfirmDialog>` primitive +
      `producto-detail-route.tsx` migration.
- [x] **M-1-PR1-T06** Modal close-button hitSlop + Icon swap
      (`<Text>✕</Text>` → `<Icon name="x">`).
- [x] **M-1-PR1-T07** `Input.native` chevron Icon swap
      (`<Text>▾</Text>` → `<Icon name="chevron-down">`).

### M-1 PR 2 — Input Primitive Foundation (Closed 2026-04-25, deferred form migrations)

Foundation chunk of the audit's PR 2 — the new typed field primitives,
keyboard hint plumbing, and emoji→Icon sweep on the wizard. Form
migrations (RHF + Zod resolvers across 15 forms) are split into
M-1-PR2.5 below to keep the foundation reviewable.

- [x] **M-1-PR2-T01** Extend `<Input>`'s `InputType` union with
      `'email' | 'phone' | 'password' | 'decimal'`. New
      `keyboardHintsFor(type)` lookup resolves the right
      `keyboardType` (RN) / `inputMode` (web) / `secureTextEntry` /
      `autoCapitalize` / `autoComplete` / `autoCorrect` per variant.
- [x] **M-1-PR2-T02** Wire `returnKeyType` / `onSubmitEditing` /
      `blurOnSubmit` / `autoComplete` / `onBlur` through
      `<Input>` for Enter-to-advance / Enter-to-submit form flows.
- [x] **M-1-PR2-T03** New typed field primitives in
      `packages/ui/src/components/fields/`:
      `<TextField>`, `<EmailField>`, `<PhoneField>`,
      `<PasswordField>` (with show/hide toggle, `current-password` vs
      `new-password` autofill), `<IntegerField>` (strips non-digits,
      clamps to min/max on blur), `<MoneyField>` (strips formatting,
      formats on blur via `formatPesos`, exposes canonical `Money`
      bigint via `onValueChange`), `<DateField>` (platform extension:
      web uses native `<input type="date">`, mobile uses brand-styled
      `<Modal>` + `<Combobox>` triplet to avoid blocking on a native
      datetimepicker dep).
- [x] **M-1-PR2-T04** New `forms.*` i18n namespace
      (`forms.password.show/hideAriaLabel`,
      `forms.money.placeholderDefault`,
      `forms.date.placeholderDefault/clearAriaLabel`).
- [x] **M-1-PR2-T05** 19 new test cases in `tests/fields.test.tsx`
      covering keyboard-hint resolution, MoneyField blur formatting +
      bigint emission, IntegerField clamping, PasswordField toggle.
- [x] **M-1-PR2-T06** Curated `IconName` union extended with form
      affordances (`eye`, `eye-off`, `camera`, `calendar`, `search`)
      and wizard scenarios (`smartphone`, `building-2`, `cake`,
      `truck`, `utensils`, `clipboard-list`).
- [x] **M-1-PR2-T07** Wizard Step 1 cards migrated from
      `emoji="📱"`/`emoji="🏢"` to `icon="smartphone"`/
      `icon="building-2"` via new `<WizardCard icon>` slot (yellow
      48-px rounded square + 24-px Lucide icon). `emoji` prop kept
      for back-compat.
- [x] **M-1-PR2-T08** WizardCard requirement bullet (`📋`) replaced
      with typographic `•` (Unicode bullet, not emoji).
- [x] **M-1-PR2-T09** Pre-existing flake stabilised
      (`use-lan-handle.test.tsx` waitFor bumped to 4 s).
- [x] **M-1-PR2-T10** `useDatabaseLifecycle` extracted from
      `_internal.tsx`'s `<AsyncDatabaseProvider>` so the provider
      stays under the 40-line ceiling. Lifecycle split into
      `useDatabaseOpener` + `useCopyDetail` + `useResetFlow` for
      readability and testability.

### M-1 PR 2.5 — Form migrations + audit polish (in progress)

Converting forms from `useState` + manual validation to either
(a) full RHF + zodResolver via the new `<Rhf*Field>` wrappers, or
(b) a lighter-touch swap of the existing `<Input type="…">` calls for
the typed field primitives (when the existing form-state hook already
owns Zod-shape validation). Field primitives are RHF-agnostic so the
migration is mechanical and forms can convert one row at a time.

- [x] **M-1-PR2.5-T01** Promote `react-hook-form` to
      `packages/ui/peerDependencies` (already direct in apps/mobile +
      apps/desktop). Add `@hookform/resolvers@^5.2.2` peer (Zod 4
      compatibility — initial 3.9 install rejected Zod 4 errors).
- [x] **M-1-PR2.5-T02a** Build the `<Rhf*Field>` family in
      `packages/ui/src/components/fields/controlled.tsx` (RhfTextField,
      RhfEmailField, RhfPhoneField, RhfPasswordField, RhfMoneyField,
      RhfIntegerField, RhfDateField). Each takes RHF `control` +
      `name` + `errorMessage` and renders a Controller internally so
      forms collapse a row to one component.
- [x] **M-1-PR2.5-T02b** Full RHF + Zod migration:
      `NuevoClienteModal`, `RegistrarPagoModal` — first two forms
      to use the new pattern end-to-end. Tests still 3/3 + 0
      regressions.
- [x] **M-1-PR2.5-T02c** Lighter-touch `<Input>` → field-primitive
      migrations (existing form-state hook preserved):
      `NuevaVentaModal`, `NuevoProductoModal`, `MovimientoModal`,
      `GastoTabFields`, `NominaTab`, `InventarioTab`,
      `NuevoEmpleadoModal`, `GastoRecurrente`, `VentasScreen`,
      `EgresosScreen`, `PeriodPicker`, `PasswordResetScreen`,
      `OnboardingForm` (CloudOnboarding sign-in + sign-up).
      All money inputs now use `<MoneyField>` (audit 1.4 closed),
      all date inputs use `<DateField>` (audit 1.3 closed), all
      passwords use `<PasswordField>` (audit 1.2 closed), all
      phone inputs use `<PhoneField>` (audit 1.5 closed), all
      email inputs use `<EmailField>` (audit 1.6 closed), all
      integer inputs use `<IntegerField>` with min/max clamping
      (audit 1.7 closed).
- [x] **M-1-PR2.5-T03** Audit blocker 1.2 closed —
      `OnboardingForm` was rendering passwords in plaintext
      (`<Input>` with `placeholder="********"` was cosmetic). Now
      `<PasswordField>` masks by default, exposes a show/hide
      toggle, and routes `autoComplete` to `'new-password'` on
      sign-up so OS password managers store a new credential.
- [x] **M-1-PR2.5-T04** `<Btn>` extended with optional `icon` prop +
      `children` made optional. Producto scanner button migrated
      from `📷 Label` to `<Btn icon={<Icon name="camera">}>Label</Btn>`.
- [x] **M-1-PR2.5-T05** Audit 9.3 closed — `<BtnLabel>` defaults to
      `numberOfLines={1}` + `ellipsizeMode="tail"`. Long Spanish
      strings ("REGISTRAR PAGO", "COMPARTIR COMPROBANTE") no longer
      wrap on phone widths.
- [x] **M-1-PR2.5-T06** Audit 9.4 closed — `<BtnLabel>` defaults to
      `maxFontSizeMultiplier={1.3}` so iOS Dynamic Type / Android
      font scaling above 130 % doesn't overflow buttons.
- [x] **M-1-PR2.5-T07** Remaining forms migrated 2026-04-26 (Audit
      Round 2 Phase H): `BusinessForm` swaps the nombre `<Input>` for
      `<TextField>` and wires Enter-to-submit on the ISR-tasa field;
      `CorteDeDia` modal swaps the contado / explicacion `<Input>`s
      for `<MoneyField>` + `<TextField>`; `AdvancedBackendScreen`
      swaps all three URL inputs for `<TextField>`; `LanJoinScreen`
      paste-URL input swaps to `<TextField>` with Enter-to-paste.
      All four forms now drive the typed-keyboard primitives + the
      Bluetooth-keyboard Enter-to-advance plumbing from PR3.5-T06.
      Workspace gate green.
- [x] **M-1-PR2.5-T08** Wizard Step 2/2A/2B/3 emoji glyphs
      (`💾 ☁️ 🔌 🖥️`) — migrated to `<Icon>` (2026-04-26). Curated
      `IconName` union extended with `hard-drive`, `cloud`, `plug`,
      `monitor`. All 6 emoji= props on the wizard step cards now use
      `icon=`. 34/34 wizard tests still pass; help-modal i18n-driven
      emoji is out of scope for this task. Closes audit 4.12.

### M-1 PR 3 — Modal hardening + ADR-042 (Closed 2026-04-25, route refactor parked)

The audit's PR 3 had two distinct workstreams:

**A. Architectural foundation + Modal-primitive fixes (closed):**

- [x] **M-1-PR3-T01** ADR-042 added to ARCHITECTURE.md.
      "Multi-step transactional flows are Stack pages, not single
      modals with internal tabs; KeyboardAvoidingView at the Modal
      primitive." Supersedes ADR-020. ADR-020's status updated to
      "Superseded by ADR-042" with a forensic note.
- [x] **M-1-PR3-T02** `position: 'fixed'` → `'absolute'` in
      `modal.native.tsx` (audit Blocker 1.10). RN doesn't accept
      `'fixed'`; the value was silently dropped on iOS / Android.
      The web tests caught nothing because the value resolves
      correctly under jsdom. Inside `<Dialog.Portal>`, `'absolute'`
      produces the same screen-edge anchoring the web variant has
      always relied on.
- [x] **M-1-PR3-T03** `<Modal>` primitive wraps content in
      `<KeyboardAvoidingView>` on RN (audit Blocker 1.9). Behaviour:
      `'padding'` on iOS, `'height'` on Android — every modal-based
      form benefits without per-screen plumbing. Web-variant unchanged
      (RN-Web's KAV is a no-op div).
- [x] **M-1-PR3-T04** `react-native` aliased to `react-native-web` in
      `packages/ui/vitest.config.ts`. The `.native.tsx` variants now
      import from `'react-native'` for `KeyboardAvoidingView` /
      `Platform`; vitest can't parse RN's Flow-typed `index.js`, so
      the alias maps to RN-Web's plain-JS equivalents under jsdom.
      All 11 `tests/modal.native.test.tsx` cases continue to pass.
- [x] **M-1-PR3-T05** `<ComprobantePreview>` HTML rendering replaced
      with platform-extension `<PreviewFrame>` (audit 2.16). Web /
      Tauri variant uses sandboxed `<iframe srcDoc={html}
  sandbox="allow-same-origin">` so the preview matches the shared
      receipt 1:1 (the previous implementation displayed raw HTML as
      monospace text). RN variant keeps a labelled fallback until
      `react-native-webview` is added in a follow-up — the migration
      is one component swap.
- [x] **M-1-PR3-T06** Workspace gate green after PR 3 changes:
      9/9 typecheck, 9/9 lint, 836/836 UI tests + 569 across the
      other 8 packages = 1405 total (was 1404 before; added 1 iframe
      regression assertion).

**B. Route-stack refactor (parked — own slice):**

The architectural commitment lives in ADR-042. The actual route
refactor (NuevoEgreso 3-tab modal → `/egresos/nuevo/{gasto,nomina,
inventario}` Stack pages, NuevoEmpleadoModal →
`/egresos/nuevo/nomina/empleado-nuevo`, NuevaVentaModal →
`/ventas/nuevo` on mobile, ClienteDetailRoute stops wrapping in Modal,
Scanner becomes full-screen) is a multi-day project that touches:

- 7+ new Expo Router routes in `apps/mobile/src/app/`.
- 7+ matching adapters in `apps/desktop/src/app/routes/`.
- `desktop-router.tsx` dispatch-table updates.
- 4 smart wrappers (`<NuevoEgresoModalSmart>`, etc) deprecated and
  replaced with route-mounted equivalents.
- 25 Maestro flows updated to the new path semantics.
- New keyboard / scroll containers per page.

Splitting this off as its own slice keeps PR 3 reviewable as a
focused architectural-foundation PR and unblocks PR 4 / PR 5 work
in parallel.

- [ ] **M-1-PR3.5-T01** Convert NuevoEgreso modal → 4-route Stack.
- [ ] **M-1-PR3.5-T02** Convert NuevoEmpleadoModal + NuevoProductoModal
      to nested routes.
- [ ] **M-1-PR3.5-T03** Convert NuevaVentaModal → mobile page (desktop
      stays modal via platform extension).
- [ ] **M-1-PR3.5-T04** ClienteDetailRoute — drop Modal wrapper, push
      `/clientes/[id]` page.
- [ ] **M-1-PR3.5-T05** Scanner becomes full-screen (no 480-pt max-width
      Modal constraint).
- [x] **M-1-PR3.5-T06** Bluetooth-keyboard Enter-to-submit + Tab order + Escape-to-cancel across forms (2026-04-26). Audit confirmed:
      Modal Escape already handled by Tamagui Dialog (`@tamagui/dialog`
      ships ESC-to-close + focus trap built-in); Tab order is default
      web behavior on Tamagui Inputs (rendered as `<input>` on web).
      The remaining gap was Enter-to-submit on the last keyboard-typed
      field — wired on 8 forms: NuevaVenta (monto), Gasto-Egreso
      (proveedor), Nomina-Egreso (salario), Inventario-Egreso (costo),
      NuevoEmpleado (salario), NuevoProducto (umbral), Movimiento
      (nota), CloudOnboarding (password on signin / businessName on
      signup). 4 regression tests in `tests/perf/keyboard-submit.test.tsx`
      assert keyDown Enter reaches the last field without crashing.
      Closes audit 5.4.
- [x] **M-1-PR3.5-T07** Comprobante WebView + rasterization
      (2026-04-26). E1: added `react-native-webview@~13.16.1` and
      `react-native-view-shot@~4.0.3` direct mobile deps; migrated
      `comprobante-preview-frame.native.tsx` from monospace-text
      fallback to `<WebView source={{ html }}>` so the on-device
      preview matches the web `<iframe>` 1:1. Optional `frameRef`
      prop added to both shared (web) + native variants for
      view-shot to capture. E2: built `rasterizeComprobante`
      primitive — shared contract + web variant
      (html2canvas + jspdf, dynamic-imported, hidden-container
      approach with scale=2 for crisp WhatsApp shares) + native
      variant (view-shot.captureRef + data-URI to Blob, PNG-only
      with PDF→PNG downgrade warning). E3: added
      `shareComprobanteAsImage` — additive helper that bundles
      rasterize + shareFile so callers get OS-native share sheets
      with PNG/PDF attachments instead of the previous text-only
      HTML fallback. Existing `shareComprobante` HTML path
      preserved for back-compat. SETUP.md updated to cover the
      prebuild + pod install + EAS rebuild requirement for
      gesture-handler + webview + view-shot under one section.
      Tests: 4 rasterize + 3 share-image cases (web variants);
      native paths verified via Maestro per Scanner.native pattern.
      Closes audit 2.16.

> **Route-stack refactor (T01–T05) status (2026-04-26):** documented
> as multi-week work in ADR-042. Each route migration touches 7+ new
> Expo Router routes, 7+ matching desktop adapters,
> `desktop-router.tsx` dispatch-table updates, smart-wrapper
> deprecation + replacement, and 25 Maestro flow updates.
> Maestro flows require real iOS / Android simulators to validate,
> which the audit closeout environment doesn't have. Each route
> migration ships as its own slice, owned end-to-end so the Maestro
> flows can be re-run on a dev laptop. T06 + T07 are independent of
> the route refactor (T06 closed 2026-04-26; T07 lands in Phase E).

### M-1 Step 0 follow-ups — Emulator-discovered audit gaps (filed 2026-04-26)

These five items came out of the Maestro emulator pass (Step 0 of
the "Phase L + Phase I + Playwright drift + Maestro emulation pass"
plan). Full context in
[`AUDIT-M1-STEP0-FINDINGS.md`](./AUDIT-M1-STEP0-FINDINGS.md).

- [ ] **M-1-STEP0-T01 (Blocker, S)** Replace `<View onPress>` in the
      `Btn` primitive with `<Pressable>` so Maestro/iOS synthetic
      taps fire `onPress`. Today every Maestro flow that taps a Btn
      is silently no-op'd at the JS layer, even though Maestro
      reports "Tap … COMPLETED". This blocks the full
      `pnpm --filter @cachink/mobile test:e2e` sweep — Step 4 of
      the audit plan cannot reach green until this lands. Tested
      with explicit testID, text-match, and direct-coordinate taps;
      none fire the Btn's `onPress`. Fix swap is the Btn primitive
      (`packages/ui/src/components/Btn/btn.tsx`); preserves the
      existing `pressStyle` press transform via Pressable's
      `style={({pressed}) => …}` API.
- [ ] **M-1-STEP0-T02 (High, S)** Defer the `ConsentModal` past
      the first-launch wizard. Today it auto-mounts before the user
      has set anything up; users have zero context for the consent
      decision. Mount it after the wizard completes (e.g. on
      reaching the role picker, or first user-initiated action).
      One-line `useEffect` gate in `TelemetryBridge` +
      regression test.
- [ ] **M-1-STEP0-T03 (High, S)** Wire `useSafeAreaInsets()` into
      `modal.native.tsx` so the bottom-sheet doesn't extend below
      the iPad home-indicator. Add
      `paddingBottom: Math.max(insets.bottom, 36)` to the
      `<Dialog.Content>`. Every modal-based form benefits.
- [ ] **M-1-STEP0-T04 (Medium, M)** Break the 10 require-cycle
      warnings logged in `packages/ui`. Inventory in
      `AUDIT-M1-STEP0-FINDINGS.md` §F0-T08. Most are barrel-export
      cycles fixable by importing from the leaf module instead of
      `index.ts`; three are self-imports in `.native.tsx`
      platform-extension files that look like re-export typos.
- [ ] **M-1-STEP0-T05 (Medium, S+S)** Run
      `pnpm --filter @cachink/mobile exec expo install --fix`,
      commit the resulting native-dep downgrades (5 packages
      currently mismatched with Expo SDK 55), and re-verify
      typecheck across the workspace. Pairs with M-1-STEP0-T01:
      the Btn-tap blocker may be related to a newer Tamagui /
      gesture-handler interaction that downgrading would fix.

> **Why these aren't squashed into a single PR:** T01 unblocks
> Maestro for the entire suite and is best landed alone so we can
> regression-test by re-running the full 30-flow sweep. T02 + T03
> are consent-modal-specific and ship together. T04 is mechanical
> refactoring with high test fan-out — separate PR. T05 is a
> dep-bump with potential native-side TS fallout — separate PR.

### M-1 PR 4 — List + FAB foundation + reachability quick wins (Closed 2026-04-25, screen-by-screen migration parked)

The audit's PR 4 has two natural halves: the foundation primitives
(`<List>`, `<FAB>`, plus a few one-line tap-target / a11y fixes)
and the iterative migration of the 9 list screens onto the new
primitive. The foundation is shipped; the migration ships
screen-by-screen as each one is touched for unrelated work, so PR 4
doesn't block on a multi-day refactor.

- [x] **M-1-PR4-T01** New `<FAB>` primitive at
      `packages/ui/src/components/FAB/`. 56-pt yellow circle with
      §8.3 hard 4×4 black drop shadow, press-transform, hitSlop to
      ~64-pt effective tap target. Default position
      `position:'absolute', bottom:88, right:24` (above the
      72-pt BottomTabBar). 4 new tests.
- [x] **M-1-PR4-T02** New `<List>` primitive at
      `packages/ui/src/components/List/` with platform extension:
      `.native.tsx` delegates to `<FlatList>` (audit's `<FlatList>`
      decision; `@shopify/flash-list` rejected per "fewer deps"),
      `.tsx` (web) renders a `.map()` inside a `<View>`. Same surface
      area as FlatList for the props that matter (data, renderItem,
      keyExtractor, header / footer / empty, optional getItemLayout).
      5 new tests.
- [x] **M-1-PR4-T03** `react-native` / `react-native-web` alias
      already in `packages/ui/vitest.config.ts` (added in PR 3) —
      the `<List.native>` variant resolves cleanly under jsdom for
      tests.
- [x] **M-1-PR4-T04** First migration: `<ClientesScreen>`'s
      `.map()` → `<List>`. 6/6 existing tests pass without changes;
      the migration is mechanical.
- [x] **M-1-PR4-T05** Second migration: `<VentasScreen>`'s
      `.map()` → `<List>` + optional `<FAB>` mount via new `showFab`
      prop (mobile shells opt-in; desktop unchanged). +2 new
      tests for FAB mount / no-mount cases.
- [x] **M-1-PR4-T06** Audit 4.5 — TotalCard moves above the date
      filter on `VentasScreen` and `EgresosScreen` so the day-total
      stays above the fold when the keyboard is open on a phone.
- [x] **M-1-PR4-T07** Audit 4.13 — `Wizard/step1-welcome.tsx`
      `<SecondaryLink>` `paddingVertical` 6 → 14 + hitSlop. Effective
      tap target now ~47 pt (was ~25 pt).
- [x] **M-1-PR4-T08** Audit 3.8 — `<RecurrenteToggle>`
      `paddingVertical` 8 → 14 + hitSlop. Effective tap target now
      44 pt (was 40 pt).
- [x] **M-1-PR4-T09** Audit 3.5 — `<RolePicker>` Cards are now
      tappable on the entire surface, not just the inner Btn. Both
      `Card.onPress` and `Btn.onPress` route to the same parent
      handler (idempotent).
- [x] **M-1-PR4-T10** Audit 3.11 + 3.12 — `<Btn>` icon-only
      configuration (children optional when icon is set, see PR 2.5);
      hardcoded `ariaLabel="Ajustes"` on the settings cog Btn pulled
      into `topBar.openSettings` i18n key.

### M-1 PR 4.5 — List-screen migrations + FAB mounts (Closed 2026-04-25)

Migrated every remaining `.map()` list to the `<List>` primitive
and mounted `showFab` opt-in on the three remaining mobile-primary
list screens. Pattern is one-line import + one `<List>` swap.

- [x] **M-1-PR4.5-T01** `<EgresosScreen>` `.map()` → `<List>` +
      `showFab` opt-in for the mobile shell.
- [x] **M-1-PR4.5-T02** `<StockScreen>` `.map()` → `<List>` +
      `showFab` opt-in. `<Input label="Buscar">` → `<SearchBar>`.
- [x] **M-1-PR4.5-T03** `<MovimientosScreen>` `.map()` → `<List>`
      with `ListEmptyComponent` for the no-movimientos case.
- [x] **M-1-PR4.5-T04** `<ClienteDetailScreen>` `pendingSales`
      `.map()` → `<List>` with `ListEmptyComponent`.
- [x] **M-1-PR4.5-T05** `<CuentasPorCobrarStrip>` `.map()` →
      `<List>` with `ListEmptyComponent`.
- [x] **M-1-PR4.5-T06** `<ActividadReciente>` `.map()` → `<List>`
      with `ListEmptyComponent`.
- [x] **M-1-PR4.5-T07** `<ConflictosRecientesCard>` `.map()` →
      `<List>`.
- [x] **M-1-PR4.5-T08** `<ClientesScreen>` `.map()` → `<List>` (PR 4) + `showFab` opt-in (this slice). `<Input label="Buscar">` →
      `<SearchBar>`.
- [x] **M-1-PR4.5-T09** `<SwipeableRow>` primitive shipped
      (2026-04-26). `react-native-gesture-handler@~2.31.1` added as a
      direct mobile dep; root wrapped in `<GestureHandlerRootView>`
      at `apps/mobile/src/app/_layout.tsx`. Primitive shape:
      `swipeable-row.tsx` (shared contract) +
      `.native.tsx` (gesture-handler `Swipeable` with brand-faithful
      yellow `Editar` / red `Borrar` action panels) + `.web.tsx`
      (passthrough — desktop's affordance is right-click context
      menu, out of scope). 5 unit tests pass on the web variant;
      native swipe gesture is verified via Maestro per the
      Scanner.native pattern. SETUP.md documents the
      `expo prebuild` + `pod install` + EAS rebuild steps the dev
      laptop must run after pulling the gesture-handler bump.
- [x] **M-1-PR4.5-T09b** Per-screen swipe wiring on Ventas / Egresos
      / Productos / Clientes shipped 2026-04-26 (Audit Round 2
      Phases J + K). - **Phase J — edit infrastructure (Sales / Expenses / Products):**
      per ADR-023, extended each repository interface with the
      `update(id, patch)` method + matching Drizzle + InMemory
      implementations + contract-test coverage. Built
      `EditarVentaUseCase`, `EditarEgresoUseCase`, and
      `EditarProductoUseCase` in `@cachink/application` (all three
      re-validate via the entity Zod schemas; Sales additionally
      re-asserts the Crédito invariant). Added the matching RHF-
      agnostic mutation hooks `useEditarVenta`, `useEditarEgreso`,
      `useEditarProducto`. Built minimal edit modals per entity —
      `EditarVentaModal`, `EditarEgresoModal`, `EditarProductoModal`
      — that pre-populate from the supplied row, submit via the new
      hook, and reuse the typed-field primitives. `costoUnitCentavos`
      is intentionally excluded from the Producto patch shape to
      preserve historical inventory valuation (Phase 2 owns the
      re-pricing flow). 21 new use-case + contract tests, all green. - **Phase K — per-screen wiring:** extended `<VentasScreen>`,
      `<EgresosScreen>`, `<StockScreen>`, `<ClientesScreen>` with
      optional `onEdit{X}` + `onEliminar{X}` handlers. When set,
      each row wraps in `<SwipeableRow>` whose left swipe fires the
      edit handler and right swipe fires the delete handler — the
      existing tap-into-detail + tap-into-popover paths stay as the
      accessible non-gesture fallbacks per the audit's 3.6 + 3.7
      contract. 8 new screen tests assert the `<SwipeableRow>` mount
      contract on web (native swipe gesture is verified via Maestro
      on a dev laptop per the Scanner.native pattern). Mobile route
      adapters (`apps/mobile/src/app/{ventas,egresos,clientes,
    inventario}.tsx`) wire the new handlers to the edit modal +
      `<ConfirmDialog>` mounts; per-route SwipeSlots / DetailSlots
      live in `apps/mobile/src/shell/{venta,egreso,cliente,inventario}-slots.tsx`
      so the route files stay under the §4.4 200-line cap. - **Workspace gate:** 9/9 typecheck, 9/9 lint, UI 923/923 tests
      (was 893; +30 new tests across J + K). - **Maestro coverage:** the Maestro flow updates are tagged
      `needs-device-QA` and roll up into Phase M of the Round 2
      roadmap (real-device pass on a dev laptop with iOS Simulator
      / Android Emulator).
- [ ] **M-1-PR4.5-T10** Web `@tanstack/react-virtual` swap inside
      `list.tsx` once any single list grows past ~200 rows. The
      public `<List>` API is already shaped for this.

### M-1 PR 5 — Component coverage primitives + density polish (Closed 2026-04-25, useMedia + SplitPane parked)

The audit's PR 5 has two natural halves: the missing reusable
primitives (`<Skeleton>`, `<ErrorState>`, `<SearchBar>`) +
small-fix polish, and the architectural density work (Tamagui
`useMedia()` + `<SplitPane>` for tablet landscape split-list-detail
views). The primitives + polish are shipped; the layout work is
parked as PR 5.5.

- [x] **M-1-PR5-T01** New `<Skeleton>` primitive at
      `packages/ui/src/components/Skeleton/`. Compound shape:
      `<Skeleton.Row>` (the canonical Card + two grey bars used by
      Ventas / Egresos / Inventario list rows) and `<Skeleton.Bar>`
      (single grey bar for KPI shimmer / header titles). Closes
      audit 6.4. 4 new tests.
- [x] **M-1-PR5-T02** New `<ErrorState>` primitive at
      `packages/ui/src/components/ErrorState/`. Mirrors the existing
      `<EmptyState>` API — title + body + optional retryLabel /
      onRetry. The retry Btn uses brand `danger` variant. Closes
      audit 6.5. 4 new tests.
- [x] **M-1-PR5-T03** New `<SearchBar>` primitive at
      `packages/ui/src/components/SearchBar/`. Wraps the brand
      `<Input>` with a leading `<Icon name="search">` and
      `returnKeyType="search"`. Closes audit 6.3. 3 new tests.
- [x] **M-1-PR5-T04** Migrate inline `SkeletonRow` / `ErrorBanner`
      reimplementations on `<EgresosScreen>` (`egresos-states.tsx`)
      and `<VentasScreen>` (`ventas-screen.tsx`) to the new
      primitives. Screen-scoped testIDs preserved
      (`ventas-skeleton-{0,1,2}`, `egresos-error`, `egresos-retry`,
      etc.) so existing E2E selectors keep working. 9/9 ventas
      screen tests + 1+ egresos screen tests still pass without
      changes.
- [x] **M-1-PR5-T05** Audit 5.5 — Combobox search input now
      ref-asserts focus on open via `useEffect`. The bare
      `autoFocus` prop on TamaguiInput was unreliable across
      Tamagui's open-animation cycle (browsers occasionally drop the
      focus call when the popover entry transition is still in
      flight). The effect re-asserts focus once the input is mounted
      in the DOM, which covers the audit-observed timing window.
- [x] **M-1-PR5-T06** Audit 3.2 — `<SegmentedToggle>` chip height
      stays at 40 (matches the §8 brand toggle row), but `hitSlop`
      pushes the effective tap target to 48 pt — above the 44-pt
      iOS HIG / Android Material minimum without a visual change.

### M-1 PR 5.5 — Layout primitives + inline-toggle migrations (partially Closed 2026-04-25)

Inline tab/chip migrations + Director Home grid + SearchBar adoption
shipped. Tamagui `useMedia()` global adoption + `<SplitPane>` parked.

- [x] **M-1-PR5.5-T01** Audit 4.3 — Tamagui `useMedia()` adoption
      (2026-04-26). Added `breakpoints` (sm/gtSm/gtMd/gtLg) to
      `theme.ts` with form-factor matrix; wired `media` into
      `tamagui.config.ts`. Authored
      `packages/ui/src/responsive/README.md` (157-line breakpoint
      contract with do/don't list and form-factor table). 3 unit
      tests via width-aware `matchMedia` mock — phone (360 px),
      tablet landscape (800 px), wide desktop (1400 px).
      Cumulative-ladder semantics confirmed.
- [x] **M-1-PR5.5-T02** Audit 4.4 — `<SplitPane>` primitive shipped
      (2026-04-26). `packages/ui/src/components/SplitPane/`: shared
      component, index barrel, Storybook stories (Default 40/60,
      Custom 30/70, PhoneFallback). Stacks on `sm`/`gtSm`,
      side-by-side on `gtMd`+. Default 40/60 split via `flex`,
      configurable via `leftFlex` / `rightFlex` / `gap`. 5 unit tests
      cover testID anchors, phone-portrait stacking, gtMd
      side-by-side, intermediate gtSm-but-not-gtMd stacking, and
      custom flex propagation. Per-screen mounts (Director Home +
      Ventas / Egresos / Stock / Clientes / Movimientos) deferred
      to a follow-up T02b slice — each screen needs per-entity
      `selectedId` state, a right-pane detail component, and a
      tap-handler fork (`gtMd` selects, `sm` opens popover/modal/route).
      Same scope-split as the PR 4 → PR 4.5 list-migration pattern.
- [ ] **M-1-PR5.5-T02b** Per-screen `<SplitPane>` mounts on Director
      Home + Ventas / Egresos / Stock / Clientes / Movimientos. Each
      screen needs selectedId state design + a right-pane detail
      component + a tap-handler fork. Scope ~½–1 day per screen ×
      6 screens. Ships as its own slice.
- [x] **M-1-PR5.5-T03** Audit 4.8 — Director Home grid was
      stabilised at a two-column-or-one-column split via
      `width:'48%' + minWidth:240` (2026-04-25 phase A). Phase B
      (2026-04-26) refines this to an explicit 1 / 2 / 3-column
      ladder via `useMedia()`: `sm` → 1, `gtSm`/`gtMd` → 2, `gtLg`
      → 3. `data-columns` attribute exposes the resolved count for
      tests + telemetry. 3 new column-count test cases added
      (8/8 director-home-screen tests pass). Closes the
      "uneven wrap" + "no 3-column at desktop" findings.
- [x] **M-1-PR5.5-T04** Audit 3.1 — 3 inline tab/chip implementations
      migrated to `<SegmentedToggle>`: - `<NuevoEgresoModal>` Gasto / Nómina / Inventario sub-tab
      selector — was `paddingY:8 + opacity-0.7 press`. Now §8.3
      press transform + 48-pt effective tap target. - `<InventarioTabBar>` Stock / Movimientos — same upgrade. - `<MovimientoFields>` Entrada / Salida tipo toggle — same
      upgrade. Behavioral cleanup: tapping the active chip is now
      a no-op (the previous inline TabButton re-fired onChange
      unnecessarily). Test suite updated to reflect the cleaner
      contract.
      `<SegmentedToggle>` got a new `testIDPrefix` prop so existing
      E2E selectors (`egreso-tab-{gasto,nomina,inventario}`,
      `inventario-tab-{stock,movimientos}`,
      `movimiento-tipo-{entrada,salida}`) keep working without
      changes.
- [x] **M-1-PR5.5-T05** Audit 3.10 — `<Tag>` is decorative-only
      (decision recorded in ADR-043, 2026-04-26). Recon confirmed zero
      tappable Tag instances exist today. JSDoc on `tag.tsx` codifies
      the contract and points at `<SegmentedToggle>` for radio-group
      chips and a future `<Btn chip>` variant for single-tap chips.
      `<Chip>` primitive deferred to Phase 2.
- [x] **M-1-PR5.5-T06** Migrated `<StockScreen>` and
      `<ClientesScreen>` search inputs from `<Input label="Buscar">`
      to `<SearchBar>`. Both now show the leading
      `<Icon name="search">` and route Enter to `returnKeyType="search"`.
- [x] **M-1-PR5.5-T07** Audit 9.3 + 9.4 follow-through beyond `<Btn>`
      (2026-04-26). Added `numberOfLines` + `ellipsizeMode` +
      `maxFontSizeMultiplier` to `<SectionTitle>`, `<Kpi>` (label /
      value / hint), `<Tag>`, `<EmptyState>` (title + description),
      `<TopBar>` (title + subtitle), `<ModalHeader>` (title +
      subtitle), and `<InitialsAvatar>`. Caps follow audit
      prescriptions (1.2× for Tag chip-row, 1.3× for primary text,
      1.5× for secondary copy). `tests/perf/text-overflow.test.tsx`
      asserts the compiled clamp classes (`_textOverflow-ellipsis`,
      `_ws-nowrap`, `_WebkitLineClamp-N`) on every primitive — 8
      cases pass. Closes the audit's
      "9.3/9.4 follow-through" item from the Round-2 charter.

---

## Post-Phase 1 — Future Phase Candidates

These are parked per CLAUDE.md §14. When Phase 1 ships and we have real user data, we'll pick 1–2 to plan as Phase 2.

- **Operativo "Más…" tab.** A 4th bottom-tab cell on Operativo
  that opens a roll-up screen exposing every screen / setting that
  isn't on the 3 primary tabs (role change, scanner shortcut,
  cliente list, comprobantes recientes, export, feedback, settings
  shortcut, etc). Per ADR-040, the Operativo bottom-tab bar stays
  3 tabs in Phase 1 (Ventas / Egresos / Inventario, CLAUDE.md §1).
  The "Más…" tab is the chosen Phase 2 affordance for everything
  the design mocks suggest belongs on the bottom bar that doesn't
  fit the §1 contract.
- CoDi QR payment flow
- Clip / Mercado Pago Point integration
- WhatsApp as a first-class share target
- Payment reminders for Crédito ventas
- ESC/POS receipt printer support
- Cash drawer integration
- Simple multi-business support (same user, multiple businesses)

Do **not** plan or build these now. They're listed for visibility only.

---

## Archive

Completed phases collapse here as one-line summaries. Detailed task lists for completed phases move to `ROADMAP-archive.md`.

(No phases archived yet.)
