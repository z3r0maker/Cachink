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

## 3. Tech Stack (Pinned Version Floors — Always Prefer Latest Stable)

> Versions below are **minimum floors as of project bootstrap (April 2026)**. Before running `npm install`, check the npm registry for the latest stable and use that. Do not downgrade below these floors.

### Core (always present, every mode)

- **TypeScript** ≥ 5.6 (strict mode, `noUncheckedIndexedAccess: true`)
- **Node.js** ≥ 22 LTS
- **pnpm** ≥ 9 (monorepo package manager)
- **Turborepo** ≥ 2.3 with **pnpm workspaces**

### Mobile (iOS / Android tablets)

- **Expo SDK** ≥ 55 (released Feb 2026; includes React Native 0.83, React 19.2)
- **Expo Router** (file-based routing)
- **expo-sqlite** (the SQLite engine)
- **expo-camera** (inventory scanning)
- **react-native-get-random-values** (Hermes `crypto.getRandomValues` polyfill — required for `ulid` PRNG on iOS/Android, see ADR-038)
- **EAS Build** + **EAS Update** for distribution

### Desktop (Windows / macOS)

- **Tauri** ≥ 2.10 (Rust backend, system WebView frontend)
- **@tauri-apps/plugin-sql** for SQLite access on desktop
- Do **not** introduce Electron. If a Tauri limitation is hit, open an ADR before considering alternatives.

### UI Layer (shared between mobile and desktop)

- **Tamagui** ≥ 1.115 for cross-platform components (RN + web/Tauri) — **write once, render everywhere**
- **Plus Jakarta Sans** (Google Fonts) — weights 400–900
- All brand tokens defined in `packages/ui/src/theme.ts` (see §8).
- **Storybook** ≥ 10.3 (`@storybook/react-native-web-vite` preset) for component docs + visual regression (see ADR-017).
- **Playwright** ≥ 1.59 for Storybook-story visual snapshots (also used for Tauri desktop E2E in Phase 1C).

### Data & Persistence (always present, every mode)

- **SQLite** on every device (via `expo-sqlite` on mobile, `@tauri-apps/plugin-sql` on desktop).
- **Drizzle ORM** ≥ 0.36 — type-safe schema and queries, works identically on RN and Node/Tauri.
- **Drizzle Kit** for migrations.

### Sync Layer (mode-dependent — NOT core infrastructure)

Sync is **only** loaded when the user opts into a mode that needs it. Local-only users never install, see, or pay for these.

- **LAN mode:** first-party SQLite-to-SQLite sync over HTTP/WebSocket. Built in-house. See §7.2.
- **Cloud mode:** **PowerSync** (`@powersync/react-native`, `@powersync/web`) — the sync engine. Uses **PowerSync Sync Streams** (the 2026 recommended approach).
- **Cloud mode backend (Postgres):** pluggable. Default recommendation in the wizard is **Supabase** (easiest onboarding, free tier, includes Auth). Alternatives the user can pick: **Neon**, **self-hosted Postgres**, or **Turso** (with its own sync, not PowerSync). Supabase is **not** required by the codebase — it is one possible Cloud backend.
- **Cloud mode Auth SDK:** `@supabase/supabase-js` ≥ 2 ships as a direct dependency of `apps/desktop` and `apps/mobile` (ADR-037). Only loaded when `@cachink/sync-cloud` is lazy-imported — Local-standalone and LAN bundles never include it.

### State Management

- **Zustand** ≥ 5 for local UI state (role, current tab, modal visibility, form drafts).
- **TanStack Query** ≥ 5.62 for async state and caching.
- No Redux. No MobX. No Context-as-state.

### Forms & Validation

- **React Hook Form** ≥ 7.54
- **Zod** ≥ 3.24 for schema validation (shared between forms and domain types)

### Money & Decimal Math

- Money stored as `bigint` (centavos). For non-trivial math (weighted averages, proportional splits), use **`decimal.js`** or **`dinero.js`** ≥ 2. **Never `Number` for money.**

### Testing

- **Vitest** ≥ 2.1 — unit tests for domain, application, and data layers.
- **Vitest** + **`@testing-library/react`** under **jsdom** — component tests in `packages/ui`. The `.native.tsx` platform variants test under jsdom via a `'react-native' → 'react-native-web'` alias in `packages/ui/vitest.config.ts`. They assert structure and wiring; platform-native behaviour is Maestro's job. See **ADR-044** for the full rationale (and ADR-033 for the contract-factory infrastructure these tests consume).
- **Maestro** ≥ 1.40 — E2E on iOS/Android simulators and physical tablets.
- **Playwright** ≥ 1.59 — E2E for the Tauri desktop app and Storybook visual snapshots (see ADR-017).
- **MSW** ≥ 2.7 — mocking the sync layer in integration tests.

### Lint & Format

- **ESLint** ≥ 9 (flat config) with:
  - `@typescript-eslint`
  - `eslint-plugin-sonarjs` (cognitive complexity, God functions, duplicates)
  - `eslint-plugin-boundaries` (enforces layer architecture — §4)
  - `eslint-plugin-unicorn`
- **Prettier** ≥ 3.4
- **Husky** + **lint-staged** — run lint + tests pre-commit

### CI/CD

- **Local quality gate via Husky** (see ADR-018):
  - `pre-commit` — prettier + eslint --fix on staged files (via `lint-staged`).
  - `pre-push` — `pnpm lint && pnpm typecheck && pnpm test`. Push is blocked on any failure.
  - Bypass only in emergencies with `git push --no-verify`.
- **Mobile / desktop builds** — triggered manually from the dev machine for Phase 0/1 (EAS Build for mobile, `pnpm --filter desktop tauri build` for desktop). Automated build pipelines are parked until a second contributor joins.
- **Renovate** bot: weekly dependency PRs. With no CI gate, `automerge` is disabled in `renovate.json` — the developer pulls the PR locally and pushes through the Husky gate to merge.

---

## 4. Architecture — Layered with Hard Boundaries

### 4.1 Repository Structure

```
cachink/
├── apps/
│   ├── mobile/                    # Expo app (iOS, Android tablets)
│   │   └── src/
│   │       ├── app/               # Expo Router entry points
│   │       └── shell/             # App-shell only: navigation, root layout, platform bootstrap
│   └── desktop/                   # Tauri app (Windows, macOS)
│       ├── src/
│       │   ├── app/               # Tauri webview entry + router
│       │   └── shell/             # App-shell only: window chrome, tray, platform bootstrap
│       └── src-tauri/             # Rust backend (Tauri commands, filesystem, printer, LAN server)
├── packages/
│   ├── domain/                    # Pure business logic. No imports from React, Expo, Tauri, SQLite.
│   ├── application/               # Use-cases. Orchestrates domain + repositories.
│   ├── data/                      # Repository interfaces + Drizzle/SQLite implementations + sync connectors.
│   ├── ui/                        # ALL reusable components. Tamagui theme tokens. Shared screens.
│   ├── sync-lan/                  # First-party LAN sync client + server (loaded only in LAN mode).
│   ├── sync-cloud/                # PowerSync integration (loaded only in Cloud mode).
│   ├── config/                    # Shared ESLint, TS, Prettier configs.
│   └── testing/                   # Shared test utilities, in-memory repos, fixtures.
├── CLAUDE.md                      # This file.
├── ARCHITECTURE.md                # Diagrams, ADRs index.
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

**Critical rule:** `apps/mobile/src/` and `apps/desktop/src/` contain **only app-shell code**. Reusable components live in `packages/ui`. See §5.

### 4.2 Layer Rules (enforced by `eslint-plugin-boundaries`)

| Layer                    | May import from                                                                                 | Must NOT import                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `domain`                 | nothing internal (stdlib only)                                                                  | React, Expo, Tauri, SQLite, anything UI or IO    |
| `application`            | `domain`                                                                                        | UI, SQLite directly (only repository interfaces) |
| `data`                   | `domain` (for types)                                                                            | UI, `application`                                |
| `sync-lan`, `sync-cloud` | `domain`, `data` (interfaces)                                                                   | UI, `application`                                |
| `ui`                     | `application`, `domain` (types), `data` (only repository **interfaces**, never implementations) | direct SQLite calls, direct sync-engine calls    |
| `apps/*`                 | everything                                                                                      | —                                                |

**Rule of thumb:** If I can't unit-test a piece of business logic without mounting a React component or opening a database, it's in the wrong layer.

### 4.3 Repository Pattern (the single most important pattern)

Every data access goes through a **repository interface** defined in `packages/data/src/repositories/`:

```ts
// packages/data/src/repositories/sales-repository.ts
export interface SalesRepository {
  create(sale: NewSale): Promise<Sale>;
  findByDate(date: ISODate): Promise<Sale[]>;
  findById(id: SaleId): Promise<Sale | null>;
  delete(id: SaleId): Promise<void>;
}
```

Two implementations ship with every repository:

1. **`DrizzleSalesRepository`** — production, backed by SQLite via Drizzle.
2. **`InMemorySalesRepository`** — test-only, lives in `packages/testing`.

Use-cases receive repositories via **constructor injection** (or a factory). Never instantiate a concrete repository inside a use-case.

### 4.4 File/Function Size Budgets

| Unit                                 | Soft limit | Hard limit |
| ------------------------------------ | ---------- | ---------- |
| Source file                          | 150 lines  | 200 lines  |
| Function                             | 30 lines   | 40 lines   |
| React component                      | 100 lines  | 150 lines  |
| Cyclomatic complexity (per function) | 8          | 12         |

Breaching a hard limit fails CI. The fix is **always** to extract, not to raise the limit.

---

## 5. Cross-Platform Component Rules

**The principle:** there is exactly one implementation of every UI component. Mobile and desktop import the same file. Agents and humans who "fix the mobile version" of a shared component have violated the architecture.

### 5.1 Where components live

- **All reusable UI components live in `packages/ui`.**
- **`apps/mobile/src/` and `apps/desktop/src/` are reserved for app-shell only:** navigation root, window chrome, platform bootstrap, native-plugin setup. Anything exporting a reusable component from these directories is a bug.
- Both apps import components by name from `@cachink/ui`.

### 5.2 How to build a new component

1. **Check for an existing component first.** If something similar exists in `packages/ui`, extend it instead of creating a new one.
2. **Default path:** single `.tsx` file in `packages/ui/src/components/<Name>/<Name>.tsx`, built with Tamagui primitives. Renders identically on mobile and desktop.
3. **Add a Storybook/Ladle story** — both platform targets must render it.
4. **Import it from `@cachink/ui`** in both apps.

### 5.3 When a component genuinely needs platform-specific behavior

Some components must differ because the underlying capability differs (camera, Bluetooth, filesystem, printer). In those cases, use the **platform-extension pattern**:

```
packages/ui/src/components/Scanner/
  ├── Scanner.tsx            # shared types, props contract, default/fallback
  ├── Scanner.native.tsx     # RN implementation (auto-picked by Metro on mobile)
  ├── Scanner.web.tsx        # Web/Tauri implementation (auto-picked by Vite)
  └── index.ts               # re-exports from the platform-agnostic entry
```

Both variants must:

- Export the **same component name and props contract** (the shared `.tsx` is the source of truth for types).
- Have their own test file (`Scanner.native.test.tsx`, `Scanner.web.test.tsx`).
- Be listed in the same Storybook story.

### 5.4 When a platform split is justified — and when it isn't

| Justified                                                                                                        | Not justified                                                              |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ✅ Different native API required (camera, Bluetooth, system printer)                                             | ❌ "It looks a bit different on desktop" — use Tamagui's responsive tokens |
| ✅ Fundamentally different interaction model (e.g., right-click context menu on desktop vs long-press on mobile) | ❌ "It's easier to just copy it" — no, it isn't                            |
| ✅ Platform API doesn't exist on the other side (notifications, system tray)                                     | ❌ "The agent was only working on mobile" — fix the shared component       |

### 5.5 Enforcement

- **ESLint rule:** any `*.tsx` file in `apps/*/src/components/` that exports a component fails the lint.
- **CI check:** the `apps/mobile` and `apps/desktop` bundles are diffed for duplicate component names; duplicates fail the build.
- **PR review:** any PR that adds a component to an app directory (instead of `packages/ui`) is rejected.

### 5.6 App-shell — what _is_ allowed in `apps/*/src/`

- Entry point and router root (`apps/mobile/src/app/_layout.tsx`, `apps/desktop/src/app/main.tsx`)
- Platform-specific plugin registration (push notifications on mobile, deep-link handlers, Tauri commands wiring)
- Native splash screen config
- Window chrome / system tray / menubar (desktop-only concerns)

If you're not sure whether something is app-shell, ask: _"Would this make sense to render on the other platform?"_ If yes, it belongs in `packages/ui`.

---

## 6. TDD Workflow (per feature)

Every feature follows this order. Do not skip steps. Do not reorder them.

1. **Write a failing domain test.** Describe the behavior in the language of the business. Example: `"calculating a sale total applies a discount before tax"`.
2. **Implement the domain function** (pure, no IO) to make the test pass.
3. **Write a failing use-case test** using the `InMemoryRepository`. Example: `"checkout use-case persists the sale and deducts inventory"`.
4. **Implement the use-case** to make the test pass.
5. **Write the Drizzle repository** (if new) and an integration test that exercises real SQLite (in-memory SQLite via `:memory:` is fine).
6. **Write the UI component** in `packages/ui` + a Vitest + `@testing-library/react` test (under jsdom) for rendering + interaction. UI calls the use-case via a hook. See ADR-044 for the test-stack rationale.
7. **Add a Maestro E2E flow** for any new user-facing path (mobile) and/or a Playwright flow (desktop).
8. **Commit.** Pre-commit hook runs lint + affected tests.

### Coverage thresholds (CI-enforced):

- `packages/domain`: **≥ 95%** line + branch
- `packages/application`: **≥ 90%**
- `packages/data`: **≥ 80%**
- `packages/ui`: **≥ 70%**
- `apps/*`: untracked (E2E covers these)

---

## 7. Database & Deployment Modes

The app supports **four AppMode values** from a single codebase, selected via a first-run wizard (see ADR-039). **Local-only modes load zero sync code** — the sync packages are lazy-imported based on the selected mode.

### 7.1 The Four AppMode Values

```ts
export type AppMode = 'local' | 'cloud' | 'lan-server' | 'lan-client';
```

| Mode              | Use case                                                             | Storage                                     | Sync code loaded                  | External services                                                                        |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `local` (default) | One device, no sync, no account                                      | SQLite on device                            | None                              | None                                                                                     |
| `lan-server`      | This **desktop** hosts the LAN server; tablets connect to it         | SQLite on this device + bundled Rust server | None                              | None                                                                                     |
| `lan-client`      | This device joins a `lan-server` over Wi-Fi                          | SQLite on device + first-party LAN client   | `packages/sync-lan`               | None                                                                                     |
| `cloud`           | Any number of devices via cloud (also covers solo + cloud-as-backup) | SQLite on each device + remote Postgres     | `packages/sync-cloud` (PowerSync) | User-chosen Postgres backend (Supabase default, Neon / self-hosted / Turso alternatives) |

**Legacy values** (`'local-standalone'`, `'tablet-only'`, `'lan'`) are migrated to the new enum at hydration time per ADR-039 §"Decisions" item 1. New code must never write the legacy values.

### 7.2 LAN Sync — First-Party, SQLite-to-SQLite

The LAN mode does **not** use PowerSync, Supabase, or any external vendor. It is a first-party component that ships inside the Tauri desktop app.

- **Server:** a small Rust module inside `src-tauri/` that exposes an HTTP + WebSocket endpoint on the LAN. Stores data in the same SQLite file the desktop app uses.
- **Client:** `packages/sync-lan` — a lightweight JS client loaded on tablets when they pick "connect to local server". Pushes/pulls row deltas over HTTP on the LAN.
- **Conflict resolution:** last-write-wins by `updated_at`, with `device_id` tiebreak. Every row change is stamped with both.
- **Discovery:** the desktop app displays a QR code containing the LAN URL + pairing token. Tablets scan to join.
- **No internet required.** Works fully air-gapped (market stall, food truck, event booth).

### 7.3 Cloud Sync — PowerSync + Pluggable Postgres

Only loaded when the user picks Cloud mode. PowerSync is the sync engine; the Postgres backend is chosen by the user.

- **Default in wizard:** Supabase (fastest onboarding, includes Auth, free tier).
- **Alternatives:** Neon (serverless Postgres), self-hosted Postgres, or Turso (libSQL with its own embedded-replica sync — if the user picks Turso, PowerSync is not used).
- **Auth:** when using Supabase, Supabase Auth. When using Neon/self-hosted, the user supplies a JWT-issuing auth provider or we offer a minimal Clerk/Auth.js integration as Phase 2.
- The codebase depends on PowerSync and an **abstract Postgres connector** — not on Supabase specifically.

### 7.4 Database Config Wizard

Shown on first launch, re-runnable from Settings. Design principle: **intent-first language, ≤ 3 cards visible per step.** See ADR-039 for the full rationale.

**Structure** — four screens + one help modal:

| Screen                 | Question                                       | Cards                                                                                                                                                 |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Step 1 — Welcome       | ¿Cómo lo vas a usar?                           | 📱 Solo en este dispositivo · 🏢 En varios dispositivos · (links: "Ya tengo Cachink en otro dispositivo →" · "¿No estás seguro? Ayúdame a decidir →") |
| Step 2A — Solo         | ¿Dónde guardar tus datos?                      | 💾 Guardar todo en este dispositivo (`mode='local'`) · ☁️ Guardar todo en la nube (`mode='cloud'`, sign-up)                                           |
| Step 2B — Multi        | ¿Dónde se van a guardar los datos compartidos? | 🖥️ Esta computadora guarda los datos (`mode='lan-server'`, **disabled on mobile**) · ☁️ La nube guarda los datos (`mode='cloud'`, sign-up)            |
| Step 3 — Join existing | ¿Cómo está configurado el otro dispositivo?    | 🔌 Conectarme al servidor (`mode='lan-client'`) · ☁️ Iniciar sesión en mi cuenta (`mode='cloud'`, sign-in)                                            |
| Help modal             | ¿Tu negocio se parece a alguno de estos?       | 🧁 Vendedor solo · 🍞 Negocio con empleados · 🚐 Vendedor ambulante. Tapping a scenario closes the modal and pre-highlights the matching Step-1 card. |

**Runtime safety rails** (every screen that would change AppMode on a re-run):

- ✅ **Data-preserved callout** — green Callout with row counts (ventas / productos / clientes) so the user sees their data is safe before confirming.
- 🔌 **Offline blocker** — cloud sub-flows refuse to mount when `useIsOnline() === false`; suggest the local fallback.
- ⏳ **Unsynced-changes blocker** — block mode change when push HWM > 0; offer an explicit "Entiendo, cambiar de todas formas" escape hatch.

Mode is stored in SQLite (`app_config` table) under the `mode` key. Solo → LAN data import is **deferred to Phase 2** (see ARCHITECTURE.md "Deferred Decisions"); the wizard's desktop Step 2B exposes a migration-deferred screen with honest copy.

### 7.5 Schema Conventions

- Primary keys: **ULID** (`text`, lexicographically sortable, globally unique, sync-friendly). Generate with `ulid` package. **No auto-incrementing integers.**
- Timestamps: `created_at` and `updated_at` on every row, stored as ISO 8601 strings (UTC).
- Money: stored as `bigint` centavos. Column suffix `_centavos` for clarity.
- Soft deletes only — `deleted_at TIMESTAMP NULL`. Sync filters these for readers.
- Every table has a `device_id` column for conflict attribution in any synced mode.
- Every table has a `business_id` column for multi-business isolation (even though Phase 1 UI assumes one business per user).

---

## 8. Brand & Visual Identity

Cachink's look is **neobrutalist-yellow** — hard borders, hard drop shadows, no gradients, no soft shadows. This is non-negotiable: it is the app's signature.

### 8.1 Color Tokens (encode in `packages/ui/src/theme.ts`)

```ts
export const colors = {
  // Brand
  yellow: '#FFD60A', // Amarillo Vibrante — hero color
  yellowDeep: '#F5C800',
  yellowSoft: '#FFFBCC',

  // Ink
  black: '#0D0D0D', // All borders, all primary text
  ink: '#1A1A18', // Body text (slightly softer)
  white: '#FFFFFF',

  // Surfaces
  offwhite: '#F7F7F5', // App background
  gray100: '#F2F2F0',
  gray200: '#E4E4E0',
  gray400: '#9E9E9A', // Secondary text
  gray600: '#5A5A56', // Label text

  // Semantic
  green: '#00C896',
  greenSoft: '#D6FFF4', // success, ingresos
  red: '#FF4757',
  redSoft: '#FFE8EA', // danger, egresos
  blue: '#3B6FFF',
  blueSoft: '#E5ECFF', // info, nómina
  warning: '#FFB800',
  warningSoft: '#FFF8E1',
};
```

### 8.2 Typography

- **Font:** Plus Jakarta Sans (Google Fonts), weights 400, 500, 600, 700, 800, 900.
- **Headings:** weight 900, letter-spacing `-0.02em` to `-0.04em`.
- **Labels (uppercase):** weight 700, letter-spacing `0.05em`–`0.08em`, `textTransform: uppercase`.
- **Body:** weight 500–600.

### 8.3 Shape & Shadow System

- **Borders:** always `2px` or `2.5px` solid `colors.black`. Never thinner. Never dashed.
- **Border radii:** `8` / `10` / `12` / `14` / `16` / `18` / `20` / `22`. Use the scale, don't invent values.
- **Shadows:** hard drop shadows only — `3px 3px 0 colors.black` (small), `4px 4px 0 colors.black` (card), `5px 5px 0 colors.black` (hero). **No `rgba`, no blur, no soft shadows.**
- **Press interaction:** on `:active`, shift `translate(2px, 2px)` and shrink shadow to `1px 1px 0`. This tactile feel is part of the brand.

### 8.4 Component Primitives (build first in `packages/ui`)

From the mock, the following are the shared components we build before any feature work:

`Btn` (variants: primary/dark/ghost/green/danger/soft), `Input` (text/number/date/select), `Tag`, `Modal` (bottom-sheet on mobile, centered on desktop), `EmptyState`, `SectionTitle`, `Card` (white/yellow/black variants), `Kpi`, `Gauge`, `BottomTabBar`, `TopBar`.

**All primitives must pass a Storybook (or Ladle) visual regression test on both platform targets before use.**

### 8.5 Localization

- **Default and only language at launch: Spanish (es-MX).**
- Use `i18next` + `expo-localization` from day one, even if only Spanish is shipped. Never hardcode user-facing strings.
- Currency formatter: `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.
- Date formatter: `Intl.DateTimeFormat('es-MX', ...)`.

---

## 9. Domain Model (initial)

Extracted from the mock and extended with Phase 1 additions. All IDs are ULIDs. All money in centavos. Every entity also carries the audit fields: `business_id, device_id, created_at, updated_at, deleted_at` unless noted.

### Core transactional entities

- **Venta**: `id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id?, estado_pago ('pagado' | 'pendiente' | 'parcial'), producto_id, cantidad (default 1), ...audit`
  - `estado_pago` defaults to `'pagado'` for all metodos except `Crédito`, which defaults to `'pendiente'`.
  - `producto_id` required FK to a catalogue producto (ADR-048). `concepto` and `monto_centavos` auto-derived from the product. `cantidad` supports multi-unit sales.
- **Egreso**: `id, fecha, concepto, categoria, monto_centavos, proveedor?, gasto_recurrente_id?, ...audit`
- **Producto** (catálogo): `id, nombre, sku?, categoria, costo_unit_centavos, precio_venta_centavos, unidad, umbral_stock_bajo (default 3), tipo ('producto' | 'servicio'), seguir_stock, atributos (JSON {}), ...audit`
  - `tipo` discriminator: physical product vs service (ADR-046). `seguir_stock` forced false for servicios. `precio_venta_centavos` required for quick-sell. `atributos` sparse key/value map for custom attributes per business.
- **MovimientoInventario**: `id, producto_id, fecha, tipo ('entrada'|'salida'), cantidad, costo_unit_centavos, motivo, nota?, ...audit`
- **Empleado** (nómina): `id, nombre, puesto, salario_centavos, periodo, ...audit`

### Phase 1 additions (clientes, corte de día, recurrentes)

- **Cliente**: `id, nombre, telefono?, email?, nota?, ...audit`
  - Minimal on purpose. Not a CRM.
- **PagoCliente**: `id, venta_id, fecha, monto_centavos, metodo, nota?, ...audit`
  - Records partial or full payments against a Crédito venta. Sum of pagos + estado_pago drives the "Cuentas por cobrar" view.
- **CorteDeDia**: `id, fecha, device_id, efectivo_esperado_centavos, efectivo_contado_centavos, diferencia_centavos, explicacion?, cerrado_por (user role), ...audit`
  - One per device per day. `efectivo_esperado` is calculated from ventas with `metodo = 'Efectivo'` minus any cash egresos that day. `diferencia = contado - esperado`.
- **GastoRecurrente**: `id, concepto, categoria, monto_centavos, proveedor?, frecuencia ('semanal' | 'quincenal' | 'mensual'), dia_del_mes?, dia_de_la_semana?, proximo_disparo, activo, ...audit`
  - When `proximo_disparo <= today`, a "pendiente" card appears. Confirming creates an Egreso and advances `proximo_disparo`.

### Configuration

- **Business**: `id, nombre, regimen_fiscal, isr_tasa (default 0.30), logo_url?, tipo_negocio ('producto-con-stock' | 'producto-sin-stock' | 'servicio' | 'mixto'), categoria_venta_predeterminada, atributos_producto (JSON []), created_at, ...`
  - `tipo_negocio` drives UI adaptation for catalogue + stock sub-tabs (ADR-046). `atributos_producto` is an array of `AttrDef` objects (clave, label, tipo, opciones?, obligatorio).
- **AppConfig**: `key, value` (singleton table for mode, current business, notification preferences, etc.)

### Enumerations (already defined in mock)

- `VENTAS_CAT`: Producto, Servicio, Anticipo, Suscripción, Otro
- `METODOS`: Efectivo, Transferencia, Tarjeta, QR/CoDi, Crédito
- `EGRESO_CAT`: Materia Prima, Inventario, Nómina, Renta, Servicios, Publicidad, Mantenimiento, Impuestos, Logística, Otro
- `INV_CAT`: Materia Prima, Producto Terminado, Empaque, Herramienta, Insumo, Otro
- `INV_UNIDAD`: pza, kg, lt, m, caja, bolsa, rollo, par, otro
- `MOV_MOTIVO_ENT`: Compra a proveedor, Devolución de cliente, Ajuste de inventario, Producción, Otro
- `MOV_MOTIVO_SAL`: Venta, Uso en producción, Merma / daño, Muestra, Ajuste de inventario, Otro
- `TIPO_NEGOCIO`: producto-con-stock, producto-sin-stock, servicio, mixto
- `PRODUCTO_TIPO`: producto, servicio

---

## 10. Financial Calculations (NIF — Mexico)

These are **pure domain functions** in `packages/domain/src/financials/`. Every formula has a unit test.

- **Estado de Resultados (NIF B-3):** `Ingresos - Costo de Ventas = Utilidad Bruta - Gastos Operativos = Utilidad Operativa - ISR = Utilidad Neta`
  - Costo de Ventas = sum of egresos with categoria in `['Materia Prima', 'Inventario']`
  - ISR rate is **configurable per business** (`Business.isr_tasa`, default 30%). Surface as a disclaimer in the UI.
- **Balance General (NIF B-6):** simplified.
  - **Activo:** efectivo (derived from CorteDeDia running total) + inventarios (sum of stock × costo_unit) + **cuentas por cobrar (real number: sum of pending/parcial Crédito ventas minus their pagos)**.
  - **Pasivo:** cuentas por pagar (manual entries only in Phase 1; no invoice scanning).
  - **Capital:** utilidad del periodo.
- **Flujo de Efectivo (NIF B-2):** Operación + Inversión = Incremento neto en efectivo.
  - Operación now distinguishes cash cobros (metodo = Efectivo, Transferencia, Tarjeta, QR/CoDi) from Crédito ventas (which only count when a PagoCliente is recorded).
- **Indicadores:** Margen Bruto, Margen Operativo, Margen Neto, Razón de Liquidez, Rotación de Inventario, **Días promedio de cobranza** (new — based on age of pending Crédito ventas).

### Corte de Día math

- `efectivo_esperado = (sum of ventas today with metodo = 'Efectivo') - (sum of egresos today paid in efectivo) + (corte de día anterior, saldo cierre)`
- `diferencia = efectivo_contado - efectivo_esperado`. Can be positive, negative, or zero.

Every financial calc function takes plain data inputs (arrays of Venta/Egreso/PagoCliente/CorteDeDia/etc.) and returns a structured result. **No dates are computed inside these functions** — the caller pre-filters by period.

---

## 11. Hardware Integration (Phase 2 Placeholders)

Do not implement in Phase 1. Scaffold the interfaces now so Phase 2 is additive.

- **Receipt printers** (ESC/POS over Bluetooth/USB) — define `ReceiptPrinter` interface in `packages/data/src/hardware/`.
- **Barcode scanners** — `BarcodeScanner` interface. Mobile impl uses `expo-camera`; desktop impl uses WebRTC `getUserMedia` + `BarcodeDetector`. External HID scanners work via keyboard emulation — no code needed.
- **Cash drawers** — triggered through receipt printer.
- **Payment terminals** — target Mexican providers (Clip, Mercado Pago Point, Stripe Terminal LATAM). Abstract behind `PaymentTerminal` interface.

Each hardware interface lives in `packages/data/src/hardware/` with a `NoopImplementation` so Phase 1 UI can reference them without crashing. Platform-specific component variants (per §5.3) wire them up.

---

## 12. Working With This Codebase (For Agents)

When starting a session:

1. **Read the four project documents in order** (see §0): CLAUDE.md → ROADMAP.md → ARCHITECTURE.md (as needed) → README.md (if new).
2. **Check latest versions** before adding a dependency — query the npm registry via `npm view <pkg> version` or web search. Do not default to training-data versions.
3. **Follow the TDD workflow (§6)** for any feature work. Write the failing test first.
4. **Respect layer boundaries (§4.2).** If lint screams about a boundary violation, the lint is right — restructure, don't suppress.
5. **New UI components go in `packages/ui`, not in `apps/*`.** See §5. If you're tempted to create a component inside an app directory, re-read §5.6.
6. **Before building a new component, search `packages/ui` for an existing one to extend.** Duplication is a bug.
7. **If a component needs platform-specific behavior**, use the platform-extension pattern (§5.3) — three files, shared props contract, tests for each variant.
8. **Never introduce a new top-level dependency** without adding an ADR in ARCHITECTURE.md and updating §3 of this file.
9. **Never weaken a test** to make it pass. Fix the code.
10. **Never use `any`.** If TypeScript can't infer, write the type. `unknown` is acceptable at boundaries.
11. **Never store money as a float.** Centavos only.
12. **Never hardcode a user-facing string in English.** Spanish (es-MX) via i18next.
13. **Never assume the user has internet.** The app must work fully offline in Local standalone mode.

### How to update ROADMAP.md

- When you **start** a task, change its checkbox from `[ ]` to `[~]` (in progress).
- When you **complete** a task, change its checkbox to `[x]`. Keep the task text; don't rewrite it.
- When **every task in a milestone** is `[x]`, add a one-line `Completed YYYY-MM-DD` note under the milestone heading.
- When **every milestone in a phase** is complete, collapse the phase:
  1. Move the full detail of the phase (milestones + tasks) to `ROADMAP-archive.md` under a heading like `## Phase 0 — Foundation (Completed YYYY-MM-DD)`.
  2. In `ROADMAP.md`, replace the phase body with a 3-line summary under `## ✅ Phase N — Title (Completed YYYY-MM-DD)`: what shipped, exit criteria met, link to the archive.
  3. Update the "Current Status" block at the top of ROADMAP.md to point at the next phase.
- **Never delete tasks.** If a task becomes obsolete, check it as `[x]` and add a note `(skipped: reason)`.
- **Never edit CLAUDE.md** to mark progress.

### How to add an ADR to ARCHITECTURE.md

Add an ADR whenever a decision is made that would be painful to reverse later (e.g., swapping a database engine, changing a layer boundary, adopting a new sync protocol). Do **not** add ADRs for routine code choices.

1. Pick the next ADR number (N+1 from the last one).
2. Add an entry to the Index table at the top.
3. Append a full ADR section at the bottom, following the template in the file.
4. **Never rewrite or delete** an existing ADR. If a decision is superseded, add a **new** ADR that explicitly supersedes the old one, and change the old one's Status to `Superseded by ADR-NNN`.

### Commit conventions

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Every commit either passes all tests or is marked `wip:` on a feature branch.
- Every PR includes: what changed, why, how to test, any layer/contract impact.
- If a PR adds or changes an ADR, link to it in the PR description.

### When unsure

- **Ask before assuming.** Especially about UX tradeoffs, financial-calculation edge cases (NIF nuance), and sync semantics.
- **When a requirement is ambiguous, err on the side of fewer features, smaller surface, simpler UI.** That is always the Cachink answer.

---

## 13. Out of Scope (Phase 1 — explicitly rejected)

These are **actively rejected** for Phase 1. They are tempting but would violate the "less clicks, most value" principle. Any request to add these triggers a conversation, not an implementation.

### Permanently out of scope (not a fit for Cachink's vision)

- Multi-language UI beyond es-MX
- Multi-business / multi-tenant UI in a single app instance (data model supports it; UI assumes one business per user)
- Web app (beyond Tauri) — not shipped as a standalone product
- Chat / team messaging — users have WhatsApp
- Gamification / goals / streaks — conflicts with the confident, tactile brand voice

### Deferred to Phase 2+ (valid but not now)

- Full CFDI 4.0 invoicing/facturación (Phase 3 at earliest)
- Purchase orders / advanced proveedor management — the current `proveedor` field on Egreso is enough
- Multi-location / multi-sucursal
- Advanced inventory (lotes, caducidades, FIFO, multi-warehouse)
- Payroll compliance (IMSS, ISR withholding calcs) — nómina in Phase 1 is a simple fixed-salary record
- Budgeting / forecasting / cash flow projections — users need to track reality before projecting it
- CRM features beyond the minimal `Cliente` entity (no customer segments, no marketing, no loyalty)

---

## 14. Future Considerations (Phase 2+ candidates — parked, not rejected)

These are **parked** for future phases. Worth revisiting after Phase 1 ships and we have real user feedback. Listed here so they're documented but not drifting into current scope.

### Mexican-market-specific opportunities

- **CoDi QR payment flow** — Mexico's national QR payment rail. A venta with `METODO = QR/CoDi` could generate a scannable QR that, when paid by the customer's banking app, auto-confirms the sale. Potentially the single most valuable feature for the target audience.
- **Clip / Mercado Pago Point / SumUp integration** — connect to a Bluetooth card reader so `METODO = Tarjeta` actually processes the card instead of just being recorded. More important for the Mexican market than receipt-printer integration.
- **WhatsApp as a first-class share target** — elevate comprobantes, monthly reports, and payment reminders to one-tap WhatsApp shares. WhatsApp is how Mexicans run businesses.
- **Payment reminders** — for Crédito ventas past due, a one-tap "Enviar recordatorio por WhatsApp" with a pre-filled respectful message.

### Phase 2 evaluation — pick 1 or 2 based on user feedback after Phase 1 launch

When Phase 1 ships and we have real usage data, we'll revisit this list and pick the 1–2 that will move the needle most for actual users. **Do not build these speculatively.**

---

## 15. Open Questions (to resolve before Phase 1 ships)

- [ ] For Cloud mode: which auth UX do we want? Supabase Auth email/password? Magic link? Phone OTP (common in Mexico)?
- [ ] For LAN mode: do we need encryption on the LAN transport, or is the pairing token + Wi-Fi WPA2 sufficient for the threat model?
- [ ] For Cloud mode with non-Supabase backends (Neon, self-hosted): which auth provider do we recommend? Clerk? Auth.js? Supabase Auth standalone?
- [ ] How do we handle ISR regime changes mid-year? (Probably: lock regime per fiscal year.)
- [ ] Tamagui vs a lighter alternative (e.g. `react-native-unistyles` + plain web CSS for Tauri) — revisit after the component primitives are built if Tamagui setup bleeds too much time.

---

_Last updated: April 2026. This is a living document — update it when architecture decisions change, and note the change in `ARCHITECTURE.md`'s ADR log._
