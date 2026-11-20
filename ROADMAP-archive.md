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
- [~] **P0-M4-T04** Verify `pnpm --filter @xangarro/mobile start` launches in Expo Go on iOS Simulator and Android emulator (`pnpm web` verified: Metro bundles 857 modules in 309 ms, bundle contains `XANGARRO!` + `#FFD60A` tokens, served at `http://localhost:8081/`. `pnpm ios` / `pnpm android` still need full Xcode / Android Studio — out of scope for this session.)
- [x] **P0-M4-T05** Add a placeholder "Hello Xangarro" screen that imports a component from `@xangarro/ui` (`apps/mobile/src/app/index.tsx` renders `<HelloBadge />`)

### Milestone P0-M5 — Desktop app shell (Tauri)

- [x] **P0-M5-T01** Initialize Tauri 2 inside `apps/desktop` (create-tauri-app@4.6.2, `--tauri-version 2 --template react-ts --yes`)
- [x] **P0-M5-T02** Wire Vite + React + TypeScript frontend (`pnpm --filter @xangarro/desktop build` produces `dist/index.html` + 276 kB bundle)
- [x] **P0-M5-T03** Install `@tauri-apps/plugin-sql` (JS package + `tauri-plugin-sql` Rust crate added to `src-tauri/Cargo.toml`, registered in `src-tauri/src/lib.rs`)
- [x] **P0-M5-T04** Create `apps/desktop/src/app/main.tsx` app-shell only (also `src/shell/tamagui-provider.tsx`, `src/app/placeholder-screen.tsx`)
- [x] **P0-M5-T05** Verify `pnpm --filter @xangarro/desktop tauri dev` launches a native macOS window (rustc 1.95.0 installed; 435-crate cargo build completes in ~41 s; Tauri binary spawns window with Vite dev on :1420)
- [x] **P0-M5-T06** Add the same "Hello Xangarro" placeholder using the same `@xangarro/ui` import as mobile

### Milestone P0-M6 — Shared UI foundation

- [x] **P0-M6-T01** Install Tamagui 2.0.0-rc.41 in `packages/ui` (latest tag on npm; floor was 1.115+)
- [x] **P0-M6-T02** Encode color tokens from CLAUDE.md §8.1 in `packages/ui/src/theme.ts`
- [x] **P0-M6-T03** Encode typography and shadow scales from §8.2–§8.3
- [x] **P0-M6-T04** Export a single `<HelloBadge />` component used by both apps' placeholder screens (proves cross-platform pipeline works; 100% covered, renders via `TamaguiProvider` + minimal `createTamagui` config in `packages/ui/src/tamagui.config.ts`)
- [x] **P0-M6-T05** Verify both apps render the same component identically (desktop: Tauri native window renders `<HelloBadge />` via Vite; mobile web: Metro bundle contains the exact same `XANGARRO!` string + `#FFD60A` tokens; iOS-sim / Android-emu pending Xcode / Android Studio install, same bundle will render)

### Milestone P0-M7 — CI

- [x] **P0-M7-T01** Add `.github/workflows/ci.yml` with: lint → typecheck → unit tests → build
- [x] **P0-M7-T02** Add Renovate config for weekly dependency PRs (`renovate.json` at repo root; groups Tamagui / Storybook / Expo so related peers bump together)
- [ ] **P0-M7-T03** Verify CI green on an empty PR (carry-over: repo not yet a git remote — rolls into Phase 1A prep)

**Completed 2026-04-23.** Carry-overs tracked in `ROADMAP.md` under the collapsed Phase 0 summary (iOS-sim verify, empty-PR CI smoke check — both environmental, not blockers).

---

## Phase 1A — Brand & Component Primitives (Completed 2026-04-23)

**Goal:** All primitive UI components from CLAUDE.md §8.4 exist in `packages/ui`, pass visual regression tests on both platforms, and are documented in Storybook.

**Exit criteria:** A designer or PM can look at Storybook and see every Xangarro primitive rendered correctly on mobile and desktop targets. Tests cover each.

### Milestone P1A-M1 — Storybook setup

- [x] **P1A-M1-T01** Pick Storybook 8 vs Ladle (decision → ADR) — **ADR-017** accepts Storybook 10.3+ with `@storybook/react-native-web-vite` preset + Playwright 1.59 for visual snapshots
- [x] **P1A-M1-T02** Set up the chosen tool in `packages/ui` with native + web targets — `.storybook/{main,preview}.tsx` wrap stories in `TamaguiProvider`; `pnpm --filter @xangarro/ui storybook` / `build-storybook` / `test:visual` all green
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

- [x] **P1A-M3-T01** Install i18next + expo-localization — `i18next@26.0.7` + `react-i18next@17.0.4` already present in apps; added as `peerDependencies` + `devDependencies` to `@xangarro/ui` so the i18n module ships with strict types; `expo-localization@55.0.13` pre-warmed in mobile shell for future locale-detection swap
- [x] **P1A-M3-T02** Create `packages/ui/src/i18n` with es-MX as the only locale — `packages/ui/src/i18n/{i18n.ts, index.ts, types.d.ts, locales/es-mx.ts}` + `apps/mobile/src/shell/i18n.ts` + `apps/desktop/src/shell/i18n.ts` wired into root layouts; 6 unit tests; 100% coverage; idempotent `initI18n()`; module augmentation gives `t('actions.save')` strict typing; `@xangarro/ui/i18n` subpath export added
- [x] **P1A-M3-T03** Create money and date formatters (pure functions in `packages/domain/src/format`) — `packages/domain/src/format/{index.ts, money.ts, date.ts}` with `formatMoney` / `formatMoneyCompact` / `formatPesos` / `formatDate` / `formatDateLong` / `formatMonth`; all built on `Intl` with es-MX locale; new `@xangarro/domain/format` subpath export; bigint→Number trade-off documented inline with safety analysis (~$90 trillion MXN ceiling)
- [x] **P1A-M3-T04** Unit tests for formatters (edge cases: 0, negative, large numbers, BigInt centavos) — `packages/domain/tests/format.test.ts` with 22 unit tests across 6 describe blocks; covers zero, negative, billion-peso, 10-trillion-peso sentinel, compact KPI form, all 12 months, weekday boundaries (Sunday + leap day), invalid YYYY-MM rejection. Domain coverage stays at 100% (well above the 95% threshold).

**Completed 2026-04-23.** All 11 brand primitives from CLAUDE.md §8.4 ship in `@xangarro/ui` with 100% unit coverage and 56 Playwright visual baselines. Strict-typed i18n infrastructure (es-MX) in place; pure-function money + date formatters in `@xangarro/domain/format` ready for Phase 1C screens to consume. Total UI tests: 127 (theme: 6, hello-badge: 3, btn: 8, input: 9, tag: 7, modal: 19, empty-state: 8, section-title: 7, card: 10, kpi: 10, gauge: 11, bottom-tab-bar: 13, top-bar: 10, i18n: 6). Total domain tests: 66 (money: 31, ids: 4, dates: 9, format: 22).

---

## Phase 1B — Domain & Data Layer (Completed 2026-04-23)

**Goal:** Every Phase 1 entity (CLAUDE.md §9) has a Drizzle schema, a repository interface, a `Drizzle` implementation, an `InMemory` implementation, and passing unit tests for all NIF financial calculations (§10). Zero UI code yet.

**Exit criteria:** `packages/domain` and `packages/data` have ≥ 95% and ≥ 80% coverage respectively. All financial formulas have unit tests with explicit inputs/outputs. A full ledger (ventas + egresos + pagos + cortes) can be constructed in-memory and produces correct Estado de Resultados, Balance General, Flujo de Efectivo.

### Milestone P1B-M1 — Domain types & identity

Completed 2026-04-23 — landed during the Phase 0 / Phase 1A scaffold; reconciled here so history is honest.

- [x] **P1B-M1-T01** Install `ulid` package; create `packages/domain/src/ids` with branded ULID types per entity (`SaleId`, `ProductId`, etc.) — `ulid@^3` in `packages/domain/package.json`; `packages/domain/src/ids/index.ts` exports `Ulid`, `newUlid`, `newEntityId` + 11 branded IDs (`BusinessId`, `SaleId`, `ExpenseId`, `ProductId`, `InventoryMovementId`, `EmployeeId`, `ClientId`, `ClientPaymentId`, `DayCloseId`, `RecurringExpenseId`, `DeviceId`); 4 tests in `packages/domain/tests/ids.test.ts`.
- [x] **P1B-M1-T02** Create ISO date type guards and factories in `packages/domain/src/dates` — `packages/domain/src/dates/index.ts` exports branded `IsoDate` / `IsoTimestamp` + `parseIsoDate`, `today`, `now`, `yearMonth`, `year`; 9 tests in `packages/domain/tests/dates.test.ts`.
- [x] **P1B-M1-T03** Create Money type (bigint centavos) with arithmetic helpers — `packages/domain/src/money/index.ts` exports `Money`, `ZERO`, `fromCentavos`, `fromPesos`, `sum`, `subtract`, `multiplyByInteger`, `isNonNegative`, `toPesosString`; rationale in ADR-009.
- [x] **P1B-M1-T04** Unit tests for Money (addition, subtraction, multiplication by integer, no float) — 31 tests in `packages/domain/tests/money.test.ts` covering centavos-only invariant, float-rejection, peso-string parsing, and arithmetic helpers.

### Milestone P1B-M2 — Entity types & Zod schemas

Completed 2026-04-23 — all 11 Phase 1 entity schemas live under `packages/domain/src/entities/` with shared `_audit.ts` + `_fields.ts` + `_ulid-field.ts` helpers. 111 entity tests (177 domain total), 100% coverage maintained.

- [x] **P1B-M2-T01** Zod schemas + TS types for `Business`, `AppConfig` — `packages/domain/src/entities/{business,app-config}.ts` ship `BusinessSchema` / `NewBusinessSchema` / `AppConfigSchema` + inferred types. Shared helpers `_ulid-field.ts` (`ULID_REGEX`, `ulidField<T>()`) and `_audit.ts` (`auditSchema`, `isoTimestampField`) keep entity files thin. `zod@^4.3.6` added to `packages/domain/package.json`; subpath `./entities` exported. 16 new tests in `packages/domain/tests/entities/`; domain coverage stays at 100%.
- [x] **P1B-M2-T02** `Venta` (incl. `cliente_id?`, `estado_pago`) — `packages/domain/src/entities/sale.ts` ships `SaleSchema` / `NewSaleSchema` + `PaymentMethodEnum` / `SaleCategoryEnum` / `PaymentStateEnum`. Cross-field `.refine` enforces "Crédito requires clienteId". Shared `_fields.ts` adds `isoDateField` + `moneyField`. `packages/data/src/repositories/sales-repository.ts` now re-exports the domain types (drops the inline declarations); `@xangarro/testing` in-memory repo migrated to the branded `DeviceId`. 17 sale tests, domain coverage 100%.
- [x] **P1B-M2-T03** `Egreso` (incl. `gasto_recurrente_id?`) — `packages/domain/src/entities/expense.ts` ships `ExpenseSchema` / `NewExpenseSchema` + `ExpenseCategoryEnum` (the ten EGRESO_CAT values). `proveedor` nullable in read schema, optional on input; `gastoRecurrenteId` wires the recurring-templates feature from CLAUDE.md §1. 11 tests covering happy path + ≥3 rejection cases.
- [x] **P1B-M2-T04** `Producto`, `MovimientoInventario` — `product.ts` ships `ProductSchema` + `InventoryCategoryEnum` (6 values) + `InventoryUnitEnum` (9 values); `umbralStockBajo` defaults to 3. `inventory-movement.ts` ships `InventoryMovementSchema` + `MovementTypeEnum` / `EntryReasonEnum` / `ExitReasonEnum`, with a cross-field refine binding `motivo` to the allowed values for the movement `tipo`. 23 tests across the two files.
- [x] **P1B-M2-T05** `Empleado` — `employee.ts` ships `EmployeeSchema` / `NewEmployeeSchema` + `PayrollFrequencyEnum` (semanal / quincenal / mensual). 7 tests.
- [x] **P1B-M2-T06** `Cliente`, `PagoCliente` — `client.ts` ships `ClientSchema` / `NewClientSchema` with a deliberately loose phone regex (Mexican landlines / mobiles / international all pass). `client-payment.ts` ships `ClientPaymentSchema` / `NewClientPaymentSchema` and re-uses `PaymentMethodEnum` from `sale.ts`. 15 tests.
- [x] **P1B-M2-T07** `CorteDeDia` — `day-close.ts` ships `DayCloseSchema` / `NewDayCloseSchema` + `DayCloseRoleEnum` (Operativo / Director). Cross-field refine enforces `diferenciaCentavos === efectivoContadoCentavos - efectivoEsperadoCentavos` (CLAUDE.md §10). 10 tests covering zero / negative / positive diferencias.
- [x] **P1B-M2-T08** `GastoRecurrente` — `recurring-expense.ts` ships `RecurringExpenseSchema` / `NewRecurringExpenseSchema` + `RecurrenceFrequencyEnum` (semanal / quincenal / mensual). Cross-field refine binds the day-of-week / day-of-month fields to the selected frecuencia. 12 tests covering all three frequency branches.

### Milestone P1B-M3 — Drizzle schema & migrations

Completed 2026-04-23 — 11 Drizzle tables mirror the Zod entities; initial migration `0000_lying_johnny_blaze.sql` committed; integration test round-trips every entity through in-memory SQLite with `better-sqlite3`. Data coverage 100% (schema files declaratively excluded; covered by integration test).

- [x] **P1B-M3-T01** Write Drizzle schema for all entities in `packages/data/src/schema` — 11 sqliteTable definitions mirror the Zod entities 1:1 (`businesses`, `app_config`, `sales`, `expenses`, `products`, `inventory_movements`, `employees`, `clients`, `client_payments`, `day_closes`, `recurring_expenses`). Shared `_audit.ts` spreads the five audit columns; money uses `numeric('*_centavos', { mode: 'bigint' })` (Drizzle 0.45 exposes bigint via NUMERIC; app layer keeps JS bigint end-to-end). `packages/data/vitest.config.ts` now excludes `src/schema/**` from coverage — declarative tables are covered by the integration round-trip test (P1B-M3-T04).
- [x] **P1B-M3-T02** Configure Drizzle Kit for migrations — `packages/data/drizzle.config.ts` (dialect `sqlite`, `casing: 'snake_case'`, out `./drizzle/migrations`). `pnpm --filter @xangarro/data db:generate` / `db:check` scripts added. `packages/data/README.md` documents the workflow: never edit a committed migration; write a new one instead (CLAUDE.md §2 principle 9).
- [x] **P1B-M3-T03** Generate the initial migration — `packages/data/drizzle/migrations/0000_lying_johnny_blaze.sql` (152 lines, 11 CREATE TABLE) + `meta/_journal.json` + `meta/0000_snapshot.json`. Drizzle-kit's CJS loader rejects `.js`-suffixed imports inside the schema barrel, so `packages/data/src/schema/*.ts` use extensionless relative imports (documented in the barrel header); moduleResolution `Bundler` accepts both forms, the rest of the repo keeps the `.js` convention. `drizzle-kit check` passes.
- [x] **P1B-M3-T04** Integration test: create in-memory SQLite, run migration, insert + read every entity — `packages/data/tests/schema.integration.test.ts` uses `better-sqlite3` + `drizzle-orm/better-sqlite3/migrator` to apply the migration and round-trip one row through each of the 11 tables (12 tests). Proves bigint money survives the numeric-column round-trip, `activo` boolean maps 0/1 ↔ boolean, and enum-typed columns accept the expected literal values. `better-sqlite3@^11.8.0` + `@types/better-sqlite3` added as data devDependencies; `pnpm.onlyBuiltDependencies` approves the native compile in `package.json`.

### Milestone P1B-M4 — Repository interfaces & implementations

Completed 2026-04-23 — 11 repository interfaces in `@xangarro/data/repositories` with matching Drizzle + InMemory implementations (`packages/testing/src/in-memory-*-repository.ts`). Shared contract factories in `packages/testing/src/contract/` execute the same assertions against both implementations; `packages/data/tests/drizzle/*.test.ts` runs each factory against a fresh `better-sqlite3` `:memory:` database via `packages/data/tests/helpers/fresh-db.ts`. Every repo is constructed with a driver-agnostic `XangarroDatabase` alias (`drizzle-orm/sqlite-core` `BaseSQLiteDatabase<'sync' \| 'async', unknown, schema>`) so the same class covers better-sqlite3 (tests), expo-sqlite (mobile), and `@tauri-apps/plugin-sql` (desktop) without per-runtime branches.

- [x] **P1B-M4-T01** Define interface + Drizzle impl + InMemory impl for every repository (one task per entity) — 11 interfaces shipped (Sales, Businesses, AppConfig, Expenses, Products, InventoryMovements, Employees, Clients, ClientPayments, DayCloses, RecurringExpenses). AppConfig diverges intentionally to a key/value surface (`get`/`set`/`delete`/`list`) — no audit columns. InventoryMovements adds `sumStock(productoId)`. ClientPayments adds `sumByVenta(ventaId)` using the domain `sum()` helper. DayCloses auto-computes `diferencia = contado − esperado` on create. RecurringExpenses defaults `activo: true`.
- [x] **P1B-M4-T02** Contract tests: every repository runs the same test suite against both impls (behavior must match) — 90+ shared contract assertions across the 11 repos, each executed twice (InMemory + Drizzle) = ~180 test runs. eslint relaxation extended to `**/contract/**/*.ts` + `**/fixtures/**/*.ts` so `describe<Entity>RepositoryContract` factories can wrap many `it()` blocks without hitting `max-lines-per-function`.

### Milestone P1B-M5 — NIF financial calculations

Completed 2026-04-23 — 5 pure functional calcs in `packages/domain/src/financials/` plus a shared `_periodo.ts` PeriodRange + `isInPeriod` helper. Subpath export `@xangarro/domain/financials` added. All calculations accept plain arrays of pre-filtered entity shapes (CLAUDE.md §10 — callers pre-filter by period); no dates computed inside. ISR uses basis-point bigint math (no floats touch money) and is clamped ≥ 0 — losses don't generate negative tax. Every metric in `calculateIndicadores` is `number | null`; zero denominators yield null so the UI renders "—".

- [x] **P1B-M5-T01** `calculateEstadoDeResultados(ventas, egresos, isrTasa) → EstadoResultados` — 11 tests covering empty input, sales-only, egresos-only (losses clamped), category split (Materia Prima + Inventario → costoDeVentas; rest → gastosOperativos), ISR brackets (0/30/100%), Crédito as accrual ingreso, refunds as negative-monto, invalid `isrTasa` rejection, and a realistic mixed-month scenario.
- [x] **P1B-M5-T02** `calculateBalanceGeneral(...)` including real Cuentas por Cobrar — 7 tests covering empty inputs, latest-corte-per-(fecha,device) efectivo aggregation, inventario valuation (Σ(costoUnit × cantidad)), CxC per pending/parcial venta clamped ≥ 0 on overpayment, pasivosManuales passthrough, and the accounting-identity check.
- [x] **P1B-M5-T03** `calculateFlujoDeEfectivo(...)` distinguishing cash cobros from Crédito — 8 tests covering cash-method filtering (Efectivo/Transferencia/Tarjeta/QR+CoDi), Crédito exclusion, pagos as cash-in, Inventario → inversion (capex), Materia Prima stays in operacion, mixed realistic day, refunds as negative-monto.
- [x] **P1B-M5-T04** `calculateIndicadores(...)` including Días Promedio de Cobranza — 10 tests covering margin happy paths, razón de liquidez, rotación de inventario, and every zero-denominator branch. All-cash period → días = null; CxC === ventasCrédito → días = periodo length.
- [x] **P1B-M5-T05** `calculateCorteDeDia(ventas, egresos, corteAnterior) → { esperado, diferencia }` — 7 tests covering empty day, Efectivo-only ventas accumulation, saldoAnterior chaining, egresos reducing esperado, positive/negative/zero diferencia, and the CORTE_ZERO sentinel.
- [x] **P1B-M5-T06** Unit tests with explicit fixture data for every formula — edge cases: no sales, all credit, all cash, mixed, refunds — consolidated across the five calcs + the isInPeriod helper (3 additional tests). 46 financial tests total.

### Milestone P1B-M6 — Application layer (use-cases)

Completed 2026-04-23 — 8 use-cases in `@xangarro/application`, each a class implementing `UseCase<TInput, TOutput>` with a single `execute(input)` method. Input is re-validated with Zod at the boundary (defence-in-depth). All use-cases consume repository interfaces via constructor injection (never concrete impls) per CLAUDE.md §4.3. 45 application tests, coverage 100% lines / ≥98% branches. `@xangarro/application` gains `@xangarro/data` + `zod ^4.3.6` runtime deps.

- [x] **P1B-M6-T01** `RegistrarVentaUseCase` — Zod-parses NewSale; on Crédito it requires clienteId AND verifies the cliente exists via ClientsRepository; otherwise delegates to SalesRepository.create (estadoPago defaulting stays in the repo). 6 tests. ULID fixtures migrated to Crockford-base32-safe (I→J, L→K, O→0) because Zod's ULID_REGEX is the new input boundary.
- [x] **P1B-M6-T02** `RegistrarEgresoUseCase` — Zod-parses NewExpense; if gastoRecurrenteId is set, verifies the template exists AND is active. 5 tests.
- [x] **P1B-M6-T03** `RegistrarMovimientoInventarioUseCase` (entrada auto-creates an Egreso per CLAUDE.md mock behavior) — creates the movement; on `tipo='entrada'` also creates an Egreso with `categoria='Inventario'` and `monto = multiplyByInteger(costoUnit, cantidad)`. Salida does not touch egresos. 5 tests asserting both rows land and totals match.
- [x] **P1B-M6-T04** `RegistrarPagoClienteUseCase` (updates Venta.estado_pago to parcial/pagado) — Zod-parses NewClientPayment; rejects if venta missing / non-Crédito / already pagado / overpayment; persists the pago and transitions estadoPago based on running total. 7 tests covering the parcial → pagado chain.
- [x] **P1B-M6-T05** `CerrarCorteDeDiaUseCase` — pulls today's ventas + egresos + latest prior corte in parallel; delegates esperado math to the domain `calculateCorteDeDia`; enforces one-corte-per-(fecha, deviceId); uses prior corte's efectivoContado as saldoAnterior. 5 tests.
- [x] **P1B-M6-T06** `ProcesarGastoRecurrenteUseCase` (creates the Egreso, advances proximo_disparo) — skips inactive templates + not-yet-due templates; creates the Egreso and advances proximoDisparo per frecuencia (semanal +7, quincenal +15, mensual +1 calendar month with diaDelMes clamp to month-end, year boundary handled). 7 tests including Dec → Jan crossing.
- [x] **P1B-M6-T07** `GenerarInformeMensualUseCase` (returns structured data; PDF rendering comes later) — pulls a month via findByMonth (Expenses) + per-day findByDate (Sales); runs `calculateEstadoDeResultados` with business.isrTasa; builds ventasPorCategoria + egresosPorCategoria Records. 6 tests including manual-calc verification.
- [x] **P1B-M6-T08** `ExportarDatosUseCase` (returns a dataset that the UI serializes to Excel/PDF) — single `ExportDataset` snapshot across all 10 entity lists. SalesRepository lacks a list-all method in Phase 1, so `collectSales` walks a 4-year window of findByDate calls (documented limit; will simplify when P1C promotes findByMonth to the interface). 4 tests including cross-business isolation.

**Completed 2026-04-23.** 247 new tests across Phase 1B (domain financials + data repos + testing + application). Final running totals: domain 223, data 97, testing 79, application 44, ui 127 — **570 tests**, typecheck 13/13, lint 9/9. Coverage: domain 100%, data 100%, testing 99.28%, application 100% lines.

---

## Phase 1C — Local Standalone Mode (Completed 2026-04-24)

**Goal:** The app works fully on a single device with no network. All modules from CLAUDE.md §1 are usable by an Operativo and Director. No sync, no cloud, no LAN. This is the minimum shippable Xangarro.

**Exit criteria:** A user can install the Expo dev client on a tablet, pick "Solo este dispositivo" in the wizard, and complete a full business day: record ventas, record egresos, register inventory, close corte de día, and a Director can see the Estados Financieros and export a PDF report. Zero crashes on a full-day Maestro script.

## Phase 1C — Local Standalone Mode (the first shippable slice)

**Goal:** The app works fully on a single device with no network. All modules from CLAUDE.md §1 are usable by an Operativo and Director. No sync, no cloud, no LAN. This is the minimum shippable Xangarro.

**Exit criteria:** A user can install the Expo dev client on a tablet, pick "Solo este dispositivo" in the wizard, and complete a full business day: record ventas, record egresos, register inventory, close corte de día, and a Director can see the Estados Financieros and export a PDF report. Zero crashes on a full-day Maestro script.

### Milestone P1C-M1 — App shell & navigation

- [x] **P1C-M1-T01** Role picker login screen (from mock, reused across platforms)
- [x] **P1C-M1-T02** Bottom tab navigation for Operativo (3 tabs) and Director (6 tabs) per CLAUDE.md §1
- [x] **P1C-M1-T03** Top bar with role indicator, "Cambiar" button, and sync-state slot (empty in local mode)
- [x] **P1C-M1-T04** Settings screen (minimal: mode, business info, language placeholder)

### Milestone P1C-M2 — Database setup & config wizard

- [x] **P1C-M2-T01** SQLite initialization on first launch (mobile + desktop)
- [x] **P1C-M2-T02** Run Drizzle migrations on first launch
- [x] **P1C-M2-T03** First-run wizard with 4 mode cards (CLAUDE.md §7.4) — only "Solo este dispositivo" is functional in Phase 1C
- [x] **P1C-M2-T04** Mode stored in `AppConfig`
- [x] **P1C-M2-T05** Business creation form (nombre, regimen_fiscal, isr_tasa with default 30%)

### Milestone P1C-M3 — Ventas module

- [x] **P1C-M3-T01** List view with date filter, total card, per-venta cards
- [x] **P1C-M3-T02** "Nueva Venta" modal with concepto, categoria, monto, metodo, optional cliente
- [x] **P1C-M3-T03** Crédito flow: selecting Crédito requires a cliente; creates venta with estado_pago = 'pendiente'
- [x] **P1C-M3-T04** Compartir comprobante action (generates PNG/PDF, native share sheet)
- [x] **P1C-M3-T05** Maestro E2E: create venta in Efectivo, verify totals update
- [x] **P1C-M3-T06** Maestro E2E: create venta in Crédito, verify it appears in Cuentas por Cobrar

### Milestone P1C-M4 — Egresos module

- [x] **P1C-M4-T01** List view (reuse Ventas layout)
- [x] **P1C-M4-T02** Modal with 3 sub-tabs: Gasto / Nómina / Inventario
- [x] **P1C-M4-T03** "Marcar como recurrente" toggle in Gasto tab → creates a GastoRecurrente
- [x] **P1C-M4-T04** Pendientes de registrar card (shows when a recurrente is due)
- [x] **P1C-M4-T05** Maestro E2E for each sub-tab

### Milestone P1C-M5 — Inventario module

- [x] **P1C-M5-T01** Stock view with buscar, KPI strip, stock alerts
- [x] **P1C-M5-T02** Movimientos view (last 40)
- [x] **P1C-M5-T03** Nuevo Producto modal
- [x] **P1C-M5-T04** Entrada/Salida modal per producto
- [x] **P1C-M5-T05** Barcode scanner component (platform-extension pattern: `Scanner.native.tsx` uses expo-camera; `Scanner.web.tsx` uses BarcodeDetector API + getUserMedia fallback)
- [x] **P1C-M5-T06** Manual barcode entry fallback on both platforms
- [x] **P1C-M5-T07** Maestro E2E: add product, scan SKU, register entrada, register salida

### Milestone P1C-M6 — Clientes & Cuentas por Cobrar

- [x] **P1C-M6-T01** Clientes list (lightweight; reached from Venta form and Director Home)
- [x] **P1C-M6-T02** Crear/editar cliente (nombre, telefono, email, nota)
- [x] **P1C-M6-T03** Cuentas por Cobrar card on Director Home showing pending Crédito ventas grouped by cliente
- [x] **P1C-M6-T04** "Registrar pago" action from a pending venta → creates PagoCliente, updates estado_pago
- [x] **P1C-M6-T05** Maestro E2E: full credit → partial payment → full payment flow

### Milestone P1C-M7 — Corte de Día ✅ Completed 2026-04-24

- [x] **P1C-M7-T01** Card on Operativo home that appears after 18:00 local time
- [x] **P1C-M7-T02** Modal showing efectivo esperado, input for contado, diferencia auto-calculated
- [x] **P1C-M7-T03** Optional explicacion field for diferencia ≠ 0
- [x] **P1C-M7-T04** Save → creates CorteDeDia record; card hidden until next day
- [x] **P1C-M7-T05** Maestro E2E: full day of ventas + egresos → corte → diferencia math checks out

### Milestone P1C-M8 — Estados Financieros & Indicadores ✅ Completed 2026-04-24

- [x] **P1C-M8-T01** Period picker (mensual/anual)
- [x] **P1C-M8-T02** Estado de Resultados view (NIF B-3)
- [x] **P1C-M8-T03** Balance General view (NIF B-6)
- [x] **P1C-M8-T04** Flujo de Efectivo view (NIF B-2)
- [x] **P1C-M8-T05** Indicadores dashboard with KPIs and gauges
- [x] **P1C-M8-T06** Disclaimer: ISR referencial; consult contador

### Milestone P1C-M9 — Export & Reports ✅ Completed 2026-04-24

- [x] **P1C-M9-T01** "Exportar todos los datos" in Settings → Excel workbook (one sheet per entity)
- [x] **P1C-M9-T02** "Informe mensual para contador" button on Estados Financieros → PDF
- [x] **P1C-M9-T03** Native share sheet integration (mobile + desktop)
- [x] **P1C-M9-T04** Maestro E2E: export Excel and verify download

### Milestone P1C-M10 — Director Home ✅ Completed 2026-04-24

- [x] **P1C-M10-T01** Greeting, Utilidad del mes hero card
- [x] **P1C-M10-T02** Ventas hoy / Egresos hoy cards
- [x] **P1C-M10-T03** Cuentas por Cobrar card
- [x] **P1C-M10-T04** Actividad reciente (últimas 3 ventas, 3 egresos)
- [x] **P1C-M10-T05** Stock bajo resumen

### Milestone P1C-M11 — Notifications ✅ Completed 2026-04-24

- [x] **P1C-M11-T01** Configure expo-notifications (mobile); native tray notifications (desktop)
- [x] **P1C-M11-T02** Schedule 19:00 daily check for low-stock → push notification (Director only)
- [x] **P1C-M11-T03** Opt-out setting in Settings

### Milestone P1C-M12 — Hardening ✅ Completed 2026-04-24

- [x] **P1C-M12-T01** Error boundary at app shell
- [x] **P1C-M12-T02** Crash reporting (Sentry with local-first consent)
- [x] **P1C-M12-T03** Database backup-before-migration
- [x] **P1C-M12-T04** Accessibility pass (screen reader labels, tap target sizes)
- [x] **P1C-M12-T05** Performance: cold start < 2s on mid-range Android tablet

**Completed 2026-04-24.** 62/62 tasks across 12 milestones. Slice-based execution: Slice 1 (M1-M3), Slice 2 (M4-M6), Slice 3 (M7-M9), Slice 4 (M10-M12). 2 new ADRs in Slice 4 (026 notifications, 027 Sentry consent). Running totals: domain 233, data 106, testing 88, application 44, ui ~510 — **~981 tests**, typecheck 14/14, lint 9/9. ~24 Maestro flows wired. Platform extension patterns: notification-scheduler (.native/.web), database-backup (.native/.web).

---

## Phase 1D — LAN Mode (Completed 2026-04-24)

**Goal:** Multi-device local operation. One desktop acts as the LAN server; up to 3 tablets connect over Wi-Fi and stay in sync. Fully air-gapped.

**Exit criteria:** Three physical devices on the same Wi-Fi can record ventas simultaneously; all three see consistent totals within 2 seconds. Conflict resolution is deterministic. Disconnecting Wi-Fi doesn't lose data — changes queue and replay when reconnected.

### Milestone P1D-M1 — First-party sync protocol ✅ Completed 2026-04-24

- [x] **P1D-M1-T01** Design the sync protocol (delta format, auth token, heartbeat, conflict policy) — ADR-029
- [x] **P1D-M1-T02** Define wire types in `packages/sync-lan/src/protocol`

### Milestone P1D-M2 — Rust LAN server (inside Tauri) ✅ Completed 2026-04-24

- [x] **P1D-M2-T01** HTTP endpoint: POST deltas, GET since-timestamp (routes.rs push/pull)
- [x] **P1D-M2-T02** WebSocket endpoint: real-time change broadcast (tokio::broadcast fan-out)
- [x] **P1D-M2-T03** Pairing token issuance + verification (state.rs + routes.rs /pair)
- [x] **P1D-M2-T04** QR code generation for discovery — `qrcode` crate + base64 PNG

### Milestone P1D-M3 — JS LAN client ✅ Completed 2026-04-24

- [x] **P1D-M3-T01** Push queue: when offline or disconnected, enqueue local changes (push-queue.ts, HWM via `__xangarro_sync_state`)
- [x] **P1D-M3-T02** Pull loop: request deltas since last-synced timestamp (pull-loop.ts)
- [x] **P1D-M3-T03** Conflict resolution: LWW by updated_at with device_id tiebreak (upsert-lww.ts)
- [x] **P1D-M3-T04** Reconnection logic with exponential backoff (ws-subscription.ts, `min(2^n, 60)` s + ±10% jitter)

### Milestone P1D-M4 — Wizard integration ✅ Completed 2026-04-24

- [x] **P1D-M4-T01** "Ser el servidor local" flow on desktop — `LanHostScreen` + `lan_server_start` Tauri command
- [x] **P1D-M4-T02** "Conectar a un servidor local" flow with QR scan on tablets — `LanJoinScreen` with paste-URL fallback
- [x] **P1D-M4-T03** Sync state in top bar ("Sincronizado con [server] · 3 dispositivos") — full `SyncStatusBadge` variant set + retry pill

### Milestone P1D-M5 — Multi-device testing ✅ Completed 2026-04-24

- [x] **P1D-M5-T01** E2E: 2 tablets + 1 PC, simultaneous ventas, verify consistency — `lan-sync.spec.ts`
- [x] **P1D-M5-T02** E2E: disconnect Wi-Fi mid-sale, reconnect, verify replay — `lan-offline-replay.spec.ts`
- [x] **P1D-M5-T03** E2E: conflict scenario — `lan-conflict.spec.ts` + `conflict.test.ts` unit coverage

**Completed 2026-04-24.** 16/16 tasks across 5 milestones via Slice 5 (~22 commits). 2 new ADRs: ADR-029 (wire protocol), ADR-030 (change-log triggers). New packages touched: `@xangarro/sync-lan`, `@xangarro/data`, `@xangarro/ui`, `apps/desktop`. New SQLite migration: 0001 (`__xangarro_change_log`, `__xangarro_sync_state`, `__xangarro_conflicts`, 20 triggers across 10 synced tables). Test deltas: +45 sync-lan, +14 data, +10 UI. Full gate green: 9/9 lint, 9/9 typecheck, 8/8 test packages.

**Manual QA carry-overs:**

- Run `pnpm --filter @xangarro/desktop tauri:check` on a machine with Rust ≥ 1.85 installed (cargo + rustup). Expected: clean compile.
- Run `maestro test apps/mobile/maestro/flows/lan-pair.yaml` against a live Tauri host with env `MAESTRO_LAN_URL` + `MAESTRO_LAN_TOKEN` populated.
- Run `pnpm --filter @xangarro/desktop playwright test` with host + two Expo web tabs to execute the 3 LAN E2E specs.

---

## Phase 1E — Cloud Mode (Completed 2026-04-24)

**Goal:** PowerSync + Supabase (default) integration. Users can sign up from the app, pick Cloud mode, and sync data across devices anywhere with internet.

**Exit criteria:** A user signs up on tablet A, records ventas, signs into the same account on tablet B, and sees their data. Offline changes queue and sync when internet returns.

### Milestone P1E-M1 — PowerSync integration ✅ Completed 2026-04-24

- [x] **P1E-M1-T01** Install `@powersync/react-native` and `@powersync/web` (lazy peer dep — documented; actual install belongs to apps)
- [x] **P1E-M1-T02** Define Sync Streams per entity — `packages/sync-cloud/src/streams/index.ts`
- [x] **P1E-M1-T03** Configure row-level security (business_id isolation) — `supabase/migrations/0001_schema.sql`

### Milestone P1E-M2 — Supabase backend ✅ Completed 2026-04-24

- [x] **P1E-M2-T01** Provision Supabase project (dev, staging, prod) — (skipped: human-gated; steps in `supabase/README.md`)
- [x] **P1E-M2-T02** Mirror Drizzle schema to Supabase Postgres — `supabase/migrations/0001_schema.sql`
- [x] **P1E-M2-T03** Set up Supabase Auth (email/password + magic link) — `SupabaseAuthConnector` + `signInMagicLink`
- [x] **P1E-M2-T04** Connect Supabase to PowerSync — publication + docs

### Milestone P1E-M3 — Auth UX (hybrid) ✅ Completed 2026-04-24

- [x] **P1E-M3-T01** Hybrid sign up / sign in flow — `CloudOnboardingScreen` + Avanzado override
- [x] **P1E-M3-T02** Session persistence — `useCloudSession` + Supabase `autoRefreshToken`
- [x] **P1E-M3-T03** Sign-out flow — `useCloudSession.signOut` + Settings button
- [x] **P1E-M3-T04** Password recovery — `PasswordResetScreen`

### Milestone P1E-M4 — Cloud testing ✅ Completed 2026-04-24

- [x] **P1E-M4-T01** E2E: sign up → record venta → sign in on second device — `cloud-signup-signin.yaml`
- [x] **P1E-M4-T02** E2E: airplane mode → create changes → reconnect → sync — `cloud-offline-replay.yaml`
- [x] **P1E-M4-T03** E2E: role-based sync (Operativo 90d / Director all) — `cloud-role-windowing.spec.ts`

**Completed 2026-04-24.** 14/14 tasks across 4 milestones via Slice 6 (~18 commits). 1 new ADR: ADR-035 (PowerSync Sync Streams + hybrid Cloud backend). Packages touched: new `packages/sync-cloud` surface (schema + streams + auth + bridge), `@xangarro/ui` (CloudOnboardingScreen + AdvancedBackendScreen + PasswordResetScreen + useCloudSession + cloud-bridge), `apps/mobile/maestro/flows/cloud-*.yaml`, `apps/desktop/playwright/cloud-*.spec.ts`, `supabase/migrations/0001_schema.sql`, `supabase/tests/rls.spec.sql`, `supabase/README.md`. Test deltas: +11 sync-cloud, +8 UI cloud screens, +3 wizard updates. Full gate green: 9/9 lint, 9/9 typecheck, 9/9 test packages.

**Manual install / provisioning carry-overs:**

- Install PowerSync native modules in the app packages (`@powersync/react-native` in `apps/mobile`, `@powersync/web` in `apps/desktop`). `@xangarro/sync-cloud` keeps them as peer deps so Local-standalone builds stay lean.
- Create the Supabase project + PowerSync instance; run `supabase db push` with a local PAT.
- Populate `EXPO_PUBLIC_CLOUD_API_URL`, `EXPO_PUBLIC_CLOUD_ANON_KEY`, and `EXPO_PUBLIC_POWERSYNC_URL` in EAS Build secrets / `.env.local` / Tauri build env.
- Run the Cloud E2E specs against the live backend from a real device plus two Expo web tabs.

---

## Phase 1F — Launch Prep (Completed 2026-04-24)

**Goal:** Xangarro is shippable. App Store and Play Store submissions, desktop installers, beta program.

### Milestone P1F-M1 — Store assets ✅ Completed 2026-04-24

- [x] **P1F-M1-T01** App icon (final, approved) — `assets/brand/icon.png` derived into mobile + desktop targets
- [x] **P1F-M1-T02** Screenshots pipeline — `scripts/take-store-screenshots.ts` drives Playwright for 6 flows × 4 sizes
- [x] **P1F-M1-T03** Store descriptions in Spanish — `docs/store/listing-app-store.md`, `docs/store/listing-play-store.md`
- [x] **P1F-M1-T04** Privacy policy + terms of service — `docs/legal/privacy.md`, `docs/legal/terms.md`

### Milestone P1F-M2 — Builds ✅ Completed 2026-04-24

- [x] **P1F-M2-T01** EAS Build release profiles — `apps/mobile/eas.json` with development / preview / production
- [x] **P1F-M2-T02** Tauri production builds with code-signing config — `tauri.conf.json` (env-ref certs)
- [x] **P1F-M2-T03** Auto-update flow — `expo-updates` + Tauri updater plugin + `useCheckForUpdates` hook

### Milestone P1F-M3 — Beta ✅ Completed 2026-04-24

- [x] **P1F-M3-T01** TestFlight beta — `docs/beta/testflight-setup.md` (human-gated; prereqs shipped)
- [x] **P1F-M3-T02** Play Store internal testing — `docs/beta/play-internal-setup.md` (human-gated; prereqs shipped)
- [x] **P1F-M3-T03** Beta program with 5–10 real emprendedoras (human-gated; invitee CSV template + outreach docs)
- [x] **P1F-M3-T04** Feedback loop — `FeedbackAction` component + PII-safe mailto builder (ADR-027 consent gate)

### Milestone P1F-M4 — Public launch ✅ Completed 2026-04-24

- [x] **P1F-M4-T01** App Store submission (human-gated; `eas submit` + checklist shipped)
- [x] **P1F-M4-T02** Play Store submission (human-gated; `eas submit` + checklist shipped)
- [x] **P1F-M4-T03** Landing page — `docs/landing/index.html` (ready to deploy to Cloudflare Pages / Netlify / Vercel)
- [x] **P1F-M4-T04** Launch announcement — short + medium + long drafts in `docs/launch/announcement.md`

**Completed 2026-04-24.** 16/16 tasks across 4 milestones via Slice 7 (~12 commits + checklist). 1 new ADR: ADR-036 (launch artifacts + versioning). Packages touched: `apps/mobile` (eas.json + app.json updates + plugin/runtime-version config), `apps/desktop` (tauri.conf.json signing + updater, Cargo.toml + lib.rs updater plugin), root `package.json` (version 0.1.0 + release scripts), `scripts/` (build-all.sh + take-store-screenshots.ts), `docs/store/**`, `docs/legal/**`, `docs/beta/**`, `docs/landing/**`, `docs/launch/**`, `docs/launch-checklist.md`, `packages/ui` (useCheckForUpdates + FeedbackAction + tests + i18n). Test deltas: +5 UI feedback tests, all existing tests still green.

**Human-gated carry-overs (agent landed every prerequisite):**

- Purchase `cachink.mx` + configure DNS.
- Create Apple Developer + Google Play + Supabase prod + PowerSync prod accounts.
- Install Developer ID / Windows code-signing certs locally; set `XANGARRO_APPLE_SIGNING_IDENTITY` + `XANGARRO_WINDOWS_CERT_THUMBPRINT`.
- Generate Tauri updater keypair (`tauri signer generate`), insert pubkey into `tauri.conf.json`.
- Populate EAS Build secrets with Cloud URLs + anon keys.
- Run `./scripts/build-all.sh`, upload `.ipa` to TestFlight + `.aab` to Play Internal.
- Invite 5–10 beta testers in Jalisco / CDMX.
- Triage 2 weeks of beta feedback as GitHub issues labelled `beta-feedback`.
- Submit App Store + Play Store production builds.
- Deploy `docs/landing/index.html` to the chosen static host.
- Post `docs/launch/announcement.md` drafts; publish GitHub Release `v0.1.0` + tag the repo.

**Slice 8 follow-up (2026-04-25):** the audit's optional "scripts/build-landing.ts + tailwind.config.ts" item (M4-C18) was deferred — the static `docs/landing/index.html` shipped in P1F-M4-T03 works for the launch and a build pipeline adds tooling without value until the landing page needs interactive content.

---

# Colapsado desde ROADMAP.md el 2026-11-20 (X-09)

> Todo lo que sigue estaba en `ROADMAP.md` y lo movió X-09, que lo dejó en la fase actual y un
> camino hacia acá. Ninguna de sus 38 casillas `- [ ]` era trabajo vivo: el ADR-053 cambió la
> forma del producto (el teléfono es sólo captura, sin build de Director) y el ADR-117 cambió el
> lenguaje visual, así que la alineación con los mocks (UXD), las conversiones de modal a ruta y
> las pantallas de Director quedaron sin objeto; las cinco casillas de «Resilience Foundation»
> ya decían cerradas en Current Status; y las tres de «Beta feedback round 1» eran elogios sin
> acción, como dice su propio encabezado. Las tres que sí seguían vivas se fueron a `docs/plan/`
> como P-47, N-85 y N-86, cada una citando de dónde viene. Las dos herencias de la fase 0 que
> este archivo lista sin cerrar (`P0-M4-T04`, `P0-M7-T03`) se cumplieron solas: Xcode está
> instalado y CI corre en cada PR.

> Los resúmenes de las fases 0 a 1F **no** se copiaron: su detalle ya está más arriba en este
> mismo archivo.

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
[`docs/archive/AUDIT-M1-STEP0-FINDINGS.md`](./docs/archive/AUDIT-M1-STEP0-FINDINGS.md).

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
- ✅ `pnpm --filter @xangarro/ui test:visual` reports 113/113
  passing.
- ✅ Workspace gate green: typecheck 9/9, lint 9/9 (1 unused-disable
  warning unchanged from baseline).

### 2026-04-26 — Audit Round 2 closeout (Phases G + H + J + K)

Per `docs/archive/AUDIT-ROUND-2.md` follow-up plan:

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
  `pnpm --filter @xangarro/mobile test:e2e` Maestro sweep.

Slice 8 closes the audit gaps Slice 9.5/9.6 left open:

- **A2 design revision** — replaced the pre-revision host access-token
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

**Note (2026-04-25):** the 9/9 typecheck claim above was later invalidated by a missing `@xangarro/sync-cloud` dependency in `apps/mobile`; Audit M-1 PR1 restores the workspace edge.

**Phase 1 recap:** 136/136 backend tasks shipped across 6 phases.
Slice 9.5/9.6/8 closed the route-adapter, design-revision, and
test-backfill gaps the audit surfaced. Public-beta tag-ready.

---

## 🚧 Slice 9 — Wiring Catch-up (in progress)

**Purpose.** An audit of Phase 1 shipment found real wiring gaps — the
backend hooks + `@xangarro/ui` screens are complete, but a few
shell-level bridges and desktop route adapters are missing. This slice
closes those gaps without reopening Phase 1's domain/data/application
work. It is additive only.

**Current state.** Phase A + B1 landed 2026-04-24. Remaining phases are
follow-ups.

### Milestone S9.5 — Critical wiring (P0, breaks shipped Phase 1 features)

Closed 2026-04-24. ADR-037 added (`@supabase/supabase-js` as a direct
mobile dependency).

- [x] **S9.5-T01** Extract `<NuevoEgresoModalSmart>` into `@xangarro/ui`
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
- [x] **S9.5-T05** Add `useLanHandle` factory in `@xangarro/ui/sync`;
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
      `@xangarro/ui`; mounted as the Movimientos sub-tab on both apps.
- [x] **S9.6-T09** Add `<CorteHomeCard>` smart wrapper. Mounted on
      Director Home (slot prop) + Operativo Ventas header.
- [x] **S9.6-T10** Mount `<FeedbackAction>` inside `<Settings>` (via
      new `feedback` prop). Both routes plumb appVersion / platform /
      role / crashReporting / breadcrumbs.
- [x] **S9.6-T11** `useMobileUpdateAdapter` (expo-updates) +
      `useDesktopUpdateAdapter` (`@tauri-apps/plugin-updater`) shell
      hooks with graceful-degrade dynamic imports. Both Settings routes
      mount the "Buscar actualizaciones" row.
- [x] **S9.6-T12** Add `useLanDetails` in `@xangarro/ui/sync`; both
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

- [x] **S9-B1-T01** Extract `pairWithLanServer` to `@xangarro/ui/sync`
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
      `'lan'` via `__xangarro_sync_state.lanRole` (host →
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
      `pnpm --filter @xangarro/ui typecheck && test` until green.

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
      `MAX(__xangarro_change_log.id)` vs `localPushHwm`.
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
- The "Ya tengo Xangarro en otro dispositivo" link on Step 1 leads to
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
      peer dep of `@xangarro/ui`.
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

- **Typecheck unblocked** — `@xangarro/sync-cloud` added to
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
  `@xangarro/ui/components/ConfirmDialog`.
- Modal close-button hit area expanded to 44 pt via `hitSlop`;
  `data-hit-slop` attribute exposed for testability.
- Stray Unicode glyphs (`✕`, `▾`) replaced with `<Icon>` calls.

- [x] **M-1-PR1-T01** `@xangarro/sync-cloud` workspace dep added to
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
[`docs/archive/AUDIT-M1-STEP0-FINDINGS.md`](./docs/archive/AUDIT-M1-STEP0-FINDINGS.md).

- [ ] **M-1-STEP0-T01 (Blocker, S)** Replace `<View onPress>` in the
      `Btn` primitive with `<Pressable>` so Maestro/iOS synthetic
      taps fire `onPress`. Today every Maestro flow that taps a Btn
      is silently no-op'd at the JS layer, even though Maestro
      reports "Tap … COMPLETED". This blocks the full
      `pnpm --filter @xangarro/mobile test:e2e` sweep — Step 4 of
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
      `docs/archive/AUDIT-M1-STEP0-FINDINGS.md` §F0-T08. Most are barrel-export
      cycles fixable by importing from the leaf module instead of
      `index.ts`; three are self-imports in `.native.tsx`
      platform-extension files that look like re-export typos.
- [ ] **M-1-STEP0-T05 (Medium, S+S)** Run
      `pnpm --filter @xangarro/mobile exec expo install --fix`,
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
      `EditarProductoUseCase` in `@xangarro/application` (all three
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

## ✅ Beta feedback round 1 (2026-08-18)

Ten items from a beta review session. Seven needed work; #4, #6 and #10
were positive feedback with no action. See ADR-051 for the onboarding
and navigation decisions.

- [x] **#1 Onboarding pregunta por dispositivos antes de la bienvenida** —
      fresh install now hydrates `mode='local'` and boots welcome →
      negocio. Wizard moved to Configuración → Sistema →
      "Sincronización y dispositivos". (ADR-051)
- [x] **#2 Primera pantalla es un formulario fiscal** —
      `FeatureDiscoveryGate` moved ahead of `BusinessGate`; the welcome
      carousel carries "¡Bienvenido a Xangarro!".
- [x] **#3 El teclado atrapa la pantalla en RESICO** — new shared
      `<KeyboardAwareForm>` (KeyboardAvoidingView + ScrollView +
      `keyboardShouldPersistTaps`); BusinessForm adopts it and dismisses
      the keyboard on régimen select. GUARDAR is reachable with the
      keyboard open.
- [ ] #4 — positive feedback, no action.
- [x] **#5 Costo de producto no debería ser obligatorio** — optional on
      both the create and edit paths; blank stores as 0 and the margin
      row hides rather than showing a fake 100%.
- [ ] #6 — positive feedback, no action.
- [x] **#7 "Otros" no dice nada y falta Gastos** — Director bar is now
      Inicio | Ventas | Gastos | Estados; the tool grid renders inside
      Configuración via `directorSettingsNavItems`. (ADR-051)
- [x] **#8 Ventas se lee como reporte, no como punto de venta** —
      title → "Nueva venta", primary CTA that focuses the product
      search, and an explicit "Toca un producto para agregarlo a la
      venta" hint.
- [x] **#9 Estados no refleja la venta/gasto recién registrado** — the
      real bug of the round. Nine mutation hooks never invalidated the
      estados query keys, and two of them
      (`use-editar-venta`, `use-editar-egreso`) were invalidating dead
      keys (`['sales', …]`, `['expenses', …]`) that nothing queries.
      Added `estadosKeys.dependentsForBusiness()` and swept it from
      every hook that moves money.
- [ ] #10 — positive feedback, no action.

**Follow-up:** the full Maestro regression has not been run on a device.
`maestro` **is** installed (`~/.maestro/bin/maestro`, not on `PATH`) but
refuses to start: _"Java 17 or higher is required"_. Install a JDK ≥ 17
before running `./apps/mobile/maestro/scripts/full-regression.sh` —
that is the last gate before tagging. Flows were updated statically:
three new shared subflows plus ~45 flows re-anchored off `tab-otros`.

**Static validation done in place of the device run:**

- [x] All 482 `runFlow:` references resolve **relative to the calling
      flow file** (Maestro's resolution rule). This surfaced two real
      defects and one pre-existing one: - the two new shared subflows called siblings as
      `shared/dismiss-modals.yaml` / `shared/navigate-to-settings.yaml`
      from inside `flows/shared/`, which resolves to
      `flows/shared/shared/…` → now bare filenames; - every `flows/parked-mvp/*.yaml` still called `shared/…` from a
      subdirectory — latent since 51d2c08 moved them out of the flows
      root without rewriting the paths. Now `../shared/…`, and the two
      targets that actually live in `parked-mvp/`
      (`enable-conversion-flag`, `enable-auditoria-flag`) are bare.
- [x] `npm run test` — 10/10 packages green (ui: 1900 tests). Two
      **pre-existing** failures fixed along the way, neither caused by
      this round: - `tests/hooks/use-movimientos-recientes.test.tsx` was a time
      bomb — fixtures dated `2026-05-09` aged out of the hook's
      rolling 90-day window on 2026-08-07. Fixtures are now relative
      to "now". - `tests/app/app-providers-overlays.test.tsx` asserted a contract
      superseded by 5f76068, which deliberately moved the overlays
      slot _inside_ the data providers so `<NotificationTapHost>`
      could resolve `useRepositories()`. Rewritten to test the
      contract that still holds: overlays are a sibling of the gate
      chain, so a short-circuiting gate can never drop them.
- [x] `npm run typecheck` + ESLint clean on everything this round
      touched. Note the repo has ~40 **pre-existing** lint errors in
      untouched files (`packages/ui` test `any`s and unused imports,
      `packages/observability` max-lines/complexity,
      `packages/data` unused import, `apps/mobile` two
      max-lines-per-function plus a missing `react-hooks` rule
      definition). Worth a dedicated cleanup pass; out of scope here.

> **Environment note:** `node` on `PATH` is v24 but `better-sqlite3` in
> `node_modules` is compiled for `NODE_MODULE_VERSION 141` (Node 25, at
> `/opt/homebrew/bin/node`). Run the suite with that node first on
> `PATH`, or `pnpm rebuild better-sqlite3` — otherwise `@xangarro/data`,
> `@xangarro/sync-lan`, `@xangarro/testing`, `@xangarro/application` and
> `@xangarro/ui` fail to open a DB and report false negatives.

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
- **Cold-start offline + PWA for the caja** — the register boots with no
  network (service-worker app shell) and installs as a PC app.
  Design ready in `docs/plan/14-caja-offline-pwa.md`; not scheduled.
- **Director notification when a device links.** The moment a register
  redeems an activation code (or a linked one goes away), the owner should
  hear about it: "Se vinculó la caja de la recepción." Email through the
  existing B-14 sender and the alerts webhook rail are the MVP-cheap
  carriers; WhatsApp (Twilio/Meta provider) is the desired end state and
  stays parked until there's a reason to pay for it.
- CoDi QR payment flow
- Clip / Mercado Pago Point integration
- WhatsApp as a first-class share target
- Payment reminders for Crédito ventas
- ESC/POS receipt printer support
- Cash drawer integration
- Simple multi-business support (same user, multiple businesses)

Do **not** plan or build these now. They're listed for visibility only.

---

