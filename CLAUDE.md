# CLAUDE.md — Cachink! Project Contract

> **Read this file at the start of every coding session.** It is the non-negotiable contract that governs how Cachink is built. If an instruction in this file conflicts with a user request, surface the conflict before proceeding.

---

## 0. Session Start — Orientation

Every coding session begins with these steps, in order:

1. **Read this file (CLAUDE.md) fully.** These are the architectural rules that always apply.
2. **Read `ROADMAP.md`** to see what phase you are in, what milestone is current, and what the next unblocked task is. Start work on that task unless the user directs otherwise.
3. **Consult `ARCHITECTURE.md`** when making or revisiting a significant decision. It is the append-only log of why the project is shaped the way it is.
4. **Read `README.md`** if you are new to the project.

Each file has a distinct role:

| File              | Role                             | Who edits it                  | Lifecycle                     |
| ----------------- | -------------------------------- | ----------------------------- | ----------------------------- |
| `CLAUDE.md`       | Architectural contract (rules)   | Humans only, via ADR          | Grows; never shrinks          |
| `ROADMAP.md`      | Implementation plan (tasks)      | Agents + humans               | Shrinks as phases archive     |
| `ARCHITECTURE.md` | Decision log (why)               | Humans + agents (append-only) | Grows forever, append-only    |
| `README.md`       | Orientation (how to get started) | Humans                        | Updated as onboarding changes |

**Never edit CLAUDE.md to mark progress.** Progress lives in ROADMAP.md.
**Never remove rules from CLAUDE.md.** If a rule must change, add an ADR in ARCHITECTURE.md first.

---

## 1. Project Overview

**Cachink!** is a simple, mobile-first **financial control and micro-POS app for Mexican emprendedores and small businesses** (new/emerging companies). It captures sales (ventas), expenses (egresos), inventory movements, and produces NIF-compliant financial statements and KPIs.

**Positioning:** _"Finanzas para emprendedores."_ The app is intentionally small in surface area. It is **not** a full ERP. Every feature must justify its existence against the principle: _the less clicks, the most value._

**Primary market:** Mexico (MXN, Spanish UI, NIF accounting standards, common Mexican payment methods including Efectivo, Transferencia, Tarjeta, QR/CoDi, Crédito).

**Target users — two roles:**

- **Operativo** (Equipo Operativo) — captures ventas, egresos, inventario. Read-write on transactional modules.
- **Director** (Director/Dueño) — read-only on transactional modules + full access to Estados Financieros, Indicadores, and the Director Home dashboard.

**Modules (Phase 1 scope):**

1. Login (role picker)
2. Ventas — includes optional `cliente_id` and `estado_pago` per sale (supports Crédito tracking)
3. Egresos (sub-tabs: Gasto / Nómina / Inventario-purchase) — with **recurring entry templates**
4. Productos (Catálogo / Stock / Movimientos, with barcode scanner) — renamed from Inventario per ADR-045
5. Estados Financieros (NIF B-3 Resultados, B-6 Balance, B-2 Flujo de Efectivo)
6. Indicadores (KPIs, margins, liquidity, rotation)
7. Director Home — includes **stock-low push notification** at end of day for Directors

**Phase 1 features that live inside the modules above (no new tabs):**

- **Clientes + Cuentas por Cobrar** — lightweight `Cliente` entity (name + optional phone). Exposed as an optional field on the Venta form and a "Cuentas por cobrar" card on Director Home. Enables the Crédito payment method to actually function.
- **Corte de día** — nightly cash reconciliation. A card on the Operativo home at end of day: expected cash vs counted cash, explain the difference, save. One `CorteDeDia` record per day per device.
- **Export all data** — Settings screen action. Produces an Excel workbook (one sheet per entity) and a PDF summary. For switching devices, sending to the contador, or backing up manually.
- **Informe mensual para el contador** — one-tap PDF from Estados Financieros screen. Clean monthly report with ventas + egresos by category + NIF Estado de Resultados. PDF is shareable via WhatsApp / email / AirDrop.
- **Recurring entries (gastos recurrentes)** — user can mark an egreso as recurring (monthly/quincenal/semanal). On the correct day, a "Pendiente de registrar" card appears with pre-filled values; one tap to confirm or dismiss. Invisible until it fires.
- **Simple receipts / comprobantes** — NOT CFDI, NOT facturación. A "Compartir comprobante" button on any venta generates a PNG or PDF with business name, date, concepto, monto, payment method, and a thank-you note. Shareable via WhatsApp.
- **Multi-device awareness in the shell** — top bar shows sync state: "Solo este dispositivo" / "Sincronizado con [server] · 3 dispositivos" / "Sin conexión — se sincronizará después". Conflicts surface inline, never silently.
- **Stock-low notifications** — Director-only. Local push at 19:00 if any producto has stock ≤ 0 or ≤ 3 units. No server required (local scheduled notification).

---

## 2. Non-Negotiable Principles

These principles override convenience, speed, or stylistic preference. If a decision conflicts with these, re-read them.

1. **UX simplicity is a feature.** Fewer fields, fewer clicks, fewer decisions for the user. Every new input must justify itself. When in doubt, cut it.
2. **Local-first is the default, not an option.** The app runs fully on a single device with no network, no account, no cloud vendor. Cloud/LAN sync are additive features layered on top — never prerequisites.
3. **Code lives in exactly one place.** Duplication across platforms, modules, or layers is a bug. If the same logic, component, or type appears twice, consolidate it.
4. **Test-Driven Development is mandatory** for domain and use-case layers. Write the failing test first. No feature ships without tests.
5. **Layered architecture with hard boundaries.** UI does not call the database. Domain logic knows nothing about React, SQLite, or sync.
6. **No God classes, no God files.** Files over 200 lines get refactored. Functions over 40 lines get refactored. Components over 150 lines get split.
7. **Always use the latest stable packages.** Before adding or upgrading any dependency, verify the current version on the npm registry. Do not default to older "known-safe" versions.
8. **Money is never a float.** All monetary values are stored and computed as **integer centavos** (minor units). Display formatting is a presentation concern only.
9. **No silent breaking changes.** Database migrations, sync-schema changes, and repository-interface changes require a migration plan and a test that exercises old → new data.
10. **CLAUDE.md is the architectural contract, not a task list.** It grows only when new rules are added. It is never rewritten or shrunk by agents. Implementation progress is tracked in `ROADMAP.md`. Significant architectural decisions are logged as ADRs in `ARCHITECTURE.md`.

---

## 3. Tech Stack

**This is a monorepo** with workspaces for domain, application, data, UI, sync, and testing. All packages share strict TypeScript, the same SQL schema, and the same component library.

### Root Build Tools & Package Management

- **Node.js** ≥ 22.0.0 (LTS)
- **pnpm** ≥ 9.0.0 (workspace manager)
- **Turborepo** ≥ 2.3.0 (monorepo task orchestration)
- **TypeScript** ≥ 5.7.0 (strict mode, `noUncheckedIndexedAccess: true`)
- **Vitest** ≥ 3.0.0 (unit tests)
- **@vitest/coverage-v8** ≥ 3.0.0 (code coverage)
- **ESLint** ≥ 9.15.0 (linting, shared config in `@cachink/config`)
- **Prettier** ≥ 3.3.0 (formatting)
- **Husky** ≥ 9.1.0 + **lint-staged** ≥ 15.2.0 (pre-commit hooks)

### Workspace Packages (see references in tsconfig.json)

- `packages/domain` — business logic, entities, use cases
- `packages/application` — application services, workflows
- `packages/data` — SQLite schema, Drizzle ORM, migrations, repositories
- `packages/ui` — Tamagui cross-platform component library (mobile + Tauri)
- `packages/sync-lan` — LAN sync (SQLite-to-SQLite over HTTP)
- `packages/sync-cloud` — cloud sync integration (PowerSync, Supabase backend)
- `packages/testing` — shared test utilities, fixtures, mock database

See individual workspace `package.json` files for platform-specific dependencies (Expo, Tauri, Drizzle, etc.).

---

## 4. Monorepo Structure

```
packages/
├── domain/                  # Domain entities, rules, use cases
├── application/             # Application services, workflows
├── data/                    # Drizzle schema, migrations, repositories
├── ui/                      # Tamagui components (write once, render everywhere)
├── sync-lan/                # LAN mode implementation
├── sync-cloud/              # Cloud mode implementation
└── testing/                 # Shared test harness and fixtures
```

Each package has its own `package.json`, `tsconfig.json`, and test suite.

---

## 5. Key Commands

All scripts run via **Turbo**, so they execute in dependency order across all workspaces.

```bash
npm run build              # TypeScript + Turbo build all packages
npm run bundle:check       # Verify bundle size
npm run test               # Run all unit tests (vitest)
npm run test:watch        # Watch mode for tests
npm run test:coverage     # Test coverage report
npm run lint              # ESLint all packages
npm run lint:fix          # ESLint fix + Prettier
npm run typecheck         # TypeScript type check only
npm run clean             # Remove all node_modules and build artifacts
npm run format            # Prettier format (all supported files)
npm run format:check      # Prettier check without writing
npm run release:build     # Build all app binaries (desktop, mobile)
npm run release:dry-run   # Release build without publishing
npm run store:screenshots # Capture store screenshots (Expo app)
npm run prepare           # Husky setup (runs automatically on install)
```

All TypeScript and lint checks are **strict**. No `eslint-disable`, `@ts-ignore`, or `any` types without an ADR.

---

## 6. Conventions

- TypeScript **strict mode** everywhere. `noUncheckedIndexedAccess: true`.
- All monetary values are **integer centavos** (never floats). Use `number` type, document in JSDoc as "in centavos".
- Use **`as const`** for constant objects to preserve literal types.
- Monorepo paths use **workspace references** (e.g., `import { Entity } from '@cachink/domain'`).
- Database schema is **single source of truth** in `packages/data`. No hand-written SQL; use Drizzle migrations.
- Tests use **Vitest** + `node:assert/strict`. No Mocha, Jest, or external assertion libraries.
- React components: functional + hooks. No class components. Tamagui for cross-platform UI.
- All platform-specific code is **isolated in its workspace** (Expo code in `apps/mobile`, Tauri in `apps/desktop`). Shared code is in `packages/`.
- **Option selectors:** When a form presents ≤5 mutually-exclusive choices, use **icon+description cards** (tappable, vertical stack) instead of a `<Combobox>` dropdown. Each card shows an icon (from the curated Lucide set in `Icon`), a bold label, and a 1-line description. Reserve `<Combobox>` for 6+ options or lists that may grow unbounded.

### Test coverage requirements

- **Domain + Application layers:** Every new entity test and use-case test
  is mandatory per CLAUDE.md §2.4 (TDD). Minimum 1 happy path + 3 unhappy
  paths per use case.
- **Maestro E2E flows:** Every user-facing feature that adds a new screen,
  tab, modal, or navigation path **must** ship with a corresponding Maestro
  flow in `apps/mobile/maestro/flows/`. The flow must exercise the happy
  path at minimum. Edge-case flows are recommended.
- **Existing test maintenance:** Any code change that alters a screen's
  testID, navigation flow, or auth gate behavior **must** update all
  affected Maestro flows before the change is considered complete. Run
  `./apps/mobile/maestro/scripts/full-regression.sh --dry-run` to see the
  full flow list.
- **Shared subflows:** Auth, role selection, and data setup steps must use
  the shared subflows in `apps/mobile/maestro/flows/shared/` — never
  inline auth steps in individual flow files.

---

## 7. What NOT to do

- Do not use floats for money. Always use integer centavos.
- Do not export untyped objects. Use `as const` and preserve literal types.
- Do not add dependencies without checking npm for the latest stable version first.
- Do not duplicate code across packages. Consolidate in `packages/domain` or `packages/data`.
- Do not write "God files" or "God classes." Keep files under 200 lines, functions under 40 lines.
- Do not test UI behavior with unit tests; use Playwright E2E for desktop (Tauri) or Expo Go preview.
- Do not commit breaking changes without a migration test in `packages/data`.
- Do not silently merge sync conflicts. Surface them to the user inline.

---

## 8. Error Handling Patterns

- **Domain layer (packages/domain):** Throw typed errors with a `code` and `message`. No generic `Error`.
- **Data layer (packages/data):** Catch DB errors, wrap in domain errors, propagate up. Log via a centralized logger.
- **Application layer (packages/application):** Catch errors, emit user-facing messages, log the error.
- **UI layer:** Show error toast, log to console. Never swallow errors silently.
- **Sync layer:** On conflict, emit conflict event to UI. On fatal error, queue for retry and show status.
- **Tests:** All error paths must be tested. Happy path + 3 unhappy paths minimum per function.

---

## 9. Agents

<!-- AGENTS:AUTO-GENERATED -->

No agents deployed. Create new agents in `.claude/agents/` as ADRs require specialized guidance.

<!-- END AGENTS:AUTO-GENERATED -->

---

## 10. Skills

<!-- SKILLS:AUTO-GENERATED -->

No skills deployed. Reference CLAUDE.md rules directly. For architecture questions, see `ARCHITECTURE.md`.

<!-- END SKILLS:AUTO-GENERATED -->

---

## 11. New Entity Checklist

Every new database entity **must** satisfy all items below before its phase is marked complete. Copy this checklist into the implementation task and verify each item.

### Domain Layer
- [ ] Branded ID type in `packages/domain/src/ids/index.ts`
- [ ] Zod schema + inferred TypeScript type in `packages/domain/src/entities/`
- [ ] Exported from `packages/domain/src/entities/index.ts`
- [ ] Domain entity test in `packages/domain/tests/entities/`

### Data Layer
- [ ] Drizzle table schema in `packages/data/src/schema/`
- [ ] Exported from `packages/data/src/schema/index.ts`
- [ ] Migration file in `packages/data/drizzle/migrations/`
- [ ] Journal entry in `meta/_journal.json`
- [ ] Migration registered in `migrations/index.ts` (import + sqlByTag + bundle + re-export)
- [ ] Repository interface in `packages/data/src/repositories/`
- [ ] Drizzle implementation in `packages/data/src/repositories/drizzle/`
- [ ] Both exported from their respective barrel `index.ts`

### Testing Layer
- [ ] In-memory repository in `packages/testing/src/`
- [ ] Exported from `packages/testing/src/index.ts`
- [ ] Fixture builder in `packages/testing/src/fixtures/` (if needed)
- [ ] Updated `packages/testing/src/mock-repository-provider.tsx` (import + instantiate)

### UI Layer
- [ ] Added to `Repositories` interface in `packages/ui/src/app/repository-provider.tsx`
- [ ] Added to `buildDrizzleRepositories()` factory
- [ ] `useXRepository()` accessor hook created + exported from `app/index.ts`
- [ ] Screen(s) in `packages/ui/src/screens/` (if applicable)
- [ ] Exported from `packages/ui/src/screens/index.ts`
- [ ] i18n keys in `packages/ui/src/i18n/locales/es-mx.ts`

### App Shell Layer
- [ ] Route file in `apps/mobile/src/app/` (Expo Router)
- [ ] Route file in `apps/desktop/src/app/routes/` (wouter)

### Verification
- [ ] `npx tsc --noEmit` passes for domain, data, application, ui, testing
- [ ] All existing tests still pass
- [ ] New entity has at least one domain entity test
- [ ] New use case has at least one application test (happy + 3 unhappy paths)
- [ ] File under 200 lines, functions under 40 lines
- [ ] No `TODO`, `FIXME`, `any`, `@ts-ignore`, or `eslint-disable` in new code