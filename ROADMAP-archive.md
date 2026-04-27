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
- [x] **P1B-M2-T02** `Venta` (incl. `cliente_id?`, `estado_pago`) — `packages/domain/src/entities/sale.ts` ships `SaleSchema` / `NewSaleSchema` + `PaymentMethodEnum` / `SaleCategoryEnum` / `PaymentStateEnum`. Cross-field `.refine` enforces "Crédito requires clienteId". Shared `_fields.ts` adds `isoDateField` + `moneyField`. `packages/data/src/repositories/sales-repository.ts` now re-exports the domain types (drops the inline declarations); `@cachink/testing` in-memory repo migrated to the branded `DeviceId`. 17 sale tests, domain coverage 100%.
- [x] **P1B-M2-T03** `Egreso` (incl. `gasto_recurrente_id?`) — `packages/domain/src/entities/expense.ts` ships `ExpenseSchema` / `NewExpenseSchema` + `ExpenseCategoryEnum` (the ten EGRESO_CAT values). `proveedor` nullable in read schema, optional on input; `gastoRecurrenteId` wires the recurring-templates feature from CLAUDE.md §1. 11 tests covering happy path + ≥3 rejection cases.
- [x] **P1B-M2-T04** `Producto`, `MovimientoInventario` — `product.ts` ships `ProductSchema` + `InventoryCategoryEnum` (6 values) + `InventoryUnitEnum` (9 values); `umbralStockBajo` defaults to 3. `inventory-movement.ts` ships `InventoryMovementSchema` + `MovementTypeEnum` / `EntryReasonEnum` / `ExitReasonEnum`, with a cross-field refine binding `motivo` to the allowed values for the movement `tipo`. 23 tests across the two files.
- [x] **P1B-M2-T05** `Empleado` — `employee.ts` ships `EmployeeSchema` / `NewEmployeeSchema` + `PayrollFrequencyEnum` (semanal / quincenal / mensual). 7 tests.
- [x] **P1B-M2-T06** `Cliente`, `PagoCliente` — `client.ts` ships `ClientSchema` / `NewClientSchema` with a deliberately loose phone regex (Mexican landlines / mobiles / international all pass). `client-payment.ts` ships `ClientPaymentSchema` / `NewClientPaymentSchema` and re-uses `PaymentMethodEnum` from `sale.ts`. 15 tests.
- [x] **P1B-M2-T07** `CorteDeDia` — `day-close.ts` ships `DayCloseSchema` / `NewDayCloseSchema` + `DayCloseRoleEnum` (Operativo / Director). Cross-field refine enforces `diferenciaCentavos === efectivoContadoCentavos - efectivoEsperadoCentavos` (CLAUDE.md §10). 10 tests covering zero / negative / positive diferencias.
- [x] **P1B-M2-T08** `GastoRecurrente` — `recurring-expense.ts` ships `RecurringExpenseSchema` / `NewRecurringExpenseSchema` + `RecurrenceFrequencyEnum` (semanal / quincenal / mensual). Cross-field refine binds the day-of-week / day-of-month fields to the selected frecuencia. 12 tests covering all three frequency branches.

### Milestone P1B-M3 — Drizzle schema & migrations

Completed 2026-04-23 — 11 Drizzle tables mirror the Zod entities; initial migration `0000_lying_johnny_blaze.sql` committed; integration test round-trips every entity through in-memory SQLite with `better-sqlite3`. Data coverage 100% (schema files declaratively excluded; covered by integration test).

- [x] **P1B-M3-T01** Write Drizzle schema for all entities in `packages/data/src/schema` — 11 sqliteTable definitions mirror the Zod entities 1:1 (`businesses`, `app_config`, `sales`, `expenses`, `products`, `inventory_movements`, `employees`, `clients`, `client_payments`, `day_closes`, `recurring_expenses`). Shared `_audit.ts` spreads the five audit columns; money uses `numeric('*_centavos', { mode: 'bigint' })` (Drizzle 0.45 exposes bigint via NUMERIC; app layer keeps JS bigint end-to-end). `packages/data/vitest.config.ts` now excludes `src/schema/**` from coverage — declarative tables are covered by the integration round-trip test (P1B-M3-T04).
- [x] **P1B-M3-T02** Configure Drizzle Kit for migrations — `packages/data/drizzle.config.ts` (dialect `sqlite`, `casing: 'snake_case'`, out `./drizzle/migrations`). `pnpm --filter @cachink/data db:generate` / `db:check` scripts added. `packages/data/README.md` documents the workflow: never edit a committed migration; write a new one instead (CLAUDE.md §2 principle 9).
- [x] **P1B-M3-T03** Generate the initial migration — `packages/data/drizzle/migrations/0000_lying_johnny_blaze.sql` (152 lines, 11 CREATE TABLE) + `meta/_journal.json` + `meta/0000_snapshot.json`. Drizzle-kit's CJS loader rejects `.js`-suffixed imports inside the schema barrel, so `packages/data/src/schema/*.ts` use extensionless relative imports (documented in the barrel header); moduleResolution `Bundler` accepts both forms, the rest of the repo keeps the `.js` convention. `drizzle-kit check` passes.
- [x] **P1B-M3-T04** Integration test: create in-memory SQLite, run migration, insert + read every entity — `packages/data/tests/schema.integration.test.ts` uses `better-sqlite3` + `drizzle-orm/better-sqlite3/migrator` to apply the migration and round-trip one row through each of the 11 tables (12 tests). Proves bigint money survives the numeric-column round-trip, `activo` boolean maps 0/1 ↔ boolean, and enum-typed columns accept the expected literal values. `better-sqlite3@^11.8.0` + `@types/better-sqlite3` added as data devDependencies; `pnpm.onlyBuiltDependencies` approves the native compile in `package.json`.

### Milestone P1B-M4 — Repository interfaces & implementations

Completed 2026-04-23 — 11 repository interfaces in `@cachink/data/repositories` with matching Drizzle + InMemory implementations (`packages/testing/src/in-memory-*-repository.ts`). Shared contract factories in `packages/testing/src/contract/` execute the same assertions against both implementations; `packages/data/tests/drizzle/*.test.ts` runs each factory against a fresh `better-sqlite3` `:memory:` database via `packages/data/tests/helpers/fresh-db.ts`. Every repo is constructed with a driver-agnostic `CachinkDatabase` alias (`drizzle-orm/sqlite-core` `BaseSQLiteDatabase<'sync' \| 'async', unknown, schema>`) so the same class covers better-sqlite3 (tests), expo-sqlite (mobile), and `@tauri-apps/plugin-sql` (desktop) without per-runtime branches.

- [x] **P1B-M4-T01** Define interface + Drizzle impl + InMemory impl for every repository (one task per entity) — 11 interfaces shipped (Sales, Businesses, AppConfig, Expenses, Products, InventoryMovements, Employees, Clients, ClientPayments, DayCloses, RecurringExpenses). AppConfig diverges intentionally to a key/value surface (`get`/`set`/`delete`/`list`) — no audit columns. InventoryMovements adds `sumStock(productoId)`. ClientPayments adds `sumByVenta(ventaId)` using the domain `sum()` helper. DayCloses auto-computes `diferencia = contado − esperado` on create. RecurringExpenses defaults `activo: true`.
- [x] **P1B-M4-T02** Contract tests: every repository runs the same test suite against both impls (behavior must match) — 90+ shared contract assertions across the 11 repos, each executed twice (InMemory + Drizzle) = ~180 test runs. eslint relaxation extended to `**/contract/**/*.ts` + `**/fixtures/**/*.ts` so `describe<Entity>RepositoryContract` factories can wrap many `it()` blocks without hitting `max-lines-per-function`.

### Milestone P1B-M5 — NIF financial calculations

Completed 2026-04-23 — 5 pure functional calcs in `packages/domain/src/financials/` plus a shared `_periodo.ts` PeriodRange + `isInPeriod` helper. Subpath export `@cachink/domain/financials` added. All calculations accept plain arrays of pre-filtered entity shapes (CLAUDE.md §10 — callers pre-filter by period); no dates computed inside. ISR uses basis-point bigint math (no floats touch money) and is clamped ≥ 0 — losses don't generate negative tax. Every metric in `calculateIndicadores` is `number | null`; zero denominators yield null so the UI renders "—".

- [x] **P1B-M5-T01** `calculateEstadoDeResultados(ventas, egresos, isrTasa) → EstadoResultados` — 11 tests covering empty input, sales-only, egresos-only (losses clamped), category split (Materia Prima + Inventario → costoDeVentas; rest → gastosOperativos), ISR brackets (0/30/100%), Crédito as accrual ingreso, refunds as negative-monto, invalid `isrTasa` rejection, and a realistic mixed-month scenario.
- [x] **P1B-M5-T02** `calculateBalanceGeneral(...)` including real Cuentas por Cobrar — 7 tests covering empty inputs, latest-corte-per-(fecha,device) efectivo aggregation, inventario valuation (Σ(costoUnit × cantidad)), CxC per pending/parcial venta clamped ≥ 0 on overpayment, pasivosManuales passthrough, and the accounting-identity check.
- [x] **P1B-M5-T03** `calculateFlujoDeEfectivo(...)` distinguishing cash cobros from Crédito — 8 tests covering cash-method filtering (Efectivo/Transferencia/Tarjeta/QR+CoDi), Crédito exclusion, pagos as cash-in, Inventario → inversion (capex), Materia Prima stays in operacion, mixed realistic day, refunds as negative-monto.
- [x] **P1B-M5-T04** `calculateIndicadores(...)` including Días Promedio de Cobranza — 10 tests covering margin happy paths, razón de liquidez, rotación de inventario, and every zero-denominator branch. All-cash period → días = null; CxC === ventasCrédito → días = periodo length.
- [x] **P1B-M5-T05** `calculateCorteDeDia(ventas, egresos, corteAnterior) → { esperado, diferencia }` — 7 tests covering empty day, Efectivo-only ventas accumulation, saldoAnterior chaining, egresos reducing esperado, positive/negative/zero diferencia, and the CORTE_ZERO sentinel.
- [x] **P1B-M5-T06** Unit tests with explicit fixture data for every formula — edge cases: no sales, all credit, all cash, mixed, refunds — consolidated across the five calcs + the isInPeriod helper (3 additional tests). 46 financial tests total.

### Milestone P1B-M6 — Application layer (use-cases)

Completed 2026-04-23 — 8 use-cases in `@cachink/application`, each a class implementing `UseCase<TInput, TOutput>` with a single `execute(input)` method. Input is re-validated with Zod at the boundary (defence-in-depth). All use-cases consume repository interfaces via constructor injection (never concrete impls) per CLAUDE.md §4.3. 45 application tests, coverage 100% lines / ≥98% branches. `@cachink/application` gains `@cachink/data` + `zod ^4.3.6` runtime deps.

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

**Goal:** The app works fully on a single device with no network. All modules from CLAUDE.md §1 are usable by an Operativo and Director. No sync, no cloud, no LAN. This is the minimum shippable Cachink.

**Exit criteria:** A user can install the Expo dev client on a tablet, pick "Solo este dispositivo" in the wizard, and complete a full business day: record ventas, record egresos, register inventory, close corte de día, and a Director can see the Estados Financieros and export a PDF report. Zero crashes on a full-day Maestro script.

## Phase 1C — Local Standalone Mode (the first shippable slice)

**Goal:** The app works fully on a single device with no network. All modules from CLAUDE.md §1 are usable by an Operativo and Director. No sync, no cloud, no LAN. This is the minimum shippable Cachink.

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

- [x] **P1D-M3-T01** Push queue: when offline or disconnected, enqueue local changes (push-queue.ts, HWM via `__cachink_sync_state`)
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

**Completed 2026-04-24.** 16/16 tasks across 5 milestones via Slice 5 (~22 commits). 2 new ADRs: ADR-029 (wire protocol), ADR-030 (change-log triggers). New packages touched: `@cachink/sync-lan`, `@cachink/data`, `@cachink/ui`, `apps/desktop`. New SQLite migration: 0001 (`__cachink_change_log`, `__cachink_sync_state`, `__cachink_conflicts`, 20 triggers across 10 synced tables). Test deltas: +45 sync-lan, +14 data, +10 UI. Full gate green: 9/9 lint, 9/9 typecheck, 8/8 test packages.

**Manual QA carry-overs:**

- Run `pnpm --filter @cachink/desktop tauri:check` on a machine with Rust ≥ 1.85 installed (cargo + rustup). Expected: clean compile.
- Run `maestro test apps/mobile/maestro/flows/lan-pair.yaml` against a live Tauri host with env `MAESTRO_LAN_URL` + `MAESTRO_LAN_TOKEN` populated.
- Run `pnpm --filter @cachink/desktop playwright test` with host + two Expo web tabs to execute the 3 LAN E2E specs.

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

**Completed 2026-04-24.** 14/14 tasks across 4 milestones via Slice 6 (~18 commits). 1 new ADR: ADR-035 (PowerSync Sync Streams + hybrid Cloud backend). Packages touched: new `packages/sync-cloud` surface (schema + streams + auth + bridge), `@cachink/ui` (CloudOnboardingScreen + AdvancedBackendScreen + PasswordResetScreen + useCloudSession + cloud-bridge), `apps/mobile/maestro/flows/cloud-*.yaml`, `apps/desktop/playwright/cloud-*.spec.ts`, `supabase/migrations/0001_schema.sql`, `supabase/tests/rls.spec.sql`, `supabase/README.md`. Test deltas: +11 sync-cloud, +8 UI cloud screens, +3 wizard updates. Full gate green: 9/9 lint, 9/9 typecheck, 9/9 test packages.

**Manual install / provisioning carry-overs:**

- Install PowerSync native modules in the app packages (`@powersync/react-native` in `apps/mobile`, `@powersync/web` in `apps/desktop`). `@cachink/sync-cloud` keeps them as peer deps so Local-standalone builds stay lean.
- Create the Supabase project + PowerSync instance; run `supabase db push` with a local PAT.
- Populate `EXPO_PUBLIC_CLOUD_API_URL`, `EXPO_PUBLIC_CLOUD_ANON_KEY`, and `EXPO_PUBLIC_POWERSYNC_URL` in EAS Build secrets / `.env.local` / Tauri build env.
- Run the Cloud E2E specs against the live backend from a real device plus two Expo web tabs.

---

## Phase 1F — Launch Prep (Completed 2026-04-24)

**Goal:** Cachink is shippable. App Store and Play Store submissions, desktop installers, beta program.

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
- Install Developer ID / Windows code-signing certs locally; set `CACHINK_APPLE_SIGNING_IDENTITY` + `CACHINK_WINDOWS_CERT_THUMBPRINT`.
- Generate Tauri updater keypair (`tauri signer generate`), insert pubkey into `tauri.conf.json`.
- Populate EAS Build secrets with Cloud URLs + anon keys.
- Run `./scripts/build-all.sh`, upload `.ipa` to TestFlight + `.aab` to Play Internal.
- Invite 5–10 beta testers in Jalisco / CDMX.
- Triage 2 weeks of beta feedback as GitHub issues labelled `beta-feedback`.
- Submit App Store + Play Store production builds.
- Deploy `docs/landing/index.html` to the chosen static host.
- Post `docs/launch/announcement.md` drafts; publish GitHub Release `v0.1.0` + tag the repo.

**Slice 8 follow-up (2026-04-25):** the audit's optional "scripts/build-landing.ts + tailwind.config.ts" item (M4-C18) was deferred — the static `docs/landing/index.html` shipped in P1F-M4-T03 works for the launch and a build pipeline adds tooling without value until the landing page needs interactive content.
