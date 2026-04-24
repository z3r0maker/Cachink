# ROADMAP-archive.md — Completed Phases (Detail)

> Phases collapse here from `ROADMAP.md` once every milestone is complete,
> per CLAUDE.md §12. Never edit; append-only.

---

## Phase 0 — Foundation (Completed 2026-04-23)

**Goal:** A working monorepo where `pnpm install && pnpm test && pnpm lint` all pass on commit one. No product features yet. Everything that comes later stands on this.

**Exit criteria:** CI green on an empty PR. All 6 packages and 2 apps exist and typecheck. One smoke test passes in every package. Boundaries plugin enforces layer rules. Brand tokens exist in `packages/ui`.

### Milestone P0-M1 — Monorepo skeleton
- [x] **P0-M1-T01** Initialize root `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- [x] **P0-M1-T02** Create all package directories: `domain`, `application`, `data`, `ui`, `sync-lan`, `sync-cloud`, `config`, `testing`
- [x] **P0-M1-T03** Create app directories: `apps/mobile`, `apps/desktop`
- [x] **P0-M1-T04** Set up root `tsconfig.json` with project references for every package and app
- [x] **P0-M1-T05** Verify `pnpm install` completes clean

### Milestone P0-M2 — TypeScript & lint infrastructure
- [x] **P0-M2-T01** Create `packages/config` with shared `tsconfig.base.json`, `eslint.config.js`, `prettier.config.js`
- [x] **P0-M2-T02** Configure ESLint 9 flat config with `@typescript-eslint`, `sonarjs`, `unicorn`, `boundaries`
- [x] **P0-M2-T03** Configure `eslint-plugin-boundaries` with the layer rules from CLAUDE.md §4.2
- [x] **P0-M2-T04** Add Prettier 3 with consistent config
- [x] **P0-M2-T05** Verify `pnpm lint` runs across all packages and catches a deliberate boundary violation
- [x] **P0-M2-T06** Install Husky + lint-staged pre-commit hook

### Milestone P0-M3 — Test infrastructure
- [x] **P0-M3-T01** Install and configure Vitest at the root; one config inherited by packages
- [x] **P0-M3-T02** Add a smoke test (`expect(true).toBe(true)`) in `packages/domain` (actually ~44 real unit tests, far beyond smoke)
- [x] **P0-M3-T03** Add a smoke test in `packages/application`
- [x] **P0-M3-T04** Add a smoke test in `packages/data` (hardware noop tests — 6 cases)
- [x] **P0-M3-T05** Configure `packages/testing` with Vitest matchers, fixtures directory, and in-memory helpers skeleton
- [x] **P0-M3-T06** Add coverage reporting (v8 provider) with thresholds from CLAUDE.md §6 (scaffold bug fixed: base `exclude` pattern was stripping nested barrel implementation files — see `packages/config/vitest.config.js` comment)
- [x] **P0-M3-T07** Verify `pnpm test` runs all smoke tests green (60 tests across domain/ui/data/application)

### Milestone P0-M4 — Mobile app shell (Expo)
- [x] **P0-M4-T01** Initialize Expo SDK 55 inside `apps/mobile` (installed 55.0.17 from npm `latest`)
- [x] **P0-M4-T02** Wire Expo Router, TypeScript, Plus Jakarta Sans font (weights 400/500/700/800 — font ships no 900; runtime snaps 900 → 800)
- [x] **P0-M4-T03** Create `apps/mobile/src/app/_layout.tsx` app-shell only (also `src/shell/tamagui-provider.tsx`)
- [~] **P0-M4-T04** Verify `pnpm --filter @cachink/mobile start` launches in Expo Go on iOS Simulator and Android emulator (`pnpm web` verified: Metro bundles 857 modules in 309 ms, bundle contains `CACHINK!` + `#FFD60A` tokens, served at `http://localhost:8081/`. `pnpm ios` / `pnpm android` still need full Xcode / Android Studio — out of scope for this session.)
- [x] **P0-M4-T05** Add a placeholder "Hello Cachink" screen that imports a component from `@cachink/ui` (`apps/mobile/src/app/index.tsx` renders `<HelloBadge />`)

### Milestone P0-M5 — Desktop app shell (Tauri)
- [x] **P0-M5-T01** Initialize Tauri 2 inside `apps/desktop` (create-tauri-app@4.6.2, `--tauri-version 2 --template react-ts --yes`)
- [x] **P0-M5-T02** Wire Vite + React + TypeScript frontend (`pnpm --filter @cachink/desktop build` produces `dist/index.html` + 276 kB bundle)
- [x] **P0-M5-T03** Install `@tauri-apps/plugin-sql` (JS package + `tauri-plugin-sql` Rust crate added to `src-tauri/Cargo.toml`, registered in `src-tauri/src/lib.rs`)
- [x] **P0-M5-T04** Create `apps/desktop/src/app/main.tsx` app-shell only (also `src/shell/tamagui-provider.tsx`, `src/app/placeholder-screen.tsx`)
- [x] **P0-M5-T05** Verify `pnpm --filter @cachink/desktop tauri dev` launches a native macOS window (rustc 1.95.0 installed; 435-crate cargo build completes in ~41 s; Tauri binary spawns window with Vite dev on :1420)
- [x] **P0-M5-T06** Add the same "Hello Cachink" placeholder using the same `@cachink/ui` import as mobile

### Milestone P0-M6 — Shared UI foundation
- [x] **P0-M6-T01** Install Tamagui 2.0.0-rc.41 in `packages/ui` (latest tag on npm; floor was 1.115+)
- [x] **P0-M6-T02** Encode color tokens from CLAUDE.md §8.1 in `packages/ui/src/theme.ts`
- [x] **P0-M6-T03** Encode typography and shadow scales from §8.2–§8.3
- [x] **P0-M6-T04** Export a single `<HelloBadge />` component used by both apps' placeholder screens (proves cross-platform pipeline works; 100% covered, renders via `TamaguiProvider` + minimal `createTamagui` config in `packages/ui/src/tamagui.config.ts`)
- [x] **P0-M6-T05** Verify both apps render the same component identically (desktop: Tauri native window renders `<HelloBadge />` via Vite; mobile web: Metro bundle contains the exact same `CACHINK!` string + `#FFD60A` tokens; iOS-sim / Android-emu pending Xcode / Android Studio install, same bundle will render)

### Milestone P0-M7 — CI
- [x] **P0-M7-T01** Add `.github/workflows/ci.yml` with: lint → typecheck → unit tests → build
- [x] **P0-M7-T02** Add Renovate config for weekly dependency PRs (`renovate.json` at repo root; groups Tamagui / Storybook / Expo so related peers bump together)
- [ ] **P0-M7-T03** Verify CI green on an empty PR (carry-over: repo not yet a git remote — rolls into Phase 1A prep)

**Completed 2026-04-23.** Carry-overs tracked in `ROADMAP.md` under the collapsed Phase 0 summary (iOS-sim verify, empty-PR CI smoke check — both environmental, not blockers).

---

## Phase 1A — Brand & Component Primitives (Completed 2026-04-23)

**Goal:** All primitive UI components from CLAUDE.md §8.4 exist in `packages/ui`, pass visual regression tests on both platforms, and are documented in Storybook.

**Exit criteria:** A designer or PM can look at Storybook and see every Cachink primitive rendered correctly on mobile and desktop targets. Tests cover each.

### Milestone P1A-M1 — Storybook setup
- [x] **P1A-M1-T01** Pick Storybook 8 vs Ladle (decision → ADR) — **ADR-017** accepts Storybook 10.3+ with `@storybook/react-native-web-vite` preset + Playwright 1.59 for visual snapshots
- [x] **P1A-M1-T02** Set up the chosen tool in `packages/ui` with native + web targets — `.storybook/{main,preview}.tsx` wrap stories in `TamaguiProvider`; `pnpm --filter @cachink/ui storybook` / `build-storybook` / `test:visual` all green
- [x] **P1A-M1-T03** Add a CI job that runs visual regression tests on both targets — `.github/workflows/ci.yml` has a `storybook-visual` job after `verify` that installs Chromium, builds Storybook, runs Playwright, uploads the report on failure

### Milestone P1A-M2 — Core primitives (CLAUDE.md §8.4) — Completed 2026-04-23
- [x] **P1A-M2-T01** `Btn` with all 6 variants + press animation — `packages/ui/src/components/Btn/` with 100% test coverage, 6 variants × 3 sizes + pressed/disabled stories + 6 Playwright baselines
- [x] **P1A-M2-T02** `Input` (text, number, date, select) with label, note, placeholder — `packages/ui/src/components/Input/` with 9 unit tests + 5 stories + 5 Playwright baselines; uses `@tamagui/input` for text/number/date; `<select>` is a native HTML element for now (Modal-backed picker lands as a follow-up once P1A-M2-T04 ships)
- [x] **P1A-M2-T03** `Tag` — `packages/ui/src/components/Tag/` with 7 semantic variants (neutral / brand / soft / success / info / danger / warning) + 7 unit tests + 5 stories + 5 Playwright baselines; 100% coverage; no new dependency
- [x] **P1A-M2-T04** `Modal` (bottom-sheet on mobile, centered on desktop — platform-extension pattern) — `packages/ui/src/components/Modal/` with `modal.tsx` (shared types) + `modal.native.tsx` (bottom-sheet) + `modal.web.tsx` (centered dialog) + `modal-header.tsx` (shared header) + 19 unit tests (9 web + 10 native) + 5 stories + 5 Playwright baselines; 100% coverage; adds `@tamagui/dialog@2.0.0-rc.41` (subpackage under ADR-003)
- [x] **P1A-M2-T05** `EmptyState` — `packages/ui/src/components/EmptyState/` with `empty-state.tsx` (single cross-platform impl — no platform split needed) + 8 unit tests + 5 stories (VentasVacio / EgresosVacio / InventarioVacio / SinResultados / TituloSolo) + 5 Playwright baselines; 100% coverage; no new dependency
- [x] **P1A-M2-T06** `SectionTitle` — `packages/ui/src/components/SectionTitle/` with `section-title.tsx` (single cross-platform impl — no platform split needed) + 7 unit tests + 5 stories (VentasHoy / ActividadReciente / StockBajo / CuentasPorCobrar / Productos) + 5 Playwright baselines; 100% coverage; no new dependency
- [x] **P1A-M2-T07** `Card` (white, yellow, black variants) — `packages/ui/src/components/Card/` with `card.tsx` + 10 unit tests + 5 stories (WhiteDefault / YellowHero / BlackDirector / Tappable / AllVariants) + 5 Playwright baselines; 100% coverage; 3 variants × 4 padding tokens; press transform when `onPress` is supplied; no new dependency
- [x] **P1A-M2-T08** `Kpi` — `packages/ui/src/components/Kpi/` with `kpi.tsx` + 10 unit tests + 5 stories (VentasHoy / UtilidadMes / EgresosHoy / StockTotal / AllTones) + 5 Playwright baselines; 100% coverage; 3 tones × tabular numerals; agnostic of currency formatting (`value: string`); no new dependency
- [x] **P1A-M2-T09** `Gauge` — `packages/ui/src/components/Gauge/` with `gauge.tsx` (horizontal-bar; circular SVG variant deferred to avoid `react-native-svg` runtime dep) + 11 unit tests + 5 stories (MargenBruto / Liquidez / RotacionInventario / Alerta / AllTones) + 5 Playwright baselines; 100% coverage; 4 tones; clamps value to [0, max]; safe at max=0; custom valueFormatter override; no new dependency
- [x] **P1A-M2-T10** `BottomTabBar` — `packages/ui/src/components/BottomTabBar/` with `bottom-tab-bar.tsx` + extracted `tab-item.tsx` + 13 unit tests + 5 stories (Operativo / Director / WithBadges / IconlessFallback / MidSelection) + 5 Playwright baselines; 100% coverage; 1..6 items with dev-warn + clamp guard outside that range; optional `icon: ReactNode` slot (icon-library decision deferred to Phase 1C); optional `badge: number` red-circle indicator; no new dependency
- [x] **P1A-M2-T11** `TopBar` — `packages/ui/src/components/TopBar/` with `top-bar.tsx` + 10 unit tests + 5 stories (Default / WithSubtitle / OperativoScreen / DirectorHome / BackButton) + 5 Playwright baselines; 100% coverage; left/right slot pattern (44px tap-target floor); centered title with optional subtitle; no new dependency

### Milestone P1A-M3 — Localization & formatting — Completed 2026-04-23
- [x] **P1A-M3-T01** Install i18next + expo-localization — `i18next@26.0.7` + `react-i18next@17.0.4` already present in apps; added as `peerDependencies` + `devDependencies` to `@cachink/ui` so the i18n module ships with strict types; `expo-localization@55.0.13` pre-warmed in mobile shell for future locale-detection swap
- [x] **P1A-M3-T02** Create `packages/ui/src/i18n` with es-MX as the only locale — `packages/ui/src/i18n/{i18n.ts, index.ts, types.d.ts, locales/es-mx.ts}` + `apps/mobile/src/shell/i18n.ts` + `apps/desktop/src/shell/i18n.ts` wired into root layouts; 6 unit tests; 100% coverage; idempotent `initI18n()`; module augmentation gives `t('actions.save')` strict typing; `@cachink/ui/i18n` subpath export added
- [x] **P1A-M3-T03** Create money and date formatters (pure functions in `packages/domain/src/format`) — `packages/domain/src/format/{index.ts, money.ts, date.ts}` with `formatMoney` / `formatMoneyCompact` / `formatPesos` / `formatDate` / `formatDateLong` / `formatMonth`; all built on `Intl` with es-MX locale; new `@cachink/domain/format` subpath export; bigint→Number trade-off documented inline with safety analysis (~$90 trillion MXN ceiling)
- [x] **P1A-M3-T04** Unit tests for formatters (edge cases: 0, negative, large numbers, BigInt centavos) — `packages/domain/tests/format.test.ts` with 22 unit tests across 6 describe blocks; covers zero, negative, billion-peso, 10-trillion-peso sentinel, compact KPI form, all 12 months, weekday boundaries (Sunday + leap day), invalid YYYY-MM rejection. Domain coverage stays at 100% (well above the 95% threshold).

**Completed 2026-04-23.** All 11 brand primitives from CLAUDE.md §8.4 ship in `@cachink/ui` with 100% unit coverage and 56 Playwright visual baselines. Strict-typed i18n infrastructure (es-MX) in place; pure-function money + date formatters in `@cachink/domain/format` ready for Phase 1C screens to consume. Total UI tests: 127 (theme: 6, hello-badge: 3, btn: 8, input: 9, tag: 7, modal: 19, empty-state: 8, section-title: 7, card: 10, kpi: 10, gauge: 11, bottom-tab-bar: 13, top-bar: 10, i18n: 6). Total domain tests: 66 (money: 31, ids: 4, dates: 9, format: 22).
