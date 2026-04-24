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

## Current Status

**Current phase:** Phase 1B — Domain & Data Layer 🚧
**Current milestone:** P1B-M2 — Entity types & Zod schemas
**Next unblocked task:** P1B-M2-T03 (Egreso — incl. `gasto_recurrente_id?`).
**Last updated:** 2026-04-23

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

## Phase 1B — Domain & Data Layer

**Goal:** Every Phase 1 entity (CLAUDE.md §9) has a Drizzle schema, a repository interface, a `Drizzle` implementation, an `InMemory` implementation, and passing unit tests for all NIF financial calculations (§10). Zero UI code yet.

**Exit criteria:** `packages/domain` and `packages/data` have ≥ 95% and ≥ 80% coverage respectively. All financial formulas have unit tests with explicit inputs/outputs. A full ledger (ventas + egresos + pagos + cortes) can be constructed in-memory and produces correct Estado de Resultados, Balance General, Flujo de Efectivo.

### Milestone P1B-M1 — Domain types & identity

Completed 2026-04-23 — landed during the Phase 0 / Phase 1A scaffold; reconciled here so history is honest.

- [x] **P1B-M1-T01** Install `ulid` package; create `packages/domain/src/ids` with branded ULID types per entity (`SaleId`, `ProductId`, etc.) — `ulid@^3` in `packages/domain/package.json`; `packages/domain/src/ids/index.ts` exports `Ulid`, `newUlid`, `newEntityId` + 11 branded IDs (`BusinessId`, `SaleId`, `ExpenseId`, `ProductId`, `InventoryMovementId`, `EmployeeId`, `ClientId`, `ClientPaymentId`, `DayCloseId`, `RecurringExpenseId`, `DeviceId`); 4 tests in `packages/domain/tests/ids.test.ts`.
- [x] **P1B-M1-T02** Create ISO date type guards and factories in `packages/domain/src/dates` — `packages/domain/src/dates/index.ts` exports branded `IsoDate` / `IsoTimestamp` + `parseIsoDate`, `today`, `now`, `yearMonth`, `year`; 9 tests in `packages/domain/tests/dates.test.ts`.
- [x] **P1B-M1-T03** Create Money type (bigint centavos) with arithmetic helpers — `packages/domain/src/money/index.ts` exports `Money`, `ZERO`, `fromCentavos`, `fromPesos`, `sum`, `subtract`, `multiplyByInteger`, `isNonNegative`, `toPesosString`; rationale in ADR-009.
- [x] **P1B-M1-T04** Unit tests for Money (addition, subtraction, multiplication by integer, no float) — 31 tests in `packages/domain/tests/money.test.ts` covering centavos-only invariant, float-rejection, peso-string parsing, and arithmetic helpers.

### Milestone P1B-M2 — Entity types & Zod schemas

- [x] **P1B-M2-T01** Zod schemas + TS types for `Business`, `AppConfig` — `packages/domain/src/entities/{business,app-config}.ts` ship `BusinessSchema` / `NewBusinessSchema` / `AppConfigSchema` + inferred types. Shared helpers `_ulid-field.ts` (`ULID_REGEX`, `ulidField<T>()`) and `_audit.ts` (`auditSchema`, `isoTimestampField`) keep entity files thin. `zod@^4.3.6` added to `packages/domain/package.json`; subpath `./entities` exported. 16 new tests in `packages/domain/tests/entities/`; domain coverage stays at 100%.
- [x] **P1B-M2-T02** `Venta` (incl. `cliente_id?`, `estado_pago`) — `packages/domain/src/entities/sale.ts` ships `SaleSchema` / `NewSaleSchema` + `PaymentMethodEnum` / `SaleCategoryEnum` / `PaymentStateEnum`. Cross-field `.refine` enforces "Crédito requires clienteId". Shared `_fields.ts` adds `isoDateField` + `moneyField`. `packages/data/src/repositories/sales-repository.ts` now re-exports the domain types (drops the inline declarations); `@cachink/testing` in-memory repo migrated to the branded `DeviceId`. 17 sale tests, domain coverage 100%.
- [ ] **P1B-M2-T03** `Egreso` (incl. `gasto_recurrente_id?`)
- [ ] **P1B-M2-T04** `Producto`, `MovimientoInventario`
- [ ] **P1B-M2-T05** `Empleado`
- [ ] **P1B-M2-T06** `Cliente`, `PagoCliente`
- [ ] **P1B-M2-T07** `CorteDeDia`
- [ ] **P1B-M2-T08** `GastoRecurrente`

### Milestone P1B-M3 — Drizzle schema & migrations

- [ ] **P1B-M3-T01** Write Drizzle schema for all entities in `packages/data/src/schema`
- [ ] **P1B-M3-T02** Configure Drizzle Kit for migrations
- [ ] **P1B-M3-T03** Generate the initial migration
- [ ] **P1B-M3-T04** Integration test: create in-memory SQLite, run migration, insert + read every entity

### Milestone P1B-M4 — Repository interfaces & implementations

- [ ] **P1B-M4-T01** Define interface + Drizzle impl + InMemory impl for every repository (one task per entity)
- [ ] **P1B-M4-T02** Contract tests: every repository runs the same test suite against both impls (behavior must match)

### Milestone P1B-M5 — NIF financial calculations

- [ ] **P1B-M5-T01** `calculateEstadoDeResultados(ventas, egresos, isrTasa) → EstadoResultados`
- [ ] **P1B-M5-T02** `calculateBalanceGeneral(...)` including real Cuentas por Cobrar
- [ ] **P1B-M5-T03** `calculateFlujoDeEfectivo(...)` distinguishing cash cobros from Crédito
- [ ] **P1B-M5-T04** `calculateIndicadores(...)` including Días Promedio de Cobranza
- [ ] **P1B-M5-T05** `calculateCorteDeDia(ventas, egresos, corteAnterior) → { esperado, diferencia }`
- [ ] **P1B-M5-T06** Unit tests with explicit fixture data for every formula — edge cases: no sales, all credit, all cash, mixed, refunds

### Milestone P1B-M6 — Application layer (use-cases)

- [ ] **P1B-M6-T01** `RegistrarVentaUseCase`
- [ ] **P1B-M6-T02** `RegistrarEgresoUseCase`
- [ ] **P1B-M6-T03** `RegistrarMovimientoInventarioUseCase` (entrada auto-creates an Egreso per CLAUDE.md mock behavior)
- [ ] **P1B-M6-T04** `RegistrarPagoClienteUseCase` (updates Venta.estado_pago to parcial/pagado)
- [ ] **P1B-M6-T05** `CerrarCorteDeDiaUseCase`
- [ ] **P1B-M6-T06** `ProcesarGastoRecurrenteUseCase` (creates the Egreso, advances proximo_disparo)
- [ ] **P1B-M6-T07** `GenerarInformeMensualUseCase` (returns structured data; PDF rendering comes later)
- [ ] **P1B-M6-T08** `ExportarDatosUseCase` (returns a dataset that the UI serializes to Excel/PDF)

---

## Phase 1C — Local Standalone Mode (the first shippable slice)

**Goal:** The app works fully on a single device with no network. All modules from CLAUDE.md §1 are usable by an Operativo and Director. No sync, no cloud, no LAN. This is the minimum shippable Cachink.

**Exit criteria:** A user can install the Expo dev client on a tablet, pick "Solo este dispositivo" in the wizard, and complete a full business day: record ventas, record egresos, register inventory, close corte de día, and a Director can see the Estados Financieros and export a PDF report. Zero crashes on a full-day Maestro script.

### Milestone P1C-M1 — App shell & navigation

- [ ] **P1C-M1-T01** Role picker login screen (from mock, reused across platforms)
- [ ] **P1C-M1-T02** Bottom tab navigation for Operativo (3 tabs) and Director (6 tabs) per CLAUDE.md §1
- [ ] **P1C-M1-T03** Top bar with role indicator, "Cambiar" button, and sync-state slot (empty in local mode)
- [ ] **P1C-M1-T04** Settings screen (minimal: mode, business info, language placeholder)

### Milestone P1C-M2 — Database setup & config wizard

- [ ] **P1C-M2-T01** SQLite initialization on first launch (mobile + desktop)
- [ ] **P1C-M2-T02** Run Drizzle migrations on first launch
- [ ] **P1C-M2-T03** First-run wizard with 4 mode cards (CLAUDE.md §7.4) — only "Solo este dispositivo" is functional in Phase 1C
- [ ] **P1C-M2-T04** Mode stored in `AppConfig`
- [ ] **P1C-M2-T05** Business creation form (nombre, regimen_fiscal, isr_tasa with default 30%)

### Milestone P1C-M3 — Ventas module

- [ ] **P1C-M3-T01** List view with date filter, total card, per-venta cards
- [ ] **P1C-M3-T02** "Nueva Venta" modal with concepto, categoria, monto, metodo, optional cliente
- [ ] **P1C-M3-T03** Crédito flow: selecting Crédito requires a cliente; creates venta with estado_pago = 'pendiente'
- [ ] **P1C-M3-T04** Compartir comprobante action (generates PNG/PDF, native share sheet)
- [ ] **P1C-M3-T05** Maestro E2E: create venta in Efectivo, verify totals update
- [ ] **P1C-M3-T06** Maestro E2E: create venta in Crédito, verify it appears in Cuentas por Cobrar

### Milestone P1C-M4 — Egresos module

- [ ] **P1C-M4-T01** List view (reuse Ventas layout)
- [ ] **P1C-M4-T02** Modal with 3 sub-tabs: Gasto / Nómina / Inventario
- [ ] **P1C-M4-T03** "Marcar como recurrente" toggle in Gasto tab → creates a GastoRecurrente
- [ ] **P1C-M4-T04** Pendientes de registrar card (shows when a recurrente is due)
- [ ] **P1C-M4-T05** Maestro E2E for each sub-tab

### Milestone P1C-M5 — Inventario module

- [ ] **P1C-M5-T01** Stock view with buscar, KPI strip, stock alerts
- [ ] **P1C-M5-T02** Movimientos view (last 40)
- [ ] **P1C-M5-T03** Nuevo Producto modal
- [ ] **P1C-M5-T04** Entrada/Salida modal per producto
- [ ] **P1C-M5-T05** Barcode scanner component (platform-extension pattern: `Scanner.native.tsx` uses expo-camera; `Scanner.web.tsx` uses BarcodeDetector API + getUserMedia fallback)
- [ ] **P1C-M5-T06** Manual barcode entry fallback on both platforms
- [ ] **P1C-M5-T07** Maestro E2E: add product, scan SKU, register entrada, register salida

### Milestone P1C-M6 — Clientes & Cuentas por Cobrar

- [ ] **P1C-M6-T01** Clientes list (lightweight; reached from Venta form and Director Home)
- [ ] **P1C-M6-T02** Crear/editar cliente (nombre, telefono, email, nota)
- [ ] **P1C-M6-T03** Cuentas por Cobrar card on Director Home showing pending Crédito ventas grouped by cliente
- [ ] **P1C-M6-T04** "Registrar pago" action from a pending venta → creates PagoCliente, updates estado_pago
- [ ] **P1C-M6-T05** Maestro E2E: full credit → partial payment → full payment flow

### Milestone P1C-M7 — Corte de Día

- [ ] **P1C-M7-T01** Card on Operativo home that appears after 18:00 local time
- [ ] **P1C-M7-T02** Modal showing efectivo esperado, input for contado, diferencia auto-calculated
- [ ] **P1C-M7-T03** Optional explicacion field for diferencia ≠ 0
- [ ] **P1C-M7-T04** Save → creates CorteDeDia record; card hidden until next day
- [ ] **P1C-M7-T05** Maestro E2E: full day of ventas + egresos → corte → diferencia math checks out

### Milestone P1C-M8 — Estados Financieros & Indicadores

- [ ] **P1C-M8-T01** Period picker (mensual/anual)
- [ ] **P1C-M8-T02** Estado de Resultados view (NIF B-3)
- [ ] **P1C-M8-T03** Balance General view (NIF B-6)
- [ ] **P1C-M8-T04** Flujo de Efectivo view (NIF B-2)
- [ ] **P1C-M8-T05** Indicadores dashboard with KPIs and gauges
- [ ] **P1C-M8-T06** Disclaimer: ISR referencial; consult contador

### Milestone P1C-M9 — Export & Reports

- [ ] **P1C-M9-T01** "Exportar todos los datos" in Settings → Excel workbook (one sheet per entity)
- [ ] **P1C-M9-T02** "Informe mensual para contador" button on Estados Financieros → PDF
- [ ] **P1C-M9-T03** Native share sheet integration (mobile + desktop)
- [ ] **P1C-M9-T04** Maestro E2E: export Excel and verify download

### Milestone P1C-M10 — Director Home

- [ ] **P1C-M10-T01** Greeting, Utilidad del mes hero card
- [ ] **P1C-M10-T02** Ventas hoy / Egresos hoy cards
- [ ] **P1C-M10-T03** Cuentas por Cobrar card
- [ ] **P1C-M10-T04** Actividad reciente (últimas 3 ventas, 3 egresos)
- [ ] **P1C-M10-T05** Stock bajo resumen

### Milestone P1C-M11 — Notifications

- [ ] **P1C-M11-T01** Configure expo-notifications (mobile); native tray notifications (desktop)
- [ ] **P1C-M11-T02** Schedule 19:00 daily check for low-stock → push notification (Director only)
- [ ] **P1C-M11-T03** Opt-out setting in Settings

### Milestone P1C-M12 — Hardening

- [ ] **P1C-M12-T01** Error boundary at app shell
- [ ] **P1C-M12-T02** Crash reporting (Sentry with local-first consent)
- [ ] **P1C-M12-T03** Database backup-before-migration
- [ ] **P1C-M12-T04** Accessibility pass (screen reader labels, tap target sizes)
- [ ] **P1C-M12-T05** Performance: cold start < 2s on mid-range Android tablet

---

## Phase 1D — LAN Mode

**Goal:** Multi-device local operation. One desktop (Windows or Mac) acts as the LAN server; up to 3 tablets connect over Wi-Fi and stay in sync. Fully air-gapped.

**Exit criteria:** Three physical devices on the same Wi-Fi can record ventas simultaneously; all three see consistent totals within 2 seconds. Conflict resolution is deterministic. Disconnecting Wi-Fi doesn't lose data — changes queue and replay when reconnected.

### Milestone P1D-M1 — First-party sync protocol

- [ ] **P1D-M1-T01** Design the sync protocol (delta format, auth token, heartbeat, conflict policy) — document as ADR
- [ ] **P1D-M1-T02** Define wire types in `packages/sync-lan/src/protocol`

### Milestone P1D-M2 — Rust LAN server (inside Tauri)

- [ ] **P1D-M2-T01** HTTP endpoint: POST deltas, GET since-timestamp
- [ ] **P1D-M2-T02** WebSocket endpoint: real-time change broadcast
- [ ] **P1D-M2-T03** Pairing token issuance + verification
- [ ] **P1D-M2-T04** QR code generation for discovery (encoded: LAN URL + pairing token)

### Milestone P1D-M3 — JS LAN client

- [ ] **P1D-M3-T01** Push queue: when offline or disconnected, enqueue local changes
- [ ] **P1D-M3-T02** Pull loop: request deltas since last-synced timestamp
- [ ] **P1D-M3-T03** Conflict resolution: last-write-wins by updated_at with device_id tiebreak
- [ ] **P1D-M3-T04** Reconnection logic with exponential backoff

### Milestone P1D-M4 — Wizard integration

- [ ] **P1D-M4-T01** "Ser el servidor local" flow on desktop
- [ ] **P1D-M4-T02** "Conectar a un servidor local" flow with QR scan on tablets
- [ ] **P1D-M4-T03** Sync state in top bar ("Sincronizado con [server] · 3 dispositivos")

### Milestone P1D-M5 — Multi-device testing

- [ ] **P1D-M5-T01** E2E: 2 tablets + 1 PC, simultaneous ventas, verify consistency
- [ ] **P1D-M5-T02** E2E: disconnect Wi-Fi mid-sale, reconnect, verify replay
- [ ] **P1D-M5-T03** E2E: conflict scenario (same producto stock edited twice), verify winner is deterministic

---

## Phase 1E — Cloud Mode

**Goal:** PowerSync + Supabase (default) integration. Users can sign up from the app, pick Cloud mode, and sync data across devices anywhere with internet.

**Exit criteria:** A user signs up on tablet A, records ventas, signs into the same account on tablet B, and sees their data. Offline changes queue and sync when internet returns.

### Milestone P1E-M1 — PowerSync integration

- [ ] **P1E-M1-T01** Install `@powersync/react-native` and `@powersync/web`
- [ ] **P1E-M1-T02** Define Sync Streams per entity
- [ ] **P1E-M1-T03** Configure row-level security (business_id isolation)

### Milestone P1E-M2 — Supabase backend

- [ ] **P1E-M2-T01** Provision Supabase project (dev, staging, prod)
- [ ] **P1E-M2-T02** Mirror Drizzle schema to Supabase Postgres
- [ ] **P1E-M2-T03** Set up Supabase Auth (email/password; evaluate magic link / phone OTP for Mexican market)
- [ ] **P1E-M2-T04** Connect Supabase to PowerSync

### Milestone P1E-M3 — Auth UX

- [ ] **P1E-M3-T01** Sign up / sign in flow in the wizard's "En la nube" path
- [ ] **P1E-M3-T02** Session persistence
- [ ] **P1E-M3-T03** Sign-out flow
- [ ] **P1E-M3-T04** Password recovery

### Milestone P1E-M4 — Cloud testing

- [ ] **P1E-M4-T01** E2E: sign up → record venta → sign in on second device → verify
- [ ] **P1E-M4-T02** E2E: airplane mode → create changes → reconnect → verify sync
- [ ] **P1E-M4-T03** E2E: role-based sync (Operativo gets 90d, Director gets all)

---

## Phase 1F — Launch Prep

**Goal:** Cachink is shippable. App Store and Play Store submissions, desktop installers, beta program.

### Milestone P1F-M1 — Store assets

- [ ] **P1F-M1-T01** App icon (final, approved)
- [ ] **P1F-M1-T02** Screenshots for App Store, Play Store (both tablet sizes)
- [ ] **P1F-M1-T03** Store descriptions in Spanish
- [ ] **P1F-M1-T04** Privacy policy + terms of service

### Milestone P1F-M2 — Builds

- [ ] **P1F-M2-T01** EAS Build release profiles (iOS, Android)
- [ ] **P1F-M2-T02** Tauri production builds (Windows installer, macOS .dmg, code signing)
- [ ] **P1F-M2-T03** Auto-update flow (EAS Update mobile; Tauri updater desktop)

### Milestone P1F-M3 — Beta

- [ ] **P1F-M3-T01** TestFlight beta (iOS)
- [ ] **P1F-M3-T02** Play Store internal testing track
- [ ] **P1F-M3-T03** Beta program with 5–10 real emprendedoras in Jalisco / CDMX
- [ ] **P1F-M3-T04** Feedback loop: weekly interview + bug triage

### Milestone P1F-M4 — Public launch

- [ ] **P1F-M4-T01** App Store submission
- [ ] **P1F-M4-T02** Play Store submission
- [ ] **P1F-M4-T03** Landing page (cachink.mx or similar)
- [ ] **P1F-M4-T04** Launch announcement

---

## Post-Phase 1 — Future Phase Candidates

These are parked per CLAUDE.md §14. When Phase 1 ships and we have real user data, we'll pick 1–2 to plan as Phase 2.

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
