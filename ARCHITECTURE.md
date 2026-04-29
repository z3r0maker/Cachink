# ARCHITECTURE.md — Cachink! Decision Log

> **Purpose:** This file is the permanent, append-only log of significant architectural decisions. Every ADR (Architecture Decision Record) captures one decision — what was chosen, what was rejected, and why. ADRs are never rewritten or deleted; if a decision is later superseded, a new ADR is added that explicitly supersedes the old one.
>
> **When to add an ADR:** any decision that would be painful to reverse later. Examples: picking a database engine, adopting a sync protocol, committing to a UI framework, changing a layer boundary, supporting a new deployment target, deprecating a package.
>
> **When NOT to add an ADR:** routine implementation choices (which hook to use, how to name a function, which Tamagui prop to pass). Those live in code and PR descriptions.

---

## ADR Format

Each ADR has this structure:

```
## ADR-NNN: Short Title
Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded by ADR-NNN | Deprecated

### Context
What problem or question prompted this decision.

### Decision
What we chose. Specific and actionable.

### Alternatives Considered
What else was on the table, and why each was rejected.

### Consequences
What becomes easier. What becomes harder. What we're committing to.

### References
Links to discussion, docs, prior art.
```

---

## Index

| ADR             | Date       | Title                                                                                                                                                  | Status                        |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| [001](#adr-001) | 2026-04-23 | Tauri 2 over Electron for desktop                                                                                                                      | Accepted                      |
| [002](#adr-002) | 2026-04-23 | Expo + React Native for mobile (tablets)                                                                                                               | Accepted                      |
| [003](#adr-003) | 2026-04-23 | Tamagui as the single cross-platform UI library                                                                                                        | Accepted                      |
| [004](#adr-004) | 2026-04-23 | Turborepo + pnpm workspaces as the monorepo tool                                                                                                       | Accepted                      |
| [005](#adr-005) | 2026-04-23 | Layered architecture with hard boundaries                                                                                                              | Accepted                      |
| [006](#adr-006) | 2026-04-23 | Local-first as the default; sync is additive                                                                                                           | Accepted                      |
| [007](#adr-007) | 2026-04-23 | LAN sync is first-party; Cloud sync uses PowerSync                                                                                                     | Accepted                      |
| [008](#adr-008) | 2026-04-23 | Supabase is Cloud-mode default, not a core dependency                                                                                                  | Accepted                      |
| [009](#adr-009) | 2026-04-23 | Money stored as bigint centavos, never float                                                                                                           | Accepted                      |
| [010](#adr-010) | 2026-04-23 | ULIDs as primary keys for all entities                                                                                                                 | Accepted                      |
| [011](#adr-011) | 2026-04-23 | Drizzle ORM over raw SQL or Prisma                                                                                                                     | Accepted                      |
| [012](#adr-012) | 2026-04-23 | Cross-platform components live in `packages/ui`, never duplicated per app                                                                              | Accepted                      |
| [013](#adr-013) | 2026-04-23 | TDD mandatory for domain and use-case layers                                                                                                           | Accepted                      |
| [014](#adr-014) | 2026-04-23 | Spanish (es-MX) is the only launch language                                                                                                            | Accepted                      |
| [015](#adr-015) | 2026-04-23 | Two documents (CLAUDE.md, ROADMAP.md) with distinct roles                                                                                              | Accepted                      |
| [016](#adr-016) | 2026-04-23 | Brand asset management: single masters at repo root, derivatives per platform                                                                          | Accepted — amended by ADR-019 |
| [017](#adr-017) | 2026-04-23 | Storybook 10 over Ladle for component docs + visual regression                                                                                         | Accepted                      |
| [018](#adr-018) | 2026-04-23 | Local Husky pre-push gate replaces GitHub Actions for Phase 0/1                                                                                        | Accepted                      |
| [019](#adr-019) | 2026-04-23 | Per-platform splash masters (amends ADR-016)                                                                                                           | Accepted                      |
| [020](#adr-020) | 2026-04-24 | Egresos sub-tab pattern: one modal, three tabs                                                                                                         | Superseded by ADR-042         |
| [021](#adr-021) | 2026-04-24 | Egreso + MovimientoInventario dual-write via a single use-case                                                                                         | Accepted                      |
| [022](#adr-022) | 2026-04-24 | Barcode scanning: expo-camera on mobile, BarcodeDetector on desktop                                                                                    | Accepted                      |
| [023](#adr-023) | 2026-04-24 | Repository interfaces extend in place with update(id, patch)                                                                                           | Accepted                      |
| [024](#adr-024) | 2026-04-24 | PagoCliente application always goes through RegistrarPagoClienteUseCase                                                                                | Accepted                      |
| [025](#adr-025) | 2026-04-24 | Export formats: exceljs for Excel, @react-pdf/renderer for PDF                                                                                         | Accepted                      |
| [026](#adr-026) | 2026-04-24 | Notifications — expo-notifications on mobile, plugin-notification on desktop                                                                           | Accepted                      |
| [027](#adr-027) | 2026-04-24 | Sentry crash reporting behind explicit local-first consent                                                                                             | Accepted                      |
| [028](#adr-028) | 2026-04-24 | Vite resolves `.web.*` before `.ts`/`.tsx` on the desktop target                                                                                       | Superseded by ADR-032         |
| [029](#adr-029) | 2026-04-24 | LAN sync wire protocol — HTTP push/pull + WebSocket events, versioned                                                                                  | Accepted                      |
| [030](#adr-030) | 2026-04-24 | SQLite triggers + `__cachink_change_log` for driver-agnostic change capture                                                                            | Accepted                      |
| [032](#adr-032) | 2026-04-24 | Vite dep scanner entries + `react-native` pre-bundle exclusion (supersedes ADR-028)                                                                    | Accepted                      |
| [033](#adr-033) | 2026-04-24 | Test infrastructure never lives in `@cachink/ui`'s runtime graph: split `@cachink/testing` barrel + move `MockRepositoryProvider`                      | Accepted                      |
| [034](#adr-034) | 2026-04-24 | UI components use web-standard ARIA props (`role`, `aria-label`, `aria-selected`, `aria-disabled`) — Tamagui 2.x dropped RN-style translation          | Accepted                      |
| [035](#adr-035) | 2026-04-24 | PowerSync Sync Streams + hybrid Cloud backend (hosted default + BYO)                                                                                   | Accepted                      |
| [036](#adr-036) | 2026-04-24 | Launch artifacts + versioning (semver floors, EAS profiles, Tauri updater)                                                                             | Accepted                      |
| [037](#adr-037) | 2026-04-24 | `@supabase/supabase-js` as a mobile dependency for Cloud-mode Auth bridge                                                                              | Accepted                      |
| [038](#adr-038) | 2026-04-25 | `react-native-get-random-values` polyfill on mobile for Hermes ULID PRNG                                                                               | Accepted                      |
| [039](#adr-039) | 2026-04-25 | Setup wizard rewrite + AppMode collapse + lan-server/lan-client split                                                                                  | Accepted                      |
| [040](#adr-040) | 2026-04-25 | Design-mock alignment — keep §1 tab contract, defer extras to Phase 2 "Más…"                                                                           | Accepted                      |
| [041](#adr-041) | 2026-04-25 | Anchored `<Combobox>` (Tamagui Popover) replaces bottom-sheet select; install icon native modules in apps                                              | Accepted                      |
| [042](#adr-042) | 2026-04-25 | Multi-step transactional flows are Stack pages, not single modals with internal tabs (supersedes ADR-020); KeyboardAvoidingView at the Modal primitive | Accepted                      |
| [043](#adr-043) | 2026-04-26 | `<Tag>` is decorative-only; tappable-chip primitive deferred to Phase 2                                                                                | Accepted                      |
| [044](#adr-044) | 2026-04-26 | Component tests run on Vitest + jsdom + react-native-web alias, not Jest + RNTL (clarifies CLAUDE.md §3)                                               | Accepted                      |
| [045](#adr-045) | 2026-04-28 | Rename `Inventario` tab → `Productos` with sub-tabs Catálogo / Stock / Movimientos (UXD-R3)                                                            | Accepted                      |
| [046](#adr-046) | 2026-04-28 | Producto.tipo + seguirStock + Business.tipoNegocio + atributosProducto schema design (UXD-R3)                                                          | Accepted                      |
| [047](#adr-047) | 2026-04-28 | Persistent AppShell via Expo Router group layout + activeTabKey resolution + scroll containment (UXD-R3)                                                | Accepted                      |
| [048](#adr-048) | 2026-04-28 | Product-only sales: `Venta.productoId` required, Ventas screen becomes inline POS                                                                      | Accepted                      |

---

## ADR-001

### Tauri 2 over Electron for desktop

**Date:** 2026-04-23
**Status:** Accepted

### Context

Cachink must ship a Windows and macOS desktop app. The two dominant choices for embedding a web-tech frontend in a native desktop shell are Electron and Tauri 2.

### Decision

Use **Tauri 2.10+** as the desktop shell.

### Alternatives Considered

- **Electron.** Mature, huge ecosystem, well-documented. Rejected because it bundles a full Chromium + Node runtime per app, producing 150–200 MB installers and using 300+ MB RAM idle. Cachink targets small businesses with modest hardware; this tax is unacceptable for our positioning.
- **Native (Swift for macOS, C# or C++ for Windows).** Rejected because it would require two separate desktop codebases and block the "write once" goal shared with the mobile app.

### Consequences

- **Easier:** small installers (~5–10 MB), fast cold start, low memory footprint, clean Rust backend for the LAN sync server (see ADR-007).
- **Harder:** smaller ecosystem than Electron; some niche npm packages that assume Node runtime won't work. WebView differences between Windows (WebView2) and macOS (WKWebView) require careful testing.
- **Committed to:** shipping a Rust toolchain in CI, maintaining a small amount of Rust for native integrations (printer, LAN server, filesystem).

### References

- Tauri 2 stable release, Oct 2024
- CLAUDE.md §3 (Tech Stack), §7.2 (LAN sync Rust module)

---

## ADR-002

### Expo + React Native for mobile (tablets)

**Date:** 2026-04-23
**Status:** Accepted

### Context

Cachink must run on iOS and Android tablets. The choices were Flutter, native (Swift + Kotlin), or React Native via Expo.

### Decision

Use **Expo SDK 55+** (React Native 0.83+, React 19.2+).

### Alternatives Considered

- **Flutter.** Excellent performance and tooling. Rejected because it wouldn't share code with the Tauri desktop app (Tauri renders web tech), forcing us into two UI codebases. The shared-UI goal dominated.
- **Native (Swift + Kotlin).** Highest quality per platform, 3× the engineering cost. Rejected for the same reason — no code sharing with desktop.
- **Bare React Native (no Expo).** Rejected because Expo's dev client, EAS Build, EAS Update, and the `expo-*` module ecosystem materially reduce ops burden for a small team.

### Consequences

- **Easier:** shared TypeScript/React code with desktop via Tamagui, fast iteration via Expo dev client, OTA updates via EAS Update, managed native build infrastructure.
- **Harder:** React Native performance ceiling is lower than native; animation-heavy screens need careful work. Some very new iOS/Android APIs trail by 3–6 months.
- **Committed to:** staying within Expo's supported module set, or using Expo's config plugins when we need custom native code.

### References

- Expo SDK 55 released Feb 25, 2026
- CLAUDE.md §3

---

## ADR-003

### Tamagui as the single cross-platform UI library

**Date:** 2026-04-23
**Status:** Accepted

### Context

Mobile (React Native) and desktop (Tauri webview) need a shared component library. Without one, we'd write every component twice — once in RN primitives, once in HTML/CSS — and they'd drift.

### Decision

Use **Tamagui 1.115+** as the single component and theme layer. All reusable components live in `packages/ui` and render on both platforms from one source.

### Alternatives Considered

- **react-native-unistyles + plain web CSS for Tauri.** Lighter setup, but requires two parallel style systems and manual synchronization of tokens.
- **Nativewind (Tailwind for RN) + Tailwind on web.** Style-only solution; components still need to be written twice.
- **Gluestack / GlueStack UI.** Similar shape to Tamagui; smaller ecosystem in 2026, less mature compiler story.
- **Separate RN and web libraries (e.g., React Native Paper + shadcn/ui).** Rejected on principle — violates the "code lives in exactly one place" rule (CLAUDE.md §2).

### Consequences

- **Easier:** one component, one theme, one source of truth for brand tokens; matching behavior on both platforms.
- **Harder:** Tamagui's compiler adds build complexity; learning curve for the token system; occasional platform-specific quirks require the platform-extension pattern (CLAUDE.md §5.3).
- **Committed to:** keeping Tamagui updated; avoiding RN-only or web-only component libraries that can't render on the other side.

### References

- CLAUDE.md §5 (Cross-Platform Component Rules)
- Tamagui docs, 2026

---

## ADR-004

### Turborepo + pnpm workspaces as the monorepo tool

**Date:** 2026-04-23
**Status:** Accepted

### Context

The project is a monorepo with 6 packages and 2 apps. We need a workspace tool for dependency management and a build orchestrator for caching/parallelization.

### Decision

Use **pnpm ≥ 9 workspaces** for package management and **Turborepo ≥ 2.3** for task orchestration.

### Alternatives Considered

- **Nx.** More powerful, more opinionated. Rejected as overkill for a 2-app, 6-package project; adds ongoing config burden.
- **Bun workspaces.** Fastest option in benchmarks, but as of early 2026 it's still fragile with Expo's Metro bundler and Tauri's Vite integration. Revisit in 12 months.
- **Lerna.** Effectively deprecated for new projects.
- **Yarn 4 workspaces.** Works, but pnpm has better disk efficiency and is the current default in the React Native / Expo ecosystem.

### Consequences

- **Easier:** fast installs (pnpm's hard-linked store), incremental builds (Turborepo cache), clean `pnpm --filter` scoping for per-package commands.
- **Harder:** pnpm's strict hoisting occasionally trips up React Native's autolinking; we may need `.npmrc` overrides.

### References

- CLAUDE.md §3, §4.1

---

## ADR-005

### Layered architecture with hard boundaries

**Date:** 2026-04-23
**Status:** Accepted

### Context

Cachink needs to support TDD at high velocity, four deployment modes, two platforms, and long-term maintainability. Without explicit boundaries, domain logic ends up tangled with React components and SQLite calls, making tests slow, flaky, and hard to write.

### Decision

Adopt a four-layer architecture: **domain → application → data → ui**, with hard boundaries enforced by `eslint-plugin-boundaries`.

- `domain`: pure business logic. No imports from React, Expo, Tauri, SQLite, or any IO.
- `application`: use-cases that orchestrate domain + repositories.
- `data`: repository interfaces + Drizzle/SQLite implementations.
- `ui`: Tamagui components that call use-cases via hooks.

Repositories are defined as interfaces and injected; every repository has both a Drizzle implementation and an in-memory implementation for testing.

### Alternatives Considered

- **Feature-sliced architecture.** Organizes by feature first, layer second. Good for very large apps; adds ceremony for a small app.
- **Clean Architecture with entity/usecase/gateway/presenter.** Inspiration for this ADR, but stricter; we borrowed the layering and relaxed the naming.
- **No enforced layers (conventional React project).** Rejected; historical evidence from countless React Native projects shows this produces untestable code over 12+ month horizons.

### Consequences

- **Easier:** domain and application layers are unit-testable in milliseconds without mounting any UI or database; coverage targets are achievable; swapping sync backends is a matter of changing one layer.
- **Harder:** more up-front files and boilerplate; contributors must learn the boundary rules.

### References

- CLAUDE.md §4 (Architecture)

---

## ADR-006

### Local-first as the default; sync is additive

**Date:** 2026-04-23
**Status:** Accepted

### Context

Cachink targets emprendedores, many of whom have unreliable internet, use market stalls, or operate in contexts where a cloud account creates friction. Early drafts of the architecture treated Supabase + PowerSync as core infrastructure. The user pushed back: "If this is meant to be local, why did we pick Supabase?"

### Decision

The app runs fully on a single device with SQLite, no network, and no account by default. Sync is layered on top as an opt-in feature selected at first-run wizard time. Local-only modes load **zero** sync code.

### Alternatives Considered

- **Cloud-first with offline mode.** The PowerSync-recommended pattern. Rejected because it makes account creation and internet effectively mandatory for onboarding.
- **Offline-first but always load the sync engine.** Rejected because it bloats local-only installs with ~200–500 KB of unused sync code and creates the false impression that sync is always on.

### Consequences

- **Easier:** the simplest possible onboarding ("Solo este dispositivo" requires zero setup), no vendor lock-in for the majority of users, works fully air-gapped.
- **Harder:** the sync packages (`packages/sync-lan`, `packages/sync-cloud`) must be lazy-loaded based on mode; the UI shell must handle the "no sync engine loaded" state gracefully.

### References

- CLAUDE.md §2 (principle 2), §7 (Database & Deployment Modes)

---

## ADR-007

### LAN sync is first-party; Cloud sync uses PowerSync

**Date:** 2026-04-23
**Status:** Accepted

### Context

Three of Cachink's four deployment modes (Local, Tablet-only, LAN) do not need a cloud vendor. For the fourth (Cloud), we need a proven sync engine. Using PowerSync for LAN would force users to install Supabase or Postgres locally — unacceptable for a tiny café's tablet setup.

### Decision

- **LAN mode:** a first-party, in-house SQLite-to-SQLite sync protocol. Server lives inside the Tauri desktop app as a Rust module. Tablets run a lightweight JS client (`packages/sync-lan`). Conflict resolution: last-write-wins by `updated_at`, with `device_id` tiebreak. Discovery via QR code pairing on the LAN.
- **Cloud mode:** PowerSync as the sync engine. Uses Sync Streams (2026 recommended approach).

### Alternatives Considered

- **PowerSync self-hosted for LAN.** Technically possible but requires bundling a Postgres instance in the desktop app, ballooning installer size and operational complexity.
- **ElectricSQL, Replicache, or other CRDT-based libraries.** Rejected for LAN mode on complexity/maturity grounds for a 3-device scenario where last-write-wins is adequate.
- **A single sync engine for both LAN and Cloud.** Rejected because there is no sync engine in 2026 that excels at both very-small-LAN and public-cloud with similar footprints.

### Consequences

- **Easier:** LAN mode is self-contained and air-gap capable; Cloud mode benefits from PowerSync's maturity; each mode's sync code is independently testable.
- **Harder:** we own and maintain the LAN sync protocol ourselves (estimated 1–2k LOC); two mental models for sync across the codebase; distinct conflict-resolution semantics to document.

### References

- CLAUDE.md §7.2 (LAN Sync), §7.3 (Cloud Sync)

---

## ADR-008

### Supabase is Cloud-mode default, not a core dependency

**Date:** 2026-04-23
**Status:** Accepted

### Context

Early drafts treated Supabase as a core piece of the stack. On review, Supabase is only needed when the user opts into Cloud mode, and even then the codebase shouldn't be hard-coupled to it.

### Decision

The codebase depends on PowerSync (for Cloud sync) and an abstract Postgres connector — not on Supabase specifically. The first-run wizard's Cloud path defaults to **Supabase** for its fast onboarding, free tier, and bundled Auth, but the user can pick **Neon**, **self-hosted Postgres**, or **Turso** (with its own sync; bypassing PowerSync). Non-Supabase backends require the user to supply a JWT-issuing auth provider.

### Alternatives Considered

- **Supabase as the only Cloud backend.** Simpler, but creates vendor lock-in for users who prefer Neon or have existing infra.
- **No default; always ask the user to pick.** Too much cognitive load for the target audience.

### Consequences

- **Easier:** flexibility to support enterprises with their own Postgres; clean separation between sync engine and backend.
- **Harder:** auth UX varies by backend; we must ship or recommend an auth library for non-Supabase users (candidates: Clerk, Auth.js, Supabase Auth standalone).

### References

- CLAUDE.md §7.3

---

## ADR-009

### Money stored as bigint centavos, never float

**Date:** 2026-04-23
**Status:** Accepted

### Context

The original mock used JS `Number` for all amounts. Floating-point arithmetic accumulates rounding errors that are unacceptable in financial software; a sequence of transactions can produce totals that differ by centavos from the correct sum.

### Decision

All monetary values are stored and computed as `bigint` centavos (integer minor units). Display formatting (`$1,234.56 MXN`) is a presentation concern handled in the UI layer only. Non-trivial math (weighted averages, proportional splits) uses **decimal.js** or **dinero.js**. `Number` is never used for money.

### Alternatives Considered

- **JS `Number` with rounding on every operation.** Error-prone, inconsistent.
- **String-based decimals.** Unnecessarily slow and verbose for the common arithmetic cases.

### Consequences

- **Easier:** financial calculations are exact; no rounding drift; Balance General figures always balance.
- **Harder:** all form inputs must convert between user strings and centavos; developers must remember the `_centavos` suffix on every column and field.

### References

- CLAUDE.md §2 (principle 8), §3 (Money & Decimal Math)

---

## ADR-010

### ULIDs as primary keys for all entities

**Date:** 2026-04-23
**Status:** Accepted

### Context

In distributed or sync'd deployments, devices must be able to create new entities offline and have them merge cleanly when sync happens. Auto-incrementing integers collide across devices; UUIDs solve collisions but destroy insertion order, hurting index locality and making "most recent" queries slower.

### Decision

Every entity uses a **ULID** (lexicographically sortable, 128-bit, collision-safe) as its primary key. Generated via the `ulid` npm package.

### Alternatives Considered

- **UUID v4.** Random; no ordering; index bloat.
- **UUID v7.** Time-sortable like ULID, emerging standard. Viable alternative; chose ULID for its established tooling and shorter string representation.
- **Snowflake IDs.** Requires coordinated machine IDs; overkill.
- **Auto-incrementing integers.** Cannot work offline across devices without server round-trips.

### Consequences

- **Easier:** offline-safe ID generation; natural sort order matches creation order; clean sync semantics.
- **Harder:** 26-character strings in every foreign key; slightly larger indexes than integer keys.

### References

- CLAUDE.md §7.5

---

## ADR-011

### Drizzle ORM over raw SQL or Prisma

**Date:** 2026-04-23
**Status:** Accepted

### Context

We need a type-safe SQL layer that works identically on React Native (expo-sqlite) and Node/Rust (Tauri + plugin-sql). Two mainstream options: Prisma and Drizzle.

### Decision

Use **Drizzle ORM ≥ 0.36** with **Drizzle Kit** for migrations.

### Alternatives Considered

- **Prisma.** Mature, great DX, but in 2026 Prisma's React Native support still relies on a separate engine binary and is heavier to set up. Overkill for SQLite and adds runtime overhead.
- **Raw better-sqlite3 / expo-sqlite queries.** No type safety; painful refactors; error-prone.
- **Kysely.** Query builder, similar to Drizzle; chose Drizzle for its schema-first migrations.

### Consequences

- **Easier:** fully-typed queries, one schema file per entity, identical API across platforms, SQL-first (no leaky abstractions).
- **Harder:** Drizzle is younger than Prisma; some advanced features (e.g., complex relations) have rougher edges.

### References

- CLAUDE.md §3

---

## ADR-012

### Cross-platform components live in `packages/ui`, never duplicated per app

**Date:** 2026-04-23
**Status:** Accepted

### Context

Without an explicit rule, agents (and humans) working in an app directory tend to create "just this mobile version" of a component, which silently drifts from the desktop version over time. This is the macro-level equivalent of God classes.

### Decision

- All reusable UI components live in `packages/ui`.
- `apps/mobile/src/` and `apps/desktop/src/` contain **only app-shell code**: navigation root, window chrome, platform bootstrap.
- Genuinely platform-specific behavior uses the **platform-extension pattern** (`Scanner.tsx` + `Scanner.native.tsx` + `Scanner.web.tsx`), not duplicated component files.
- Enforced by ESLint (`apps/*/src/components/` exporting a reusable component fails the build), by CI (bundle diff), and by PR review.

### Alternatives Considered

- **Allow per-app components with a "keep them in sync" guideline.** Rejected on principle; guidelines without enforcement decay within weeks.
- **Single-platform-first with later porting.** Explicitly rejected by the user; both platforms must be first-class from day one.

### Consequences

- **Easier:** fixing a bug fixes it everywhere; visual parity is automatic; new components ship to both platforms with one PR.
- **Harder:** contributors must learn the platform-extension pattern for legitimately platform-specific cases; occasionally a component needs refactoring to accommodate a newly-discovered platform difference.

### References

- CLAUDE.md §5

---

## ADR-013

### TDD mandatory for domain and use-case layers

**Date:** 2026-04-23
**Status:** Accepted

### Context

The user explicitly asked for a codebase that stays testable as it grows — "to avoid on every code change, Code smells, GOD Classes, etc." Financial software's correctness guarantees come primarily from tests, not from types.

### Decision

- TDD (write the failing test first) is **mandatory** for `packages/domain` and `packages/application`.
- Coverage thresholds enforced in CI: domain ≥ 95%, application ≥ 90%, data ≥ 80%, ui ≥ 70%.
- Every feature follows the 8-step workflow in CLAUDE.md §6.

### Alternatives Considered

- **Test-after.** Rejected; historically produces lower-quality tests and leaves untested code paths.
- **TDD for everything including UI.** Rejected as excessive; UI tests are better done via component tests + Maestro/Playwright E2E.

### Consequences

- **Easier:** financial correctness; safe refactoring; confident shipping.
- **Harder:** slower initial velocity for contributors unfamiliar with TDD (offset by velocity gains over the project lifetime).

### References

- CLAUDE.md §6

---

## ADR-014

### Spanish (es-MX) is the only launch language

**Date:** 2026-04-23
**Status:** Accepted

### Context

Cachink targets Mexican emprendedores. Shipping with English would signal "not for you" to the primary audience; adding more languages upfront delays launch without market evidence.

### Decision

- Default and only UI language at launch: **Spanish (es-MX)**.
- Despite single-language scope, use **i18next + expo-localization** from day one — never hardcode user-facing strings.

### Alternatives Considered

- **Hardcode Spanish strings.** Rejected; retrofitting i18n later is painful and bug-prone.
- **Ship English + Spanish.** Doubles QA surface without commercial justification in Phase 1.

### Consequences

- **Easier:** focused launch; consistent voice; zero translation coordination.
- **Harder:** i18next setup from day one feels like overhead; worth it for optionality.

### References

- CLAUDE.md §8.5, §13 (Out of Scope)

---

## ADR-015

### Two documents (CLAUDE.md, ROADMAP.md) with distinct roles

**Date:** 2026-04-23
**Status:** Accepted

### Context

The user asked whether the implementation plan should be a separate MD file that shrinks as phases complete. The question exposed a tension: **architectural rules** (which must persist) and **implementation progress** (which should shrink visibly) belong to different lifecycles.

### Decision

- **CLAUDE.md** is the immutable-by-convention architectural contract. Grows when new rules are added. Never rewritten or shrunk by agents.
- **ROADMAP.md** is the living implementation plan. Phases → milestones → tasks with checkboxes. Shrinks visually as phases archive to `ROADMAP-archive.md`.
- **ARCHITECTURE.md** (this file) is the append-only ADR log. Decisions never move or delete.
- **README.md** is the short orientation file for newcomers.

### Alternatives Considered

- **Single CLAUDE.md that shrinks as phases complete.** Rejected because it would silently delete rules when the agent deemed them "already done," causing drift.
- **One mega-file with sections for rules and plan.** Rejected for the same reason; mixing lifecycles in one file makes it impossible to safely trim.

### Consequences

- **Easier:** each file has one job; agents know exactly what to read and what they may edit.
- **Harder:** four files to maintain; contributors must learn which file a change belongs in.

### References

- CLAUDE.md §0, §2 (principle 10), §12

---

## ADR-016

### Brand asset management: single masters at repo root, derivatives per platform

**Date:** 2026-04-23
**Status:** Accepted — amended by ADR-019 (per-platform splash masters)

### Context

Cachink ships three pieces of brand artwork: an **app icon**, an **in-app logo**, and a **splash / banner**. Each has a distinct consumer:

- The **app icon** must exist inside each native platform's asset convention — Expo requires `apps/mobile/assets/icon.png` (referenced from `app.json`), Tauri requires generated files under `apps/desktop/src-tauri/icons/*` (produced by `pnpm tauri icon`).
- The **in-app logo** is rendered inside the app by a React component (`<BrandLogo />`, Phase 1A-M2). Per CLAUDE.md §5.1, all reusable UI lives in `packages/ui`.
- The **splash image** is consumed by Expo's native splash on mobile and by a Tauri splash-window HTML file on desktop.

Three candidate layouts were possible: (1) one canonical master consumed by symlinks, (2) copies per platform with no central source, (3) a single upstream directory with derivatives copied into each consumer. The choice affects how brand updates roll out, how CI verifies consistency, and how easily a contributor can find "the real logo."

### Decision

Adopt a **hub-and-spoke** model:

- **`assets/brand/`** (repo root) is the single canonical source of truth for `icon.png`, `logo.png`, and `splash.png`. Any brand change starts by replacing these files.
- **`packages/ui/src/assets/logo.png`** is the one and only in-app derivative; `<BrandLogo />` (Phase 1A) imports it from here. No app imports the logo directly; both `apps/mobile` and `apps/desktop` get it through `@cachink/ui`.
- **`apps/mobile/assets/{icon,adaptive-icon,splash}.png`** are the mobile-platform derivatives — Expo's native assets directory. Pre-staged before `pnpm create expo-app` runs.
- **`apps/desktop/src-tauri/icons/*`** is generated once post-init by `pnpm tauri icon ../../assets/brand/icon.png`; **`apps/desktop/src/shell/splash/splash.png`** is copied manually from the master. Tauri's scaffold refuses to run into a non-empty `src-tauri/`, so these derivatives cannot be pre-staged.

Splash + adaptive-icon backgrounds use the exact brand color `#FFD60A` (`colors.yellow` from CLAUDE.md §8.1) so the transition from the native launch experience into the first rendered React screen is seamless.

### Alternatives Considered

- **Symlinks from platform folders to the master.** Rejected because Expo and Tauri tooling both resolve the assets to their packaged bundles at build time; symlinks are fragile across Windows / macOS and across the `pnpm tauri icon` generation step that explicitly writes new files.
- **No central master — each app owns its own brand copy.** Rejected because it guarantees drift: a designer updates the mobile icon, forgets desktop, and we ship inconsistent art. The "code lives in exactly one place" principle (CLAUDE.md §2.3) applies to brand artwork too.
- **Store brand art inside `packages/ui` only; have apps import via Node require.** Rejected because Expo's `app.json` and Tauri's `tauri.conf.json` both require a **local path** inside the app directory — neither resolves through the Node module graph.

### Consequences

- **Easier:** one directory to update when the brand changes; the copy step is a one-liner in each app's `SETUP.md`; agents and designers know exactly where the authoritative artwork lives.
- **Harder:** brand changes require a small fan-out (three copies for mobile, the `pnpm tauri icon` generation for desktop, one copy into `packages/ui`). Documented in each `SETUP.md`; a future `pnpm brand:sync` script can automate it if pain arises.
- **Committed to:** keeping `assets/brand/` as the only place the authoritative PNGs live. Any future brand update starts there.

### References

- `assets/brand/README.md`
- `packages/ui/src/assets/README.md`
- `apps/mobile/SETUP.md` — Brand assets section
- `apps/desktop/SETUP.md` — Brand assets section
- CLAUDE.md §2.3 (code lives in one place), §5.1 (components in `packages/ui`), §8.1 (colors)

---

## ADR-017

### Storybook 10 over Ladle for component docs + visual regression

**Date:** 2026-04-23
**Status:** Accepted

### Context

CLAUDE.md §8.4 mandates that every primitive "pass a Storybook (or Ladle)
visual regression test before use." Phase 1A-M1-T01 explicitly requests this
decision as an ADR. Both tools are viable:

- **Storybook 10** — industry standard, `@storybook/react-native-web-vite`
  renders Tamagui primitives via react-native-web in a Vite-powered server,
  mature Chromatic/Playwright integrations, huge addon ecosystem.
- **Ladle 5** — ~10× faster cold start, ~1/20 install size, Storybook-
  compatible story format (most Storybook stories "just work"), Vite-native.
  Web-only.

### Decision

Use **Storybook 10.3.5+** with `@storybook/react-native-web-vite@10.3.5+` as
the framework preset, wrapped in `TamaguiProvider` via `.storybook/preview.tsx`.
Visual regression uses **Playwright 1.59+** screenshots checked into the repo
(diffs via `toHaveScreenshot`). Chromatic is parked — evaluate if/when the
team grows past one reviewer.

### Alternatives Considered

- **Ladle.** Rejected because its Vite-RN story path is unofficial and we'd
  hand-maintain the react-native-web bridge Storybook already ships. For a
  cross-platform (RN + Tauri) component library, Storybook's
  `react-native-web-vite` preset is literally what it's designed for.
- **Storybook 10 + Ladle dual.** Rejected as overkill — two doc tools
  double the maintenance surface with no user-facing benefit.
- **No component catalog; rely on the apps.** Rejected because §8.4
  mandates visual regression, and tagging component states in Maestro/
  Playwright against a running app is far more brittle than isolated
  stories.

### Consequences

- **Easier:** every primitive has a single canonical "docs page";
  designers/PMs review `pnpm --filter @cachink/ui storybook`; CI snapshots
  any visual drift before a PR merges; Chromatic available as a drop-in
  upgrade later.
- **Harder:** Storybook adds ~300 MB to the dev install and a 3–5 s cold
  start. Its RN-web preset version has to match Tamagui's react-native-web
  peer range (pinned via the Renovate "Storybook" group so they bump
  together).
- **Committed to:** keeping Storybook 10's react-native-web preset as the
  preview host. Native-device Storybook (`@storybook/react-native`) is a
  separate decision deferred to Phase 1F if physical-device story preview
  becomes required.

### References

- `packages/ui/.storybook/main.ts`, `packages/ui/.storybook/preview.tsx`
- CLAUDE.md §8.4 (primitive list + visual-regression requirement)
- ROADMAP Phase 1A-M1

---

## ADR-018

### Local Husky pre-push gate replaces GitHub Actions for Phase 0/1

**Date:** 2026-04-23
**Status:** Accepted
**Supersedes:** the CI/CD bullet previously in CLAUDE.md §3 (GitHub Actions lint → typecheck → test → coverage → visual-snapshot pipeline introduced by ROADMAP task P0-M7-T01).

### Context

The scaffold shipped with `.github/workflows/ci.yml` running lint → typecheck → test → coverage upload → Storybook visual snapshots on every push and PR. For Phase 0/1 the team is a single developer, there is no merge-to-main review requirement, and there are no external contributors. The Actions pipeline adds latency (wait for CI to turn green after every push) and recurring cost (Actions minutes, Playwright browser downloads on every run) without catching anything the local toolchain cannot. pnpm, Turborepo, Vitest, ESLint, and TypeScript are already wired and fast on the dev machine.

### Decision

Remove `.github/workflows/ci.yml` (and the now-empty `.github/` tree). Move the same fast gates into a new Husky `pre-push` hook that runs `pnpm lint && pnpm typecheck && pnpm test` before any push leaves the machine. Keep the existing `pre-commit` hook unchanged (lint-staged → prettier + eslint --fix on staged files). Coverage thresholds and Storybook visual snapshots are promoted to manual pre-milestone / pre-merge checks — the developer runs them deliberately, not on every push.

Renovate (`renovate.json`) is a separate GitHub App, not Actions, and stays — but its `automerge` flag is flipped off on all rules. With no CI gate, `automerge: true` would let a broken dep upgrade land on `main` unopposed, violating CLAUDE.md §2 rule 9 ("no silent breaking changes"). The developer now pulls Renovate PRs locally, runs the Husky gate, and merges.

### Alternatives Considered

- **Keep GitHub Actions as-is.** Rejected: cost + latency without benefit for a solo-dev phase. Re-evaluate when a second contributor joins.
- **Pre-commit hook runs the full gate.** Rejected: pre-commit must stay fast (lint-staged on changed files only) or developers will bypass it. The full gate belongs where a network round-trip used to be — at push time.
- **Local Git pre-push hook (no Husky).** Rejected: Husky already ships in devDependencies and is auto-installed by `pnpm prepare`; a hand-rolled `.git/hooks/pre-push` is not tracked in the repo and would silently skip on fresh clones.
- **CI in a different runner (Buildkite, CircleCI, self-hosted).** Rejected: same cost/latency trade-off, moved to a different dashboard.

### Consequences

- **Easier:** one-shot feedback loop — failures surface before the push leaves the machine, not 60 seconds later in a browser tab. No Actions minutes, no Playwright browser downloads on every push. Matches CLAUDE.md §2 principle 1 (fewer moving parts, simpler surface).
- **Harder:** gates only run on machines that have executed `pnpm install` / `pnpm prepare` (which installs the hooks). If a contributor ever joins, their first push only runs the gate after Husky is bootstrapped. `git push --no-verify` bypasses the gate — team convention is to never use it except to escape a genuine hook bug.
- **Committed to:**
  - Coverage thresholds from CLAUDE.md §6 (domain ≥ 95%, application ≥ 90%, data ≥ 80%, ui ≥ 70%) become a manual pre-milestone check via `pnpm test:coverage`. They are no longer CI-enforced.
  - Storybook visual-regression snapshots run manually via `pnpm --filter @cachink/ui test:visual` before any UI-primitive change is pushed. They are no longer CI-enforced.
  - Renovate PRs require a human-in-the-loop merge through the local gate. No automerge.

### Revisit when

- A second contributor joins the repo, or
- A bug slips past the local gate that a CI runner would have caught (e.g. a lint rule that only fires on Linux, or a test that depends on a specific CI env). At that point, restore `ci.yml` as a safety-net second runner rather than a blocking gate.

### References

- `.husky/pre-push` — the hook itself
- `.husky/pre-commit` — the staged-file fast path, unchanged
- CLAUDE.md §3 CI/CD — edited in the same change to reflect this ADR
- CLAUDE.md §2 rule 9 (no silent breaking changes) — why Renovate automerge is now off
- `renovate.json` — `automerge: false` on devDependency minor/patch
- ROADMAP-archive.md — P0-M7-T01 is accurate history of the prior Actions pipeline, now superseded by this ADR

---

## ADR-019

### Per-platform splash masters (amends ADR-016)

**Date:** 2026-04-23
**Status:** Accepted

### Context

ADR-016 established a single canonical `assets/brand/splash.png` master that is
copied verbatim into each platform's native splash location. That worked while
the splash was a square-ish banner, but the Phase 1 splash artwork is
genuinely platform-shaped: portrait (852×1846) on mobile so it fills a tablet
or phone screen, landscape (1568×1003) on desktop so it fills the initial
Tauri splash window (600×340 by default, scaling up on larger displays).
Forcing both platforms to share one aspect ratio produced letterboxing on
one target or the other.

### Decision

Split the single splash master into two platform-specific masters while
keeping the rest of the hub-and-spoke strategy from ADR-016 intact:

- `assets/brand/splash-mobile.png` — portrait, consumed by `apps/mobile/assets/splash.png`.
- `assets/brand/splash-desktop.png` — landscape, consumed by `apps/desktop/src/shell/splash/splash.png`.

Everything else from ADR-016 still applies: `assets/brand/` remains the single
source of truth, derivatives are copied (not symlinked), background colour is
`#FFD60A` (CLAUDE.md §8.1), and brand updates start by replacing the master.

### Alternatives Considered

- **Keep one master, letterbox.** Rejected — designers end up hand-tuning
  the letterbox padding per platform, producing the same two-asset workflow
  without the benefit of each asset being purpose-built.
- **Move the splash entirely into each app's directory, no master.**
  Rejected — violates CLAUDE.md §2.3 (code lives in exactly one place);
  drift between platforms becomes inevitable.
- **Generate per-platform splashes from a single SVG master.** Rejected
  for Phase 1 — adds tooling (SVG → PNG export) for minimal current value.
  Revisit if the set of splash variants grows beyond two.

### Consequences

- **Easier:** each platform gets an optically correct splash.
- **Harder:** brand updates now require replacing _two_ masters instead of
  one. Documented in `assets/brand/README.md` and both `SETUP.md` files.
- **Committed to:** two splash masters only. Adding a third (e.g. web)
  requires a new ADR.

### References

- ADR-016 (superseded portion: "one splash" rule; remaining hub-and-spoke
  strategy still applies)
- CLAUDE.md §2.3, §8.1
- `assets/brand/README.md`

---

## ADR-020

Date: 2026-04-24
Status: **Superseded by [ADR-042](#adr-042)** (2026-04-25). The
nested-create flows the audit surfaced (NuevoEmpleadoModal /
NuevoProductoModal triggered from inside the egreso modal) made the
single-modal-three-tab shape untenable. The Egreso flow becomes a
route stack per ADR-042; this ADR is preserved for forensic context.

**Title:** Egresos sub-tab pattern: one modal with three tabs, not three modals

### Context

Phase 1C-M4 ships a "+ Nuevo Egreso" flow that must cover three distinct
sub-types per CLAUDE.md §1:

- **Gasto** — operational expense (renta, servicios, publicidad).
- **Nómina** — employee salary payment.
- **Inventario** — inventory purchase (dual-writes a MovimientoInventario).

Each sub-type has different fields, different categoria defaulting, and
different downstream effects. The question: does the user pick the
sub-type from a preliminary menu before a modal opens, or from tabs
inside a single modal?

### Decision

One modal, three tabs at the top of the modal body. Tab state is
per-modal (resets on close). The "+ Nuevo Egreso" Btn on EgresosScreen
always opens the same modal; the user picks the sub-type after seeing
the tabs.

### Alternatives Considered

- **Three separate modals** behind a disclosure menu. Rejected — two
  taps instead of one; CLAUDE.md §2 principle 1 ("fewer clicks").
- **Three separate top-level Btns** on EgresosScreen ("+ Gasto",
  "+ Nómina", "+ Inventario"). Rejected — clutters the list header;
  Director and Operativo both see the same screen, and a Director's
  primary action is rarely the "+ Nómina" Btn.
- **Auto-detect from inputs** (e.g. if user picks a producto, route to
  Inventario tab). Rejected — brittle; the sub-type influences which
  fields are even visible, so we can't defer the choice.

### Consequences

- **Easier:** One modal to test, one state machine, one close handler.
  Tab state resets on close, matching mental model.
- **Harder:** The modal's body height varies per tab — not a real
  problem because the Modal primitive already scrolls its content.
- **Committed to:** exactly three Egreso sub-types. Adding a fourth
  (e.g. "Transferencia interna" if we ever model inter-business
  movements) requires re-evaluating whether tabs still fit.

### References

- CLAUDE.md §1 (Egresos sub-tabs)
- CLAUDE.md §2 principle 1 (UX simplicity)
- `packages/ui/src/screens/Egresos/nuevo-egreso-modal.tsx` (implements)

---

## ADR-021

Date: 2026-04-24
Status: Accepted

**Title:** Egreso + MovimientoInventario dual-write via a single use-case (no transaction)

### Context

When a user logs an inventory purchase, two rows must land:

- A `MovimientoInventario` with `tipo='entrada'` (stock goes up).
- An `Expense` with `categoria='Inventario'` and `monto = cantidad × costoUnit`
  (money goes out).

If the user forgets either one, the books disagree with the warehouse.
Our Drizzle + better-sqlite3 + Tauri-plugin-sql-proxy stack doesn't
expose a cross-driver transaction primitive (each driver surfaces its
own `db.transaction(fn)` with different semantics).

The question: how does the UI guarantee both writes?

### Decision

The UI calls **`RegistrarMovimientoInventarioUseCase.execute(...)`
exactly once**. The use-case internally creates the movement first,
then the egreso, sequentially. Both writes go through the same
repository instances — no UI-level composition.

No transaction wrapping. If the second write fails, the caller sees
an error and the movement row remains; a best-effort `compensating
delete` is a follow-up (tracked in ROADMAP-archive under P1B-M6-T03
notes). For Phase 1C local-standalone the driver is better-sqlite3 /
expo-sqlite under the same process — failure between the two writes
requires a hard crash, which also nukes any in-flight transaction.

### Alternatives Considered

- **Two separate UI hooks** — UI calls `useRegistrarMovimiento` then
  `useRegistrarEgreso` with the computed monto. Rejected: the dual-write
  invariant is a domain concern, not a UI one; moving it to the UI means
  three layers (mobile, desktop, tests) each need to remember the rule.
- **Add `db.transaction(fn)` to `CachinkDatabase`** — Rejected for
  Phase 1C: better-sqlite3 is sync, expo-sqlite's transaction API is
  async with a callback, Tauri-plugin-sql-proxy wraps via `BEGIN/COMMIT`
  SQL strings. Unifying these is a multi-commit investment we'd rather
  defer until a real double-write failure surfaces.
- **Event sourcing** (write one "inventory purchase" event; projectors
  derive movement + egreso). Over-engineered for Phase 1C.

### Consequences

- **Easier:** one call site in the UI; the invariant lives with the
  domain code that owns it.
- **Harder:** partial-failure windows exist in theory. For Phase 1C we
  accept this (local single-process; crash = OS crash).
- **Committed to:** no UI-layer composition of multi-entity writes. If
  a future flow needs cross-entity atomicity (e.g. Phase 1D LAN sync),
  we add `CachinkDatabase.transaction(fn)` then — that's the forcing
  function.

### References

- CLAUDE.md §10 (dual-write rule)
- `packages/application/src/registrar-movimiento-inventario/` (the use-case)
- ROADMAP-archive P1B-M6-T03 notes (compensating delete follow-up)

---

## ADR-022

Date: 2026-04-24
Status: Accepted

**Title:** Barcode scanning: expo-camera on mobile, `BarcodeDetector` API on desktop web

### Context

CLAUDE.md §1 requires barcode scanning inside the Inventario module
(nuevo producto, entrada/salida) with a manual-entry fallback for
devices without a camera. The platform choices:

- **Mobile:** React Native ships nothing built-in for camera + barcode
  detection. We have two credible options:
  - `expo-camera` — bundled with Expo SDK, includes a
    `CameraView` with `onBarcodeScanned`. One dependency, zero native
    rebuild if the dev client already includes it.
  - `react-native-vision-camera` — faster + more flexible (supports
    frame processors), but requires a config plugin, adds a Reanimated
    dependency, and needs a full native rebuild.

- **Desktop (Tauri webview, Chromium-based):** Shape Detection API
  exposes `BarcodeDetector` for barcode formats (QR, Code128, EAN, UPC).
  Available in Chromium 86+ since mid-2020. macOS WebKit (used by Tauri
  on macOS) does **not** implement it — the fallback there is a manual
  input field.

### Decision

- Mobile: **expo-camera**. The scanner component renders a
  `CameraView` + detection overlay; `onBarcodeScanned` fires the
  shared `onScan(code)` prop.
- Desktop: use `getUserMedia` + `BarcodeDetector` when available;
  fall back to a manual text input otherwise. Manual entry is always
  available as a secondary action (CLAUDE.md §11: manual barcode
  fallback).

### Alternatives Considered

- **react-native-vision-camera on mobile.** Rejected for Phase 1C:
  the config plugin adds friction to the dev loop and vision-camera's
  frame processors don't yield value for the simple "scan-once-to-fill"
  flows the Inventario module needs.
- **ZXing.js (pure JS barcode decoder) on both platforms.** Rejected:
  bundles ~200 kB of decoders into both apps even when platform APIs
  are available; slower on low-end Android tablets.
- **HID barcode scanner via keyboard wedge.** Already works for free —
  keyboard emulation types the code into the focused field. No code
  needed. CLAUDE.md §11 acknowledges this; we don't need a component.

### Consequences

- **Easier:** zero new native modules. Mobile dev-client rebuild is
  only required on first `expo-camera` add (not per-feature).
- **Harder:** macOS Tauri webview uses WebKit which lacks
  BarcodeDetector — on macOS desktops the scanner is manual-entry only.
  That's documented in `apps/desktop/SETUP.md` after this commit.
- **Committed to:** expo-camera's scanning API + browser-standard
  BarcodeDetector. If BarcodeDetector moves out of the Chrome stable
  track, revisit.

### References

- `packages/ui/src/components/Scanner/` (implements)
- CLAUDE.md §11 (hardware interfaces)
- CLAUDE.md §5.3 (platform-extension pattern mandate)
- https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API

---

## ADR-023

Date: 2026-04-24
Status: Accepted

**Title:** Repository interfaces extend in place with `update(id, patch)` — no separate UpdateRepository

### Context

Phase 1C-M6 introduces edit flows (cliente, producto, empleado). The
existing repositories expose `create`, `findById`, `findByX`, and
`delete`; no mutation method for partial updates.

Two shapes were on the table:

- Extend each repository interface with an `update(id, patch)` method.
- Introduce a separate `UpdateRepository<T>` per entity.

### Decision

Extend each interface in place. The Drizzle + in-memory implementations
add matching `update()` methods.

Shape: `update(id: EntityId, patch: Partial<Omit<Entity, 'id' | 'businessId' | 'deviceId' | 'createdAt'>>): Promise<Entity>`.
Patch excludes immutable audit fields; the impl bumps `updatedAt`
internally.

### Alternatives Considered

- **Separate UpdateRepository**. Rejected: doubles the repository
  surface and breaks the "one interface per entity" mental model
  already in §4.3 of CLAUDE.md.
- **Return void from update** (like `delete`). Rejected: most callers
  want the post-update row (TanStack Query optimistic-update
  invalidation) and fetching via `findById` afterwards doubles
  round-trips.
- **Patch + full `put(Entity)` replace**. Rejected: PUT-style
  replacement encourages the UI to re-send unchanged fields, which
  trips on stale-read races. Partial-patch is explicit.

### Consequences

- **Easier:** edit flows land with one method per repo instead of a
  parallel abstraction.
- **Harder:** every existing repo needs the method added (6 repos to
  be touched by the end of M6: clients, products, employees,
  businesses; sales + expenses use replace-or-soft-delete patterns and
  don't gain `update`).
- **Committed to:** partial-patch updates only. Bulk updates
  (`updateMany`) stay explicit — separate method if/when needed.

### References

- CLAUDE.md §4.3 (repository pattern)
- `packages/data/src/repositories/clients-repository.ts` (first implementation)

---

## ADR-024

Date: 2026-04-24
Status: Accepted

**Title:** PagoCliente application always goes through RegistrarPagoClienteUseCase — UI never composes the payment + state-flip pair

### Context

Recording a client payment against a Crédito venta involves three
coordinated writes:

1. Create a PagoCliente row with the payment amount + method + date.
2. Sum the existing pagos + this one, compare against venta.monto.
3. Update venta.estadoPago:
   - same as venta.monto → 'pagado'
   - less → 'parcial'
   - more (overpayment) → reject.

If any step is skipped or happens out of order, the CxC view lies.
CLAUDE.md §13 also rejects overpayments explicitly.

### Decision

The UI always calls `RegistrarPagoClienteUseCase.execute(...)` — never
calls `ClientPaymentsRepository.create` followed by
`SalesRepository.updatePaymentState` separately. The `useRegistrarPago`
hook wraps the use-case; modal `onSubmit` bubbles the full payload into
the hook and that's the only path.

### Alternatives Considered

- **Two hooks in the UI** (`useCrearPago` + `useUpdatePaymentState`).
  Rejected: forgetting step 2 silently leaves the venta in `pendiente`
  even after a full payment. Surface area too sharp.
- **Client-side overpayment check + single `create`.** Rejected: the
  use-case already does the check server-side (more trustworthy). UI
  duplicating the logic is a consistency risk the next time domain
  rules shift.
- **Optimistic UI state-flip.** Rejected for Phase 1C. If the use-case
  rejects (overpayment), we'd have to roll back the optimistic state.
  Not worth the complexity for a single-device app where the write is
  local + sub-millisecond.

### Consequences

- **Easier:** one invariant, one code path, one rollback unit.
- **Harder:** a UI-layer "batch payments" feature would have to loop
  the use-case one venta at a time (acceptable; fits the "less clicks"
  principle too — no hidden multi-select).
- **Committed to:** any new payment mutation that touches state-flip
  lives inside the use-case layer, not the UI.

### References

- `packages/application/src/registrar-pago-cliente/`
- `packages/ui/src/hooks/use-registrar-pago.ts` (implements)
- CLAUDE.md §13 (overpayment rejection)

---

## ADR-025

Date: 2026-04-24
Status: Accepted

**Title:** Export formats: `exceljs` for Excel workbooks, `@react-pdf/renderer` for PDF reports

### Context

Phase 1C-M9 requires two export surfaces:

1. **"Exportar todos los datos"** (Settings) — produces a full Excel workbook (one sheet per entity: Ventas, Egresos, Productos, Movimientos, Empleados, Clientes, Pagos, Cortes, GastosRecurrentes + a cover sheet).
2. **"Informe mensual para contador"** (Estados) — produces a one-page PDF with the NIF Estado de Resultados + ventas-por-categoría + egresos-por-categoría tables.

Both artefacts must render identically on mobile (Expo Hermes) and desktop (Tauri WebView). Rendering happens client-side (no server round-trip); the resulting ArrayBuffer/Blob is handed to the existing `share` surface from Slice 1.

### Decision

- **Excel:** use **`exceljs`** (Apache-2.0 licence, actively maintained, ≈43k GitHub stars). Loaded via dynamic import — the cold-start bundle stays lean (see Phase 4 C20 performance hardening).
- **PDF:** use **`@react-pdf/renderer`** (MIT licence, ≈14k stars). Ships a React renderer so layouts compose with our existing Card/SectionTitle-style JSX — no imperative PDF API. Also dynamically imported.

Both ship as pure JS: no native module, no Tauri plugin, no platform-specific variant.

### Alternatives Considered

- **`xlsx` / SheetJS.** Large and capable, but the pro / “ultra-high-performance” features live behind a commercial licence; the community branch has slower updates. Rejected in favour of the Apache-2.0 `exceljs`.
- **`xlsx-populate`.** Pure-JS, MIT, and reads templates — but maintenance has slowed and the API is lower-level. Rejected: `exceljs` is more idiomatic for the write-only flow we need.
- **`pdf-lib`.** Byte-level control of PDFs. Rejected: implementing our Card/SectionTitle layout in raw draw calls would duplicate the primitives we already built in Tamagui.
- **`jspdf`.** Imperative API, widely used. Rejected: the imperative flow doesn't compose with our brand tokens and primitive structure.
- **Server-side rendering.** Rejected: contradicts the local-first principle (CLAUDE.md §2, §7); export must work offline.

### Consequences

- **Easier:** one codepath per format renders on both platforms. JSX-based PDFs give us Cachink-style layouts cheaply. Excel workbooks are contract-testable via the pure `buildExcelWorkbook(dataset)` function (the use-case is format-agnostic, so the workbook-builder is fully pure).
- **Harder:** combined gzipped runtime size is ~800 KB. Mitigated via dynamic import in Slice 4 C20 — cold-start bundle unaffected until the user taps Export.
- **Committed to:** keeping `ExportDataset` (the use-case output) as the single shape both exporters consume — no per-format view models, no duplicated filters.

### References

- `packages/application/src/exportar-datos/` (produces `ExportDataset`)
- `packages/application/src/generar-informe-mensual/` (produces `InformeMensual`)
- `packages/ui/src/export/build-excel.ts` (Slice 3 C23)
- `packages/ui/src/export/build-pdf.tsx` (Slice 3 C25)
- `exceljs` — https://github.com/exceljs/exceljs
- `@react-pdf/renderer` — https://react-pdf.org/

---

## ADR-026

Date: 2026-04-24
Status: Accepted

**Title:** Notifications — `expo-notifications` on mobile, `@tauri-apps/plugin-notification` on desktop, unified behind a `NotificationScheduler` interface

### Context

P1C-M11 needs a reliable way to fire a local notification at 19:00 daily for the Director role when at least one producto has `stock ≤ umbralStockBajo`. The notification must work with the app backgrounded, not just foregrounded (an in-app banner isn't enough — Director has to see it while the tablet is idle on the counter). The app is local-first (CLAUDE.md §2, §7) — server-side push contradicts the principle.

Two runtime surfaces have to fire the notification: Expo SDK 55 on mobile (iOS + Android tablets) and Tauri 2 on desktop (WKWebView on macOS, WebView2 on Windows). The two ecosystems ship different primitives; the codebase cannot leak "we're on mobile" into feature code.

### Decision

- **Mobile:** use `expo-notifications` ≥ 0.31 (SDK 55 channel) with `SchedulableNotificationTriggerInput` + `{ hour, minute, repeats: true }`. A dev client is already mandated by CLAUDE.md §3, so the native module lands transparently.
- **Desktop:** use `@tauri-apps/plugin-notification` (npm + Cargo crate). The plugin only fires immediately or at an absolute timestamp, so the desktop `NotificationScheduler` implementation uses `setTimeout` that re-schedules itself after firing (next trigger persisted to `AppConfigRepository` so a restart doesn't miss a day).
- Both impls live behind a shared interface, `packages/ui/src/notifications/notification-scheduler.ts`:
  - `requestPermission()`
  - `scheduleDaily({ id, hour, minute, title, body, payload? })`
  - `cancelById(id)`
  - `cancelAll()`
- Platform picker is the existing `.native.tsx` / `.web.tsx` pattern (CLAUDE.md §5.3).

### Alternatives Considered

- **Server-side push (FCM / APNs via a remote server).** Rejected: contradicts the local-first principle; adds an auth dependency we don't need in Phase 1C.
- **In-app banner only.** Rejected: Director has to be notified when the app is backgrounded at EOD — an in-app banner requires the Director to open the app first, defeating the purpose.
- **Custom background-task plugin on both sides.** Rejected: both ecosystems already ship a first-class notification primitive; writing our own is maintenance surface for no gain.

### Consequences

- **Easier:** one interface surface (`NotificationScheduler`) for every future notification (payment reminders, CoDi events in Phase 2, etc.). Feature code imports the interface, not a platform-specific module.
- **Harder:** daily-schedule semantics diverge between platforms. The desktop `setTimeout` re-scheduling path requires persistence — covered by AppConfig. Users who cold-start the app outside 19:00 still see the reschedule kick in.
- **Committed to:** dev client for mobile (already mandated). A Tauri capability entry (`notification:default`) + the Cargo crate registration in `lib.rs` — forgetting either fails silently at runtime, so C9 adds a smoke check.

### References

- `packages/ui/src/notifications/` (interface + variants land in C10)
- `apps/mobile/app.config.ts` (expo-notifications plugin config)
- `apps/desktop/src-tauri/Cargo.toml` + `src-tauri/src/lib.rs` (plugin registration)
- CLAUDE.md §1 ("Stock-low notifications — Director-only; local scheduled notification")
- CLAUDE.md §3 ("`expo-notifications`" in the tech stack)

---

## ADR-027

Date: 2026-04-24
Status: Accepted

**Title:** Sentry crash reporting behind explicit local-first consent; default opt-out; PII scrubbing always on

### Context

P1C-M12-T02 needs crash reporting that survives in a local-first app without violating the user's control over their own data. The app handles financial data (ventas, egresos) and free-text fields (concepto, nota, cliente nombre) that cannot leave the device without explicit, informed consent.

Sentry is the industry-standard choice for both React Native (`@sentry/react-native`) and web/Tauri (`@sentry/browser`) — same DSN, unified dashboard, predictable pricing.

### Decision

- Install `@sentry/react-native` (mobile) + `@sentry/browser` (desktop Tauri).
- Default **opt-out**. First launch shows a dismissible consent modal ("¿Enviar reportes de errores?" with "Sí" / "No, gracias" / "Decidir después"). Answer persisted as `crashReportingEnabled: boolean | null` in AppConfig.
- Sentry is initialised only when `crashReportingEnabled === true`. Null / false → no init at all (no breadcrumbs leak).
- A shared `scrubPii(event)` pure function strips known free-text fields (`concepto`, `nombre`, `telefono`, `email`, `nota` plus every breadcrumb message) before `captureException`. The scrubber has its own unit test so additions are explicit.
- DSN is read from `EXPO_PUBLIC_SENTRY_DSN` — not baked into source. Empty / missing → init is skipped.

### Alternatives Considered

- **Always-on telemetry.** Rejected: contradicts CLAUDE.md §2 (local-first) and §13 (no silent data egress).
- **A different crash reporter (Bugsnag / Rollbar / self-hosted Glitchtip).** Rejected for Phase 1C: Sentry has the best RN + WebView story. Self-hosted Glitchtip remains a later-phase migration path — the `initSentryIfConsented` wrapper keeps the feature code Sentry-agnostic.
- **No crash reporting at all.** Rejected: without it, stability bugs found during the beta (P1F-M3) are irreproducible. The opt-in gate + PII scrubber is the correct compromise.
- **Content-scanning scrubber (regex over every string).** Rejected: slow, brittle, false positives. A field-name blocklist is accurate and explicit.

### Consequences

- **Easier:** real crash visibility once the user opts in; one codepath to init and scrub; feature code never imports Sentry directly.
- **Harder:** adding any new free-text field requires updating the blocklist. A review checklist item is added to CLAUDE.md §12.
- **Committed to:** default opt-out, PII scrubbing always on, no partial init. Changing any of those requires a superseding ADR.

### References

- `packages/ui/src/telemetry/sentry.ts` (C16)
- `packages/ui/src/telemetry/pii-scrubber.ts` (C16)
- `packages/ui/src/screens/ConsentModal/consent-modal.tsx` (C15)
- CLAUDE.md §2 (local-first), §12 (PII review checklist — to be added in C16)

---

## ADR-028

Date: 2026-04-24
Status: Superseded by ADR-032

> **Note:** This ADR was drafted based on a misdiagnosis of the root cause of the desktop dev-server startup failure. The `resolve.extensions` change it proposes breaks every barrel / intra-pair import that reached a shared sibling file (e.g., `packages/ui/src/database/database-backup.ts`), because the `.web.*` variants now capture extensionless imports they were never meant to. The correct diagnosis and fix live in ADR-032. The original text is preserved below for history.

**Title:** Vite resolves `.web.*` before `.ts`/`.tsx` on the desktop target so `.native.*` files never enter the bundle graph

### Context

`packages/ui` ships 13 platform-extension pairs (CLAUDE.md §5.3 / ADR-012 / ADR-022 / ADR-026): `Modal`, `Scanner`, `share`, `database-backup`, `database-provider`, `notification-scheduler`. The `.native.*` variants import React Native–only modules (`react-native`, `expo-camera`, `expo-file-system`, `expo-notifications`) that ship raw Flow syntax or depend on Metro's transform pipeline. esbuild — used internally by Vite for dep pre-bundling — cannot parse Flow and has no equivalent of Metro's `.native.*` extension resolution.

On the mobile side Metro prefers `<name>.native.<ext>` over `<name>.<ext>` for free. On the desktop side Tauri 2 uses plain Vite, which does **not** know `.native.*` / `.web.*` are a thing: the default `resolve.extensions` is `['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']`. Extensionless imports inside barrels like `packages/ui/src/notifications/index.ts` (`./notification-scheduler`) fall back to the shared stub, but sibling `.native.*` files still get reached by the scanner during `optimizeDeps`. The first reachable `react-native` import — `share.native.ts` — crashes the dev server before the window opens.

The fix has to work **without adding a dependency** (we don't actually render any `react-native` primitive on desktop — the goal is to exclude the `.native.*` files entirely, not to emulate them with `react-native-web`) and without requiring every barrel in `packages/ui` to know which platform is consuming it.

### Decision

Add `resolve.extensions` to `apps/desktop/vite.config.ts` with `.web.*` variants ordered **before** the default `.ts`/`.tsx`/`.jsx`/`.js`:

```ts
resolve: {
  extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js',
               '.tsx', '.ts', '.jsx', '.js', '.json', '.mjs'],
  dedupe: ['react', 'react-dom', '@tamagui/core', '@tamagui/web'],
}
```

Effect:

- `import './foo'` resolves to `./foo.web.tsx` if it exists, else `./foo.tsx`.
- `.native.*` files are never reached — Vite doesn't try them for any import path.
- Mirrors Metro's built-in `.native.*` preference, so mobile and desktop use the **same** barrel code with zero branching in feature files.
- No new dependency; only Vite config.

Any future desktop apps target (web-standalone, if ever introduced) must inherit the same ordering.

### Alternatives Considered

- **Install `react-native-web` and alias `react-native` → `react-native-web`.** Rejected: solves the immediate parse error but still drags the `.native.*` files (and their `expo-*` imports that have no web shim) into the desktop dep graph. Also adds a top-level dependency the codebase does not otherwise need — subject to CLAUDE.md §3 gatekeeping.
- **Require every barrel to use explicit `./foo.web` imports (like `share/index.ts` already does).** Rejected: leaks platform awareness into every barrel, defeats the point of the `.native.*` / `.web.*` pattern, and breaks mobile because Metro would then miss the `.native.*` picker.
- **Adopt `@tamagui/vite-plugin` or `vite-plugin-react-native-web`.** Rejected for Phase 0: larger plugin + dependency surface, and still implicitly requires the `.web.*` ordering we're now configuring directly. Can be layered on later if Tamagui compile-time optimizations become valuable.

### Consequences

- **Easier:** adding a new platform-extension pair "just works" on both platforms with a single barrel. Feature code stays platform-agnostic (CLAUDE.md §5.3).
- **Harder:** any shared module that accidentally co-exists in `<name>.web.*` AND `<name>.tsx` forms will silently prefer the `.web.*` — contributors need to know the pattern. Added to CLAUDE.md §5.3 reference list.
- **Committed to:** `.web.*` is a first-class extension on the desktop target. Vitest (via `vite.config.ts` merging) inherits this too — tests in `apps/desktop` will resolve the web variants, matching production.

### References

- `apps/desktop/vite.config.ts` (the extension list)
- `packages/ui/src/{share,notifications,database,components/Modal,components/Scanner}/` (13 `.web.*` / `.native.*` pairs)
- CLAUDE.md §5.3 (platform-extension pattern)
- ADR-012 (shared components in `packages/ui`), ADR-022 (barcode scanner per-platform), ADR-026 (notifications per-platform)

---

## ADR-029

Date: 2026-04-24
Status: Accepted

**Title:** LAN sync wire protocol — HTTP push/pull + WebSocket events, versioned via `X-Cachink-Protocol`

### Context

Phase 1D (CLAUDE.md §7.2) ships a first-party LAN sync mode: one Tauri desktop app acts as the LAN server, up to three Expo tablets connect over Wi-Fi, SQLite-to-SQLite. No external vendor, no internet. The protocol must:

1. Encode row-level deltas across the 10 synced tables (everything except `app_config`) with **no floats for money** (CLAUDE.md §2 principle 8) and **ULID primary keys** (ADR-010).
2. Resolve concurrent edits **deterministically** so two devices converge without operator intervention (CLAUDE.md §7.2 mandates "last-write-wins by `updated_at` with `device_id` tiebreak").
3. Survive disconnects: a tablet that records three ventas on the bus must push them when Wi-Fi returns.
4. Be **versionable** — Cachink's protocol will evolve (adding new tables, adding compression, rotating pairing). An unversioned protocol is a future-maintenance trap.
5. Be implementable by a tiny Rust axum server on the host (CLAUDE.md §3 desktop stack) and a JS client that runs identically on React Native + web/Tauri.

### Decision

**Transport:**

- **HTTP/1.1** for push, pull, and pair — stateless, easy to retry, Bearer auth.
- **WebSocket** for real-time "something changed" pings — server fans out a tiny `{type:'change', serverSeq}` frame so clients can pull immediately instead of polling.
- All responses include `X-Cachink-Protocol: 1`. Clients send the same header. Unknown versions return **HTTP 426 Upgrade Required** with a body `{protocolRequired: 1, protocolReceived: "<n>"}`.

**Endpoints (all under `/api/v1`):**

| Method | Path                               | Auth                                                                  | Request                            | Response                                                                             |
| ------ | ---------------------------------- | --------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `POST` | `/pair`                            | none                                                                  | `{pairingToken, deviceId}`         | `200 {accessToken, businessId, serverId}` / `401` / `410 Gone` (token expired)       |
| `POST` | `/sync/push`                       | Bearer                                                                | `{deltas: Delta[]}` (max 500 rows) | `200 {accepted: number, rejected: RejectedDelta[], lastServerSeq: number}`           |
| `GET`  | `/sync/pull?since=<n>&limit=<=500` | Bearer                                                                | —                                  | `200 {deltas: Delta[], nextSince: number, hasMore: boolean}`                         |
| `WS`   | `/sync/events`                     | Bearer (query param `?token=…` because WS browsers can't set headers) | —                                  | server push `{type:'change', serverSeq}` + heartbeats `{type:'ping', ts}` every 20 s |

**Delta shape** (one row per synced table, all Zod-validated at both ends — `packages/sync-lan/src/protocol`):

```ts
type Delta = {
  table:
    | 'sales'
    | 'expenses'
    | 'products'
    | 'inventory_movements'
    | 'employees'
    | 'clients'
    | 'client_payments'
    | 'day_closes'
    | 'recurring_expenses'
    | 'businesses';
  op: 'insert' | 'update'; // soft-delete is an update (deleted_at!=null)
  rowId: string; // ULID of the affected row
  row: Record<string, unknown>; // entire row post-change, table-specific Zod schema
  rowUpdatedAt: string; // ISO 8601, used by LWW
  rowDeviceId: string; // tiebreak
};
```

- Money fields (`*_centavos`) serialise as decimal strings (e.g. `"12345"`) — preserves bigint on both sides; never transit as JSON numbers.
- Dates/timestamps serialise as ISO 8601 strings (matches the `text` column convention).
- `row` is the **entire row** (not a column-level patch). Simplifies merge; small per row; Phase 1 row counts are modest.

**Conflict resolution (LWW + device tiebreak):** server executes push as a single SQL statement per row:

```sql
INSERT INTO <table> (...) VALUES (...)
ON CONFLICT(id) DO UPDATE SET ...
  WHERE excluded.updated_at > <table>.updated_at
     OR (excluded.updated_at = <table>.updated_at
         AND excluded.device_id < <table>.device_id);
```

- When the `WHERE` clause rejects the update, the delta appears in `rejected[]` with reason `"stale"`. The client never retries a `"stale"` rejection.
- Deletes are encoded as updates that set `deleted_at`; they obey the same LWW rule.

**Pairing:**

- Desktop host generates a 128-bit `pairingToken` (base64url), embeds it in a QR alongside the LAN URL (e.g. `cachink-lan://192.168.1.5:43812?token=…`).
- Client posts `{pairingToken, deviceId}` → server issues a long-lived per-device `accessToken` (also 128-bit, base64url).
- Tokens are stored server-side in `src-tauri/lan_sync_state.json` (device_id → token map) and client-side in `__cachink_sync_state` (scope=`auth`).
- Pairing tokens expire 10 minutes after generation; access tokens have no expiry (revoked explicitly via "Desemparejar este dispositivo" in Settings).

**Server sequence (`serverSeq`):** monotonic `INTEGER PRIMARY KEY AUTOINCREMENT` from `__cachink_change_log` (ADR-030). Clients track the highest `serverSeq` they've pulled in `__cachink_sync_state.serverPullHwm`.

**Heartbeat + reconnect:** WS idle close at 90 s server-side. Client backoff `min(2^n, 60)` s with 10% jitter. Push queue never blocks on WS — WS is a wake-up signal, pull is the source of truth.

### Alternatives Considered

- **gRPC.** Rejected — adds a code-gen toolchain on both Rust and TypeScript, fights RN bundlers, and the row counts don't justify binary framing.
- **CRDT / automerge.** Rejected — CLAUDE.md §7.2 explicitly mandates LWW; CRDTs for financial rows are overkill and their conflict semantics are less intuitive than "newest write wins, tiebreak on device_id" for accounting data.
- **Unversioned protocol.** Rejected — evolving the format (new tables, compression, schema bumps) without a version header means flag-day upgrades.
- **Column-level patches.** Rejected — Phase 1 rows are small, full-row replacement is simpler, and LWW-at-row is the mental model CLAUDE.md already commits to.
- **Polling-only, no WebSocket.** Rejected — 2 s polling works, but the WS wake-up collapses cross-device latency from "up to 2 s" to "sub-second" at near-zero cost.

### Consequences

- **Easier:** two transports, one per purpose (HTTP for bulk transfer, WS for wake-up). Reviewable in under 30 minutes. Testable per-endpoint with `msw` + a `better-sqlite3` harness.
- **Easier:** adding a new synced table is one Zod schema + one trigger + one union member on `Delta.table`.
- **Harder:** schema evolution still requires coordinated client + server rollouts. Mitigated by `X-Cachink-Protocol`.
- **Committed to:** ULIDs as row keys; `updated_at` + `device_id` on every synced row (already mandated by CLAUDE.md §7.5); money transiting as decimal strings; a server-authoritative `serverSeq` counter.
- **Out of scope:** end-to-end encryption on the LAN transport. CLAUDE.md §15 Q2 flags this as an open question; threat model for Phase 1 is "same Wi-Fi, same business, same physical premises" — pairing token + WPA2 is deemed sufficient.

### References

- CLAUDE.md §7.2 (LAN sync spec)
- CLAUDE.md §9 (10 synced tables)
- ADR-010 (ULIDs), ADR-007 (first-party LAN), ADR-009 (bigint money)
- ADR-030 (change-log triggers that produce the `Delta` stream)
- `packages/sync-lan/src/protocol/` (Zod types land in C4)

---

## ADR-030

Date: 2026-04-24
Status: Accepted

**Title:** SQLite triggers + `__cachink_change_log` for driver-agnostic change capture

### Context

The LAN sync protocol (ADR-029) and the PowerSync integration (ADR-031) both need to answer the same question: **"what rows changed since sequence N?"** The codebase runs the same Drizzle ORM across three SQLite drivers (expo-sqlite on mobile, @tauri-apps/plugin-sql + rusqlite on desktop, better-sqlite3 in tests), so any change-capture mechanism must work identically on all three.

Three approaches exist:

1. **Application-layer:** the Drizzle repository wrappers emit events. Rejected — every new repository method is a chance to forget to emit, and raw SQL migrations bypass it entirely.
2. **Read-your-own-writes diffs:** on sync, scan the base table for rows with `updated_at > lastSync`. Works, but requires a full-table scan per pull and can't distinguish "this row was inserted at T" from "this row was updated at T" without joins.
3. **SQLite triggers + a change-log table:** a `CREATE TRIGGER ... AFTER INSERT/UPDATE` on every synced table writes a row into `__cachink_change_log`. Sync clients paginate the log by its autoincrementing `id`.

Option 3 is the only approach that is simultaneously (a) driver-agnostic (triggers are a SQLite built-in, no driver surface needed), (b) independent of the ORM (raw SQL writes are captured), (c) paginatable without table scans, and (d) cheap (one extra write per synced row change).

### Decision

- Add a table `__cachink_change_log`:
  ```sql
  CREATE TABLE __cachink_change_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name    TEXT NOT NULL,
    row_id        TEXT NOT NULL,
    row_updated_at TEXT NOT NULL,
    row_device_id TEXT NOT NULL,
    op            TEXT NOT NULL CHECK (op IN ('insert', 'update')),
    captured_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX idx_cachink_change_log_id ON __cachink_change_log (id);
  ```
- Add `AFTER INSERT` + `AFTER UPDATE` triggers to each of the 10 synced tables (everything except `app_config`):
  ```sql
  CREATE TRIGGER trg_sales_ai AFTER INSERT ON sales
  BEGIN
    INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
    VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
  END;
  CREATE TRIGGER trg_sales_au AFTER UPDATE ON sales
  BEGIN
    INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
    VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'update');
  END;
  ```
- The log is an **index into the entity tables**, not a payload store. Sync clients `JOIN` back to the entity table to read the current row. This keeps the log small and avoids double-write cost.
- Soft deletes (`deleted_at` set to a timestamp) fire the `AFTER UPDATE` trigger — they sync as `op='update'` with a non-null `deleted_at`. Matches CLAUDE.md §7.5 ("Soft deletes only").
- `DELETE` has no trigger — we never hard-delete synced rows. If a `DELETE` ever bypasses the soft-delete convention, it stays **uncaptured** and flags a bug in review.
- A sibling table `__cachink_sync_state (scope TEXT PRIMARY KEY, value TEXT)` holds per-scope sync bookkeeping: `localPushHwm` (highest change-log id pushed), `serverPullHwm` (highest serverSeq pulled), `serverUrl`, `accessToken`, `businessId`, last pair timestamp.
- Triggers are created in Drizzle-Kit migration **0001** (C3). Pure SQL; no driver quirks.

### Alternatives Considered

- **Temporal tables / SQLite versioning extensions.** Rejected — not available across all three drivers, require native extensions.
- **Change Data Capture via the WAL.** Rejected — parsing the WAL across three drivers is unreliable and the drivers differ in how they expose journal state.
- **Drizzle hooks.** Rejected per context — only works if every write goes through Drizzle, and we occasionally run raw migrations + bulk imports.
- **Larger log with full row payloads.** Rejected — doubles every synced write's I/O and makes log compaction painful. The join-back approach costs one extra lookup per change at sync time, which is negligible.

### Consequences

- **Easier:** sync clients paginate `__cachink_change_log` by autoinc `id` — no full-table scans, no `updated_at` cursors that lose resolution under clock skew.
- **Easier:** cross-driver parity — triggers behave identically on expo-sqlite, rusqlite, and better-sqlite3.
- **Harder:** every new synced table (Phase 2+) must add a matching pair of triggers. CLAUDE.md §12 gains a checklist item: _"New synced table? Add `AFTER INSERT|UPDATE` triggers in the next migration."_
- **Harder:** bulk imports generate one change-log row per imported row. Mitigated by batching in sync clients (max 500 rows per `POST /sync/push`).
- **Committed to:** `__cachink_*` as the reserved prefix for sync infrastructure tables; triggers that skip any `__cachink_*` table implicitly (they only target the 10 business tables); log rows never mutated after insertion.

### References

- ADR-029 (consumer of the log)
- ADR-031 (PowerSync consumes the same log via its upload queue adapter)
- `packages/data/drizzle/migrations/0001_*` (C3)
- CLAUDE.md §7.5 (audit columns + soft deletes), §12 (review checklist)

---

## ADR-032

Date: 2026-04-24
Status: Accepted (supersedes ADR-028)

**Title:** Vite dep scanner restricted to `index.html`; `react-native` excluded from pre-bundle on the desktop target

### Context

Bringing up `@cachink/desktop` on macOS via `tauri dev` crashed before the window could render. The surface error was Vite's esbuild dep-optimizer choking on `react-native/index.js:27` — the `import typeof * as ReactNativePublicAPI from './index.js.flow';` line. esbuild cannot parse Flow syntax; only Metro's Babel pipeline can.

Initial hypothesis (ADR-028): the offending file was `share.native.ts` being resolved by Vite during module resolution. Fix: change `resolve.extensions` so `.web.*` outranks `.ts`/`.tsx`, pushing Vite away from `.native.*` siblings. **That hypothesis was wrong.** The fix made Vite dev start, but the WebView rendered a blank page with `SyntaxError: Importing binding name 'formatBackupFilename' is not found.` — because the new `extensions` ordering now captured **every extensionless import** that reached a shared sibling file alongside a `.web.*` variant, including the barrel re-exports in `packages/ui/src/database/index.ts`, `share/index.ts`, `notifications/index.ts`, and the intra-pair `import from './<shared>'` in each `.web.*` / `.native.*` implementation.

Correct diagnosis: the failure was never about **module resolution** at the bundling step. It happened at Vite's **dep-discovery scanner** stage. Vite's `optimizeDeps` scanner walks every `.ts`/`.tsx` file it can reach through `server.fs.allow` (the workspace root in our monorepo) to discover bare imports and pre-bundle their packages. That scan touches `share.native.ts` as a project file (not as a runtime dependency), sees its `import { Share } from 'react-native';`, and tries to pre-bundle `react-native`. esbuild then parses `react-native/index.js` and crashes on the Flow syntax.

The file is never **runtime-reachable** on desktop — `share/index.ts` imports `./share.web` explicitly, so the bundle graph already excludes the `.native.*` variant. Only the pre-scan touches it. The fix therefore belongs in `optimizeDeps`, not `resolve`.

### Decision

In `apps/desktop/vite.config.ts`, add two narrowly-scoped `optimizeDeps` options:

```ts
optimizeDeps: {
  // Restrict the dep-discovery scanner to the HTML entry only.
  // Without this, the scanner walks every .ts/.tsx under
  // server.fs.allow (the workspace root), reading .native.*
  // files for bare-import discovery and tripping over Flow syntax
  // in `react-native`.
  entries: ['index.html'],

  // Belt-and-braces: even if a future scanner pass finds `react-native`
  // as a bare specifier, do not attempt to pre-bundle it. The desktop
  // runtime never renders a react-native primitive — feature code
  // routes through the `.web.*` platform variants instead.
  exclude: ['react-native'],

  // ... existing esbuildOptions.define entries unchanged ...
},
```

Do **not** touch `resolve.extensions` — the default (`.mjs`, `.js`, `.mts`, `.ts`, `.jsx`, `.tsx`, `.json`) is correct for the desktop target. Extensionless imports continue to resolve to `.ts`/`.tsx` files as they always did; the platform-extension pattern keeps working because the explicit `.web.*` imports in barrels (e.g., `import { shareComprobante } from './share.web'`) handle platform dispatch.

Metro on mobile is unaffected — Metro's `.native.*` preference is built-in.

### Alternatives Considered

- **Change `resolve.extensions` to prefer `.web.*`** (the path ADR-028 took). Rejected: breaks every extensionless import that targets a shared sibling file co-located with `.web.*` variants. Symptom: runtime `SyntaxError: Importing binding name 'X' is not found.` where `X` lives on the shared file but the `.web.*` now wins resolution. Fixing every call site requires `.js`/`.ts` explicit extensions in 10+ places, which `allowImportingTsExtensions` does not permit under the current `composite: true` emit config for `packages/ui`.
- **Install `react-native-web` and alias `react-native` → `react-native-web`.** Rejected: adds a top-level dependency (subject to CLAUDE.md §3 gatekeeping), drags the scanner into the `react-native-web` dep graph on top of everything, and solves a problem the runtime doesn't have (nothing on desktop imports `react-native` at runtime).
- **Rename shared companion files (e.g., `share.ts` → `share-shared.ts`).** Rejected: 5 file renames plus barrel and consumer updates for a symptom that can be fixed in Vite config alone.
- **Adopt `@tamagui/vite-plugin` or `vite-plugin-react-native-web`.** Rejected for Phase 0: larger plugin + dependency surface; the targeted two-line `optimizeDeps` change is sufficient.

### Consequences

- **Easier:** the platform-extension pattern (CLAUDE.md §5.3) continues to work with the default Vite resolver. Barrel files and intra-pair imports stay clean — no `.js` explicit extensions, no file renames, no sibling-path awareness.
- **Easier:** the dep scanner is now deterministic and narrow. Adding a new `.native.*` file in `packages/ui` does not risk re-breaking the desktop dev server.
- **Harder:** if a future desktop feature legitimately imports a bare specifier from a file not transitively reachable from `index.html`, `optimizeDeps.entries` must be extended to include that entry. The list is additive; the cost is one config edit per new entry file.
- **Committed to:** never introducing a runtime `import from 'react-native'` on the desktop target. If that ever changes, the `exclude` entry comes off and a proper web shim (e.g., `react-native-web`) lands with a new ADR.

### References

- `apps/desktop/vite.config.ts` (the `optimizeDeps.entries` + `exclude` entries)
- `packages/ui/src/share/share.native.ts` (the file whose `import from 'react-native'` the scanner was tripping over)
- Vite docs — [Dep Pre-Bundling — `optimizeDeps.entries`](https://vite.dev/config/dep-optimization-options.html#optimizedeps-entries)
- Vite docs — [Dep Pre-Bundling — `optimizeDeps.exclude`](https://vite.dev/config/dep-optimization-options.html#optimizedeps-exclude)
- Supersedes ADR-028
- CLAUDE.md §5.3 (platform-extension pattern), §12 (ask-before-assuming applies to diagnostic leaps)

---

## ADR-033

Date: 2026-04-24
Status: Accepted

**Title:** Test infrastructure never lives in `@cachink/ui`'s runtime graph — split the `@cachink/testing` barrel and move `MockRepositoryProvider` out of `@cachink/ui`

### Context

Bringing up the desktop dev server exposed a silent architectural drift: `apps/desktop/src/app/main.tsx` imports `AppProviders` from `@cachink/ui`, which transitively loaded **Vitest** in the runtime WebView. Symptom: `Error: Vitest failed to access its internal state.` at boot.

Trace:

```
apps/desktop/src/app/main.tsx
  └─ @cachink/ui (src/index.ts)
      └─ ./app/index.ts
          └─ ./mock-repository-provider.tsx       ← test-only helper
              └─ @cachink/testing                 (src/index.ts barrel)
                  └─ export * from './contract/index.js'
                      └─ ./contract/sales-repository.ts
                          └─ import { describe, it, expect, beforeEach } from 'vitest'
```

Two independent bad patterns fed the same outcome:

1. **`@cachink/testing/src/index.ts` re-exported its contract-test factories.** Contract factories use `vitest` top-level imports. Vite in dev does not tree-shake; `export *` barrels execute every module they reference at load time. Any consumer that touched the main barrel — even to grab a fixture or an in-memory repo — pulled the contract factories, and with them, `vitest`.
2. **`MockRepositoryProvider` — test-only code — lived in `packages/ui/src/app/` and was re-exported from `@cachink/ui`'s main barrel.** CLAUDE.md §5 scopes `packages/ui` to production-shared components. The mock provider is a test harness; it had no business sitting on the runtime path of both apps.

Either issue alone was recoverable via a Vite config workaround (stub `vitest`, exclude from optimizeDeps). Together they represent a layering violation that a workaround would paper over, not fix. The runtime bundle of the app should contain zero test infrastructure regardless of how the bundler is configured.

### Decision

**Split the `@cachink/testing` public surface into two entry points.**

- **`@cachink/testing` (main, `./src/index.ts`) — runtime-safe.** Exports:
  - 11 `InMemory*Repository` classes (used by `MockRepositoryProvider` and by in-memory test specs).
  - `fixtures/*` factories.
  - `TEST_DEVICE_ID`.
  - **`MockRepositoryProvider`** (moved here — see below).
    No import of `vitest` anywhere reachable from this barrel.
- **`@cachink/testing/contract` (subpath, `./src/contract/index.ts`) — vitest-runtime-only.** Exports the 11 `describe*RepositoryContract(impl, makeRepo)` factories. These files legitimately import `vitest` at the top level. Only test specs (`*.test.ts`) may consume this subpath.

`package.json` enforces the split via an explicit `"exports"` map:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./contract": "./src/contract/index.ts"
  }
}
```

**Move `MockRepositoryProvider` from `packages/ui/src/app/` to `packages/testing/src/`.**

- The component is a React wrapper around `@cachink/ui`'s `RepositoryProvider` that seeds default in-memory repositories for component tests.
- Lives in `packages/testing/src/mock-repository-provider.tsx`.
- `@cachink/testing` gains `@cachink/ui` as a regular dependency (for `RepositoryProvider` and the `Repositories` type) and `react` as a peer dependency. The reverse dep — `@cachink/ui → @cachink/testing` — stays in `devDependencies` only, used by `packages/ui/tests/*` for component tests.
- The 10 existing test files in `packages/ui/tests/{app,screens,hooks}/` that used `MockRepositoryProvider` now import it from `@cachink/testing`.

**The dep graph after the refactor:**

```
@cachink/ui  (runtime)    ──no test imports──▶  (nothing)
@cachink/ui  (tests only)  ──────────────────▶  @cachink/testing
@cachink/testing (runtime) ──────────────────▶  @cachink/ui (RepositoryProvider)
@cachink/testing/contract  ──────────────────▶  vitest  (only when consumed by spec files)
```

One-way, test-layer-only cycle. Runtime of either app never touches vitest.

### Alternatives Considered

- **Keep everything in place; alias `vitest` to a runtime stub in `apps/desktop/vite.config.ts`.** Rejected: stubs the symptom, keeps the layering violation. Also requires a parallel fix on the mobile Metro side when that app bootstraps.
- **Keep `MockRepositoryProvider` in `@cachink/ui` but gate its export behind a `/testing` subpath (e.g., `@cachink/ui/testing`).** Rejected: preserves the conceptual leak — test code in the UI package — and requires a new subpath entry either way. Putting it in `@cachink/testing` aligns the file with its semantic home (CLAUDE.md §5.6 guidance: _"Would this make sense to render on the other platform?"_ — a mock provider is a test concern, not a UI concern).
- **Rename the contract factories' module and keep the main barrel intact.** Rejected: renaming alone does not prevent the barrel from pulling them in. The fix is structural, not naming.
- **Dynamic `import()` of contract factories inside the contract files.** Rejected: breaks the ergonomic `describeXRepositoryContract(…)` spec pattern and still requires the test file to await something before describing.

### Consequences

- **Easier:** any consumer of `@cachink/testing`'s main barrel can import from it freely without pulling vitest. Future additions to `@cachink/testing/src/` that want to be runtime-safe go in the main barrel; anything that imports `vitest` goes under `src/contract/`.
- **Easier:** `@cachink/ui`'s `src/` has no test infrastructure. Any PR that adds a test-only helper to `packages/ui/src/` is visibly misplaced and can be rejected at review time.
- **Harder:** 22 consumer tests (11 in `packages/testing/tests/`, 11 in `packages/data/tests/drizzle/`) had to split their import block into two lines — `InMemory*` / `TEST_DEVICE_ID` from the main barrel, `describe*RepositoryContract` from `…/contract/index.js`. Mechanical; done in this refactor.
- **Harder:** `packages/testing` now compiles `.tsx` (it did not before). Its `tsconfig.json` widens `include` + adds `jsx: react-jsx` + `lib: […, DOM]` + a project reference to `../ui`. Future additions must still respect the no-vitest-in-main-barrel rule — a review checklist line belongs in CLAUDE.md §12 when this refactor lands.
- **Committed to:** `@cachink/testing` **main barrel is runtime-safe, forever**. Any future contribution that adds a `vitest` import (or any test-runner import) to a file reachable from `src/index.ts` fails review. `@cachink/testing/contract` is the designated home for anything that needs a runtime test framework.

### References

- `packages/testing/src/index.ts` (runtime-safe barrel)
- `packages/testing/src/contract/index.ts` (vitest-only subpath)
- `packages/testing/src/mock-repository-provider.tsx` (moved from `packages/ui/src/app/`)
- `packages/testing/package.json` (exports map + `@cachink/ui` dep + `react` peerDep)
- `packages/ui/src/app/index.ts` (export removed; replaced with a line of inline prose pointing to this ADR)
- 22 consumer tests in `packages/testing/tests/in-memory-*.test.ts` and `packages/data/tests/drizzle/*.test.ts` (import-path splits)
- 10 consumer tests in `packages/ui/tests/{app,screens,hooks}/*.test.tsx` (moved to `@cachink/testing`)
- CLAUDE.md §4.2 (layer boundaries), §5 (shared-component rules), §5.6 (what's allowed in `apps/*`)
- ADR-012 (shared components live in `packages/ui`)

---

## ADR-034

Date: 2026-04-24
Status: Accepted

**Title:** `@cachink/ui` components use web-standard ARIA props — Tamagui 2.x removed the RN-style a11y translation layer

### Context

Bringing up the desktop dev server (Tauri + Vite + Tamagui 2.0.0-rc.41) surfaced a cluster of React DevTools warnings at runtime:

```
React does not recognize the `accessibilityRole` prop on a DOM element. …
React does not recognize the `accessibilityLabel` prop on a DOM element. …
React does not recognize the `accessibilityState` prop on a DOM element. …
```

Four `@cachink/ui` primitives (`Btn`, `Card`, `TopBar`, `BottomTabBar/tab-item`) were passing React Native–style accessibility props directly to Tamagui's `<View>` / `<Text>` primitives:

```tsx
accessibilityRole="button"
accessibilityLabel={props.label}
accessibilityState={{ selected: props.active, disabled }}
```

On Tamagui **v1** these were automatically translated to ARIA (`role`, `aria-label`, `aria-selected`, `aria-disabled`) on web and preserved as RN props on native. On Tamagui **v2** — which we're using — that translation layer was deliberately removed. From `@tamagui/web/src/constants/accessibilityDirectMap.tsx` (installed version `2.0.0-rc.41`):

```ts
// v2: RN accessibility props are no longer converted
// Users should use web-standard aria-* props directly (aria-label, role, etc.)
// See https://tamagui.dev/docs/intro/version-two for migration guide
export const accessibilityDirectMap: Record<string, string> = {};
```

Tamagui v2's position is that cross-platform code should use the web-standard names (`role`, `aria-label`, etc.) and it handles platform mapping internally — RN primitives accept these names too. Our code predated the v2 upgrade and still assumed v1 behavior.

A secondary symptom surfaced in the same run: `TabItem` rendered string emoji icons (`'💵'`, `'🏠'`, etc. from `tab-definitions.ts`) as direct children of Tamagui's `<View>`, triggering:

```
Unexpected text node: 💵. A text node cannot be a child of a <View>.
```

This is enforced by Tamagui on both web and native. The constraint is documented; the codebase just missed it.

### Decision

Two coordinated changes, scoped to `packages/ui/src`:

**1. Adopt web-standard ARIA on every primitive's Tamagui-facing props.**

| Was (RN-style)                         | Is now (web-standard)               |
| -------------------------------------- | ----------------------------------- |
| `accessibilityRole="button"`           | `role="button"`                     |
| `accessibilityRole="tab"`              | `role="tab"`                        |
| `accessibilityRole="header"`           | `role="heading"` + `aria-level={1}` |
| `accessibilityLabel={x}`               | `aria-label={x}`                    |
| `accessibilityState={{ selected: x }}` | `aria-selected={x}`                 |
| `accessibilityState={{ disabled: x }}` | `aria-disabled={x}`                 |

Applied to `Btn`, `Card`, `TopBar`, `BottomTabBar/tab-item`. (`Input` already used `aria-label` internally — now made consistent.)

**2. Public component props renamed `accessibilityLabel` → `ariaLabel`.**

`Btn`, `Card`, `Input` all exposed `accessibilityLabel?: string` as a public prop. Renamed to `ariaLabel?: string` so the public API matches what's forwarded to the DOM. No external consumers were affected (only `packages/ui/tests/a11y.test.tsx` needed an update; no screens or app code passed these props).

**3. `TabItem` wraps string icons in `<Text>`.**

`tab-definitions.ts` defines `icon: '💵'` as bare emoji strings. `TabItem` now conditionally wraps when `typeof props.icon === 'string'`:

```tsx
{
  typeof props.icon === 'string' ? <Text fontSize={20}>{props.icon}</Text> : props.icon;
}
```

Consumers passing ReactNode icons (SVG, Lucide, etc.) keep working unwrapped.

### Alternatives Considered

- **Wait for Tamagui v3 / revert to v1.** Rejected: Tamagui v1 is no longer maintained and v2 is the current stable. The direction is clear: ARIA-first.
- **Ship a custom prop-translation shim at the app boundary.** Rejected: duplicates what Tamagui v1 already did, extra runtime cost, and sets up future confusion when onboarding reads Tamagui docs.
- **Keep the `accessibilityLabel` public prop name and internally translate.** Rejected: introduces a naming inconsistency — the prop says RN, the component emits web — and the public API drifts from what Tamagui docs say to use. Cleaner to name the prop after the standard it maps to.
- **For TabItem's string icons, enforce `icon: ReactNode` and change `tab-definitions.ts`.** Rejected: `tab-definitions.ts` is a plain `.ts` file (no JSX). Renaming it to `.tsx` + rewiring its consumers was more invasive than the conditional wrap in one leaf component.

### Consequences

- **Easier:** contributors learn one ARIA vocabulary that works on both platforms. Tamagui's own docs and the MDN ARIA reference both apply without translation.
- **Easier:** React's DevTools no longer spam `"React does not recognize..."` warnings, so real a11y regressions surface.
- **Harder:** when `@cachink/mobile` comes online (Phase 1B onwards), the mobile render path must be validated — Tamagui v2 claims `aria-label` works on RN via internal mapping, but we've only verified on the desktop target. If a gap appears, a platform-extension variant (per CLAUDE.md §5.3) is the escape valve.
- **Committed to:** web-standard ARIA names across every `@cachink/ui` primitive. Any future component that adds a11y props writes `aria-*` / `role`, not `accessibility*`. A review checklist item covers this in CLAUDE.md §12.

### References

- `packages/ui/src/components/Btn/btn.tsx`, `Card/card.tsx`, `TopBar/top-bar.tsx`, `BottomTabBar/tab-item.tsx`, `Input/input.tsx`
- `packages/ui/tests/a11y.test.tsx` (updated to use `ariaLabel` public prop)
- `node_modules/@tamagui/web/src/constants/accessibilityDirectMap.tsx` (source confirmation of Tamagui v2's deliberate removal)
- [Tamagui v2 migration guide](https://tamagui.dev/docs/intro/version-two)
- CLAUDE.md §5 (shared-component rules), §5.3 (platform-extension escape valve if mobile needs divergence)

---

## ADR-035

Date: 2026-04-24
Status: Accepted

**Title:** PowerSync Sync Streams as the Cloud sync engine; hybrid backend — Cachink-hosted Supabase is the wizard default, Settings → Avanzado unlocks BYO Supabase/Neon/self-hosted

### Context

CLAUDE.md §7.3 commits to PowerSync as the Cloud sync engine and to a "pluggable Postgres" stance: the wizard recommends Supabase but a Cachink install should not require it. Phase 1E must deliver a working Cloud mode that (a) onboards a brand-new user in under a minute with zero infrastructure, and (b) lets power users point Cachink at their own Postgres without a fork.

Three tensions had to be resolved:

1. **Onboarding friction.** Asking every user to "pick a Postgres provider and create an account" during a first-run wizard is a non-starter for the target market (Mexican emprendedores). Most will never leave the default.
2. **Vendor independence.** CLAUDE.md §3 and ADR-008 explicitly say Supabase is the _default_, not a _prerequisite_. The codebase must treat Supabase as one valid backend among several.
3. **Credential blast radius.** Management-tier Supabase credentials (the PAT, the service-role key) must never ship inside the mobile or desktop binary. Schema provisioning is a developer-laptop action, not a runtime action.

### Decision

- **Engine:** **PowerSync** (`@powersync/react-native` on mobile, `@powersync/web` on desktop, `@powersync/common` for the shared schema) using **Sync Streams** (PowerSync's 2026-recommended delta-replication model) — one stream per synced entity.
- **Default backend in the wizard:** a **Cachink-hosted Supabase project**. Project URL + anon key are baked into the build via `EXPO_PUBLIC_CLOUD_API_URL`, `EXPO_PUBLIC_CLOUD_ANON_KEY`, and `EXPO_PUBLIC_POWERSYNC_URL`. Email + password auth only; no provider picker.
- **Power-user override:** a **Settings → Avanzado** screen accepts a user-supplied `{projectUrl, anonKey, powersyncUrl}` and stores it in `__cachink_sync_state` (`scope='cloud.byoBackend'`). A sign-out is forced on save so a stale JWT can't leak across tenants. Only the URL + **anon/publishable key** are ever collected at runtime — the UI copy and field labels explicitly reject PATs and service-role keys.
- **Bridge:** a thin Drizzle adapter (`drizzle-orm/sqlite-proxy` shape) points the existing `CachinkDatabase` alias at PowerSync's local SQLite, so repositories from `@cachink/data` keep working unchanged.
- **Role-aware Sync Streams:**
  - **Operativo** receives a 90-day window on transactional tables (`sales`, `expenses`, `inventory_movements`) to keep mobile payloads small.
  - **Director** receives every row inside their business (filtered by `business_id`).
- **RLS:** Postgres row-level-security policies restrict every synced table by `business_id = (jwt->>'business_id')::uuid`. Supabase migrations (`supabase/migrations/0001_schema.sql`) ship the full policy set + a `CREATE PUBLICATION powersync FOR TABLE …` statement PowerSync consumes.
- **Provisioning stays on the developer laptop.** `supabase db push` runs with a local PAT; the PAT never enters `.env`, `package.json`, or any committed file. Documented in `supabase/README.md`.

### Alternatives Considered

- **Make users bring their own Supabase project on day one.** Rejected — contradicts the "finanzas para emprendedores" positioning; the wizard would ask 5+ technical questions before the first venta.
- **Ship Cachink as Supabase-only.** Rejected — contradicts CLAUDE.md §3 ("Cloud backend … pluggable") and ADR-008. A hosted default satisfies 90% of users; the override satisfies the rest without a fork.
- **Use Turso (libSQL) instead of PowerSync.** Rejected for Phase 1E. Turso's embedded replicas are compelling but untested at Cachink's scale; PowerSync's Sync Streams are already in the roadmap and have mature RN support. Keep Turso as a Phase 2 evaluation.
- **Bake a service-role key into the client.** Rejected — that key bypasses RLS and would compromise every tenant if the app were reverse-engineered. Anon + JWT is the correct surface.

### Consequences

- **Easier:** first-time Cloud users hit a two-tab screen (Sign in / Create account) with zero infrastructure setup. Repositories survive the Cloud migration unchanged — the Drizzle alias swap is the only code change at the data layer.
- **Easier:** `CloudAuth` interface + `SupabaseAuthConnector` implementation let the rest of the codebase stay Supabase-agnostic. A future Turso or Neon-with-Clerk impl plugs into the same interface.
- **Harder:** two deploy surfaces to keep consistent — the Cachink-hosted Supabase project and PowerSync instance have their own RLS + stream definitions. CI smoke tests will exercise both.
- **Committed to:** no PAT or service-role key in the shipped app, ever. Env-var-driven backend URLs at build time; `__cachink_sync_state` for runtime overrides. The BYO screen only accepts URL + anon key — service-role key submission is a breaking violation that requires a superseding ADR.

### References

- `packages/sync-cloud/src/client/{mobile,desktop}.ts` (PowerSync factories)
- `packages/sync-cloud/src/streams/index.ts` (Sync Streams)
- `packages/sync-cloud/src/auth/cloud-auth.ts` + `supabase-auth.ts`
- `supabase/migrations/0001_schema.sql`, `supabase/README.md`
- CLAUDE.md §7.3, §2 (local-first), §15 (open question #3 re: non-Supabase auth)
- ADR-008 (Supabase-as-default, not core)

---

## ADR-036

Date: 2026-04-24
Status: Accepted

**Title:** Launch artifacts and versioning — semver floor, EAS release profiles, Tauri code signing + updater

### Context

Phase 1F ships Cachink to real users. Launch-ready means: (a) the version scheme is pinned so the first public tag is meaningful, (b) builds are signed with certificates that are **obtainable but not committed**, (c) auto-update works on both mobile (EAS Update) and desktop (Tauri updater), and (d) the signing + submission runbook is clear enough that a single developer can execute it without re-inventing the process.

### Decision

- **Version floor: `0.1.0` for the public beta.** The repo currently has `0.0.0` everywhere; every `package.json`, `Cargo.toml`, and Tauri version file flips to `0.1.0` when the first TestFlight / Play-internal build ships. Full `1.0.0` is reserved for post-beta public launch.
- **EAS profiles** (mobile): `development` (dev client), `preview` (internal distribution — TestFlight / Play internal track), `production` (store submission). Defined in `apps/mobile/eas.json`. Secrets (certs, keys) live in EAS's encrypted secret store, never in the repo.
- **Tauri signing** (desktop): macOS uses `signingIdentity` from Apple Developer ID; Windows uses the code-signing certificate thumbprint. Both reference env vars (`CACHINK_APPLE_SIGNING_IDENTITY`, `CACHINK_WINDOWS_CERT_THUMBPRINT`) so the configuration stays in-repo but the material stays off-repo.
- **Auto-update:**
  - Mobile uses `expo-updates` pinned to the active EAS channel per profile. `useCheckForUpdates()` is surfaced in Settings so the Director can force a check.
  - Desktop uses `tauri-plugin-updater` pointing at a GitHub Releases RSS feed. No dedicated update server.
- **SBOM + checksums:** `scripts/build-all.sh` emits SHA-256 sums for every artefact plus a CycloneDX SBOM (`pnpm dlx @cyclonedx/cdxgen -o dist/sbom.json`). Transparency with Mexican emprendedora users on open-source dependencies.
- **Store metadata lives in `docs/store/`:** long description, short description, keywords, screenshots, privacy policy, ToS. All es-MX.

### Alternatives Considered

- **Jump straight to `1.0.0` at launch.** Rejected — the app will ship with known carry-overs (physical-device E2E coverage, real emprendedora beta feedback) that warrant a pre-1.0 signal. `0.1.0` → `1.0.0` mapping tracks the public-beta → public-launch arc cleanly.
- **Third-party update service** (CodePush, Ota, etc.). Rejected — EAS Update and Tauri's own updater are already mandated by CLAUDE.md §3; adding a fourth service multiplies attack surface and costs.
- **Commit certificates to a Git-LFS branch.** Rejected — violates the "no signing material in repo" security rule. Env-var references are the correct surface.

### Consequences

- **Easier:** one `pnpm release` moment per platform — `scripts/build-all.sh` produces signed artefacts + checksums + SBOM; `docs/launch-checklist.md` enumerates the manual steps left.
- **Harder:** the Cachink developer must set up Apple Developer + Google Play + the Windows code-signing vendor before a signed release can happen. Documented steps live in `docs/launch-checklist.md`.
- **Committed to:** semver starting at `0.1.0`; env-var-driven signing identities; EAS + Tauri updaters with no custom update server.

### References

- `apps/mobile/eas.json`, `apps/desktop/src-tauri/tauri.conf.json`
- `scripts/build-all.sh`, `docs/launch-checklist.md`
- `docs/store/**`, `docs/legal/privacy.md`, `docs/legal/terms.md`
- CLAUDE.md §3 (tech stack), §7 (local-first + sync)

## ADR-037

Date: 2026-04-24
Status: Accepted

**Title:** `@supabase/supabase-js` as a direct dependency of `apps/mobile` for Cloud-mode Auth

### Context

Phase 1E landed the Cloud-mode pipeline behind `@cachink/sync-cloud` with
PowerSync Sync Streams doing replication and Supabase handling Auth + the
Postgres backend (hosted default). The desktop shell already used
`@supabase/supabase-js` via `@cachink/sync-cloud`'s lazy import to build its
`CloudAuthHandle`. The mobile shell had a `useCloud` hook _slot_ on
`AppProviders.hooks` but no implementation — sign-in / sign-up simply didn't
work on iOS + Android.

The Round 2 wiring audit made the gap visible: `<CloudGate>` renders
`null` forever when no `authHandle` is supplied, so a user who picks
"En la nube" in the wizard on mobile sees a perpetual splash. Closing
that gap means calling `initCloudAuth(...)` from a mobile shell hook,
which in turn triggers `import('@cachink/sync-cloud')` → which uses
`@supabase/supabase-js` inside its `cloudAuth` factory. CLAUDE.md §12
requires an ADR before adding a top-level mobile dependency.

### Decision

Add `@supabase/supabase-js` (latest stable, `^2.x`) to `apps/mobile/package.json`
as a direct runtime dependency. Keep it out of `@cachink/sync-cloud`'s
`dependencies` — that package still declares it as a `peerDependency` so the
lazy-load contract stays intact (Local-standalone and LAN bundles never pay
the import cost).

The mobile shell's `use-cloud-bridges.ts` does **not** import from
`@supabase/supabase-js` directly — it calls `initCloudAuth(...)` from
`@cachink/ui/sync`, which lazy-imports `@cachink/sync-cloud` which
lazy-imports `@supabase/supabase-js` via its `SupabaseAuthConnector`.
Adding `@supabase/supabase-js` as a direct dependency of `apps/mobile`
guarantees Metro resolves a single copy through the pnpm workspace
graph (avoiding React Native's long-running duplicate-dep bug with
hoist-only transitive resolution).

Persistent-session support via AsyncStorage is parked for Phase 2 —
Supabase 2.x in React Native without an explicit storage adapter keeps
the session in memory, so users will re-authenticate after a cold
start. That trade-off is acceptable for the beta and avoids a third
top-level mobile dep this pass.

### Alternatives Considered

- **Keep Supabase as an optional ambient module on mobile.** Rejected —
  `cloudAuth` needs a real constructor and the Metro bundler can't
  resolve an ambient type at runtime without the package being listed.
- **Hand-roll a Supabase Auth wrapper inside the mobile shell.**
  Rejected — duplicates behaviour already covered by tested code in
  `@cachink/sync-cloud`, and we'd have to re-implement refresh-token
  persistence ourselves.
- **Wrap Supabase Auth behind a separate `@cachink/cloud-auth-mobile`
  package.** Parked for Phase 2 — for Phase 1 the two consumers
  (desktop shell + mobile shell) don't justify a fourth package.

### Consequences

- **Easier:** mobile users can actually sign in to Cloud mode; the
  Round 2 audit's R2-G6 is closed. Password reset + session refresh work
  because Supabase's client manages them with the injected AsyncStorage.
- **Harder:** the mobile bundle carries Supabase's client (~35 KB
  gzipped) even for users who never pick Cloud, because the lazy import
  still sits inside the `@cachink/sync-cloud` bridge. Mitigated by
  Metro's tree-shaking — only the `createClient` + auth module are
  pulled in.
- **Committed to:** mobile Cloud-mode auth flows through
  `@supabase/supabase-js`. If we ever swap Supabase for another backend
  on mobile, this ADR must be superseded and the shell hook rewritten.

### References

- `apps/mobile/src/shell/use-cloud-bridges.ts` (this commit)
- `packages/sync-cloud/src/auth/*`
- ADR-008 (Supabase default, not core), ADR-035 (hybrid Cloud backend)
- CLAUDE.md §3 (tech stack), §7 (local-first + sync), §12 (ADR rule)

---

## ADR-038

Date: 2026-04-25
Status: Accepted

**Title:** `react-native-get-random-values` as a direct mobile dependency to polyfill `crypto.getRandomValues` for Hermes/ULID

### Context

The first end-to-end iOS bundle attempt (April 2026, after the
`@vite-ignore` and Metro `.js`→`.ts` resolver fixes) revealed a
latent issue. Once the React tree began mounting,
`AppConfigProvider.hydrateAppConfig` called
`newEntityId()` → `newUlid()` → `ulid@3.0.2` and crashed with:

> `ULIDError: Failed to find a reliable PRNG (PRNG_DETECT)` at
> `packages/domain/src/ids/index.ts:17`.

`ulid@3` resolves a PRNG by checking
`globalThis.crypto.getRandomValues` (browser/Node ESM) or
`globalThis.crypto.randomBytes` (legacy Node). Hermes ships with
neither — `globalThis.crypto` is `undefined`. Vitest passes because
Node 22 exposes Web Crypto on the global; Vite-on-Tauri passes because
the system WebView does. Mobile is the only environment without a
PRNG.

Every entity ID in Cachink is a ULID (ADR-010), and `hydrateAppConfig`
runs **on every mobile cold start** because it generates the
device-scoped `device_id` if the app config is empty. Without a
working PRNG, the mobile app cannot finish hydration — the splash
screen never resolves and no screen ever renders.

### Decision

Add `react-native-get-random-values` (`~1.11.0`, the Expo SDK 55
pin selected by `expo install`) to `apps/mobile/package.json` as a
direct runtime dependency. Side-effect-import it as the **very first**
import in `apps/mobile/src/app/_layout.tsx`:

```ts
// must be the first import — installs globalThis.crypto.getRandomValues
import 'react-native-get-random-values';
```

The package is the React Native community's standard
`crypto.getRandomValues` polyfill. It backs onto each platform's
secure RNG: `SecRandomCopyBytes` on iOS and `SecureRandom` on Android.
Once the side-effect import has run, `globalThis.crypto.getRandomValues`
is defined and `ulid@3`'s PRNG detection succeeds — same code path
Vitest and Vite already exercise.

The polyfill is mobile-only. The desktop shell (Tauri WebView) gets
`crypto.getRandomValues` natively from the system WebView and does
not need this dependency.

### Alternatives Considered

- **`expo-crypto`** — Expo's official crypto module exposes
  `Crypto.getRandomValues()` and `Crypto.randomUUID()` but does **not**
  install them onto `globalThis` by default. Using it would require
  forking `ulid` or replacing every call site with a manual wrapper.
  Rejected — `react-native-get-random-values` is the simpler and
  more standard fix for libraries (like `ulid`) that read the global.
- **Replace `ulid@3` with a Hermes-aware fork or custom ID generator.**
  Rejected — `ulid` is the contract via ADR-010 and we already test
  against it on the domain side; a fork would diverge our entity-ID
  story across platforms.
- **Math.random fallback path inside `packages/domain/src/ids`.**
  Rejected — IDs are visible across the sync wire and form part of
  conflict-resolution semantics. `Math.random` is not cryptographically
  sound and would erode the uniqueness guarantee that `ulid` is
  meant to give us.

### Consequences

- **Easier:** ULID generation now works on every Hermes target
  (iOS + Android tablets). The mobile cold start can hydrate
  `app_config` and proceed to render. No domain/use-case code needs
  to change.
- **Harder:** the mobile bundle carries one extra polyfill (~5 KB
  gzipped). Negligible on a 4 MB JS bundle and the polyfill ships
  prebuilt native modules already linked through Expo autolinking.
- **Committed to:** mobile callers may rely on `globalThis.crypto`
  during render and afterwards. Future libraries that need
  `crypto.subtle` (full Web Crypto, not just RNG) will require a
  separate decision — `react-native-get-random-values` only polyfills
  `getRandomValues`.

### References

- `apps/mobile/package.json` (this commit) — adds
  `react-native-get-random-values: ~1.11.0`
- `apps/mobile/src/app/_layout.tsx` (this commit) — first-line import
- `packages/domain/src/ids/index.ts` — `newUlid` call site
- `packages/ui/src/app-config/app-config-provider.tsx` — hydration site
  that surfaced the gap
- ADR-010 (ULIDs as primary keys for all entities)
- CLAUDE.md §3 (tech stack), §12 (ADR rule for new top-level deps)

---

## ADR-039

### Setup wizard rewrite + AppMode collapse + lan-server/lan-client split

**Date:** 2026-04-25
**Status:** Accepted
**Supersedes:** the mode-table sections of CLAUDE.md §7.1 / §7.4 (this ADR
is the new canonical spec; CLAUDE.md is updated to point here).

### Context

The Phase 1 first-run wizard exposed four mode cards on a single screen
with technology-first language: `local-standalone` ("Solo este
dispositivo"), `tablet-only` ("Solo tablet"), `lan` ("Conectar a un
servidor local" / "Ser el servidor local"), and `cloud` ("En la nube").

Two problems surfaced from a UX review with the target audience
(non-technical Mexican emprendedores):

1. **`tablet-only` and `local-standalone` were the same to users.** Both
   meant "all the data lives on this one device, no sync." The
   distinction (one was tablet-only because we bundled the LAN host on
   desktop only) was an implementation detail that leaked into the user
   model.
2. **The `lan` mode hid two very different intents** behind a single
   AppMode value plus a separate `__cachink_sync_state.lanRole` scope.
   The wizard had to write to two storage locations simultaneously, the
   `LanGate` had to read from both, and existing-user re-runs frequently
   ended up with mismatched mode/role pairs after partial migrations.
3. **Cloud-as-backup for solo users was hidden.** Users with one device
   who wanted cloud sync purely for disaster recovery (very common in
   the MX market where phones get lost or stolen) had to mentally
   navigate the multi-device path even when they were alone.
4. **Migration paths between modes were undefined.** A solo-local user
   who later bought a desktop had no in-app path to make that desktop
   the LAN server with their existing data.

### Decision

Five coordinated changes:

1. **AppMode enum collapses + splits.** New shape:

   ```ts
   export type AppMode = 'local' | 'cloud' | 'lan-server' | 'lan-client';
   ```

   - `'local-standalone'` and `'tablet-only'` merge into `'local'`.
   - `'lan'` splits into `'lan-server'` (this device hosts) and
     `'lan-client'` (this device joins). The role becomes a first-class
     part of AppMode rather than a parallel sync-state scope.

2. **Wizard restructures into a 4-screen state machine** plus a Help
   modal:
   - **Step 1 — Welcome.** "¿Cómo lo vas a usar?" Two primary cards
     (Solo / Multi-device) plus two secondary text links ("Ya tengo
     Cachink en otro dispositivo" → Step 3, "Ayúdame a decidir" →
     Help modal).
   - **Step 2A — Solo branch.** Two cards: "Guardar todo en este
     dispositivo" (`mode='local'`) / "Guardar todo en la nube"
     (`mode='cloud'`, sign-up sub-flow).
   - **Step 2B — Multi-device branch.** Two cards: "Esta computadora
     guarda los datos" (`mode='lan-server'`, **disabled on mobile**
     with inline explanation) / "La nube guarda los datos"
     (`mode='cloud'`, sign-up sub-flow). Plus a secondary
     `importLink` (desktop only) that opens the migration-deferred
     screen.
   - **Step 3 — Join existing.** Two cards: "Conectarme al servidor
     de mi negocio" (`mode='lan-client'`) / "Iniciar sesión en mi
     cuenta de Cachink" (`mode='cloud'`, sign-in sub-flow).
   - **Help modal** with three concrete scenarios; tapping one closes
     the modal and pre-highlights the matching card on Step 1.

3. **Solo → LAN data import is deferred to Phase 2.** The desktop Step
   2B `importLink` opens a migration-deferred screen with honest copy
   ("La migración directa llega en una versión próxima. Por ahora…").
   See **Deferred Decisions** at the end of this file.

4. **Three runtime safety rails are added:**
   - **Data-preserved callout** — every mode-change screen on a re-run
     shows a green Callout with the local row counts (ventas /
     productos / clientes) so the user sees their data is safe before
     they tap Continue.
   - **Offline blocker** — cloud sub-flows refuse to mount when
     `useIsOnline() === false`, replacing the screen with a Callout
     that suggests the local-only fallback.
   - **Unsynced-changes blocker** — when re-running on a device with
     pending push HWM > 0, the wizard blocks mode changes by default
     and offers an explicit "Entiendo, cambiar de todas formas" escape
     hatch. First-run skips this check entirely.

5. **The wizard component lives at `packages/ui/src/screens/Wizard/`**
   (existing path, not a new `wizards/` folder), and copy lives in
   the existing strict-typed `packages/ui/src/i18n/locales/es-mx.ts`
   (not a per-wizard JSON file). Both are project conventions.

### Alternatives Considered

- **Keep the current 4-mode enum + change only the wizard copy.**
  Rejected: the `lan → lan-server / lan-client` split is the cleanest
  way to retire the parallel `lanRole` sync-state scope and simplify
  `LanGate`. The mismatched mode/role pairs problem doesn't go away
  with copy changes.
- **Build the solo-to-LAN importer in Phase 1.** Rejected: an
  Excel-format round-trip importer is format-fragile (date/money
  parsing, ID regeneration, FK resolution). A `.bak` SQLite copy is
  technically lossless but the UX (file transfer between devices,
  pairing the imported DB with a new server identity) needs design
  work that wasn't ready for this phase. Deferred to Phase 2 with
  honest in-wizard messaging.
- **Single-screen wizard with 5 cards.** Rejected: the UX spec caps
  visible cards at 3 per step. Five-on-one violates the discipline.
- **Separate per-wizard JSON i18n file.** Rejected: bypasses the
  strict-typed `t()` system that catches typos at compile time. Keep
  one `es-mx.ts` per the convention.
- **Settings → Avanzado submenu** to host the re-run trigger.
  Deferred to a follow-up PR — it's an information-architecture
  decision unrelated to the wizard rewrite.

### Consequences

**Easier:**

- One source of truth for LAN routing decisions: `AppMode` alone.
  `LanGate` no longer reads two storage locations.
- The Solo + Cloud path (cloud-as-backup) is now reachable in the
  wizard, removing the hidden assumption that cloud is a multi-device
  feature.
- Re-runs on devices with data are explicitly safe by design (callout
  shows the user their counts before they confirm).
- Cloud sub-flow gracefully degrades on offline devices with a
  fallback recommendation, preventing failed sign-ups.

**Harder:**

- Existing users with `mode = 'tablet-only'` or `mode = 'lan' +
lanRole = ...` in their `app_config` table get migrated at next
  launch by `hydrateAppConfig`. The migration is idempotent and
  rewrites the stored value so subsequent reads see the new enum.
- The `__cachink_sync_state.lanRole` scope is no longer read by new
  routing code. Existing rows remain (forensic safety) but are inert.
  `useLanRole()` is retired.
- The `WizardSelectOptions { lanRole }` plumbing through
  `WizardGate.onLanRoleSelected` is retired. Apps lose the
  `useOnLanRoleSelected` hook signature.
- `@react-native-community/netinfo` becomes a new mobile dependency
  for `useIsOnline.native.ts`. Tauri uses `navigator.onLine` and
  needs no new dep.
- Three repository interfaces (`SalesRepository`, `ProductsRepository`,
  `ClientsRepository`) gain a `count(businessId)` method; both Drizzle
  and in-memory implementations + contract tests update.

**Committed to:**

- `AppMode = 'local' | 'cloud' | 'lan-server' | 'lan-client'` is the
  permanent enum. Future modes append; the four current values do not
  change names again.
- The wizard's first-screen question is intent-first ("¿Cómo lo vas a
  usar?"), not technology-first. Future revisions should preserve
  this framing.
- Re-run safety (data-preserved callout + offline blocker +
  unsynced-changes blocker + escape hatch) is part of the wizard's
  contract from this point forward. Any new mode-change UI must
  honour the same rails.
- The Help modal pattern (pre-select a card on close, never
  auto-submit) is the reference UX for any future "guide me" flows.

### References

- Spec discussion (this conversation, 2026-04-25)
- `packages/ui/src/screens/Wizard/` — implementation lands across
  ROADMAP milestones WUX-M1..M4
- ADR-006 (Local-first as the default) — unchanged; this ADR refines
  what "local" means at the user level
- ADR-007 (LAN sync is first-party) — unchanged; this ADR splits the
  user-facing role into AppMode
- ADR-008 (Supabase is Cloud-mode default) — unchanged; cloud
  sub-flow integration uses the existing `<CloudOnboardingScreen>`
  with a new `initialTab` prop
- CLAUDE.md §7.1, §7.4 — updated in lockstep with this ADR

---

## ADR-040

### Design-mock alignment — keep §1 tab contract, defer extras to Phase 2 "Más…"

**Date:** 2026-04-25
**Status:** Accepted

### Context

A UX/UI audit compared the four April 2026 design mocks (Operativo
home, Operativo home alt, Nueva Venta modal, Director Home) against
the shipped UI. The brand DNA (color palette, typography, hard
borders, hard drop shadows, press transform) was already encoded
correctly in `packages/ui/src/theme.ts` and matches the mocks
verbatim. However, the audit surfaced two structural conflicts
between the mocks and CLAUDE.md §1:

1. **Operativo bottom-tab set.** Mocks 1 and 2 show four tabs
   labelled `INICIO · VENTAS · CORTE · AJUSTES`. CLAUDE.md §1
   prescribes three: `VENTAS · EGRESOS · INVENTARIO`. The mock's
   set drops Egresos + Inventario as primary tabs and adds an
   `Inicio` (unified home) and `Corte` (corte de día history)
   surface.
2. **Director home cards.** Mock 4 shows a tight above-the-fold
   composition (black `UTILIDAD NETA · MES` hero, 2×2 KPI grid,
   `SALUD FINANCIERA` 3-bar card, `CUENTAS POR COBRAR` list).
   CLAUDE.md §1 mandates additional surfaces: `StockBajoCard`
   (stock-low push notification), `PendientesCard` (recurring
   entries), `ConflictosCard` (multi-device awareness). The mock
   omits all three.

The mocks are stated as "exactly how I want my app to look", so
the audit needed to reconcile them with the architectural contract.

### Decision

1. **Operativo bottom-tab bar — keep CLAUDE.md §1 contract for
   Phase 1.** Three tabs: `VENTAS · EGRESOS · INVENTARIO`. The
   tabs use vector icons (Lucide line-style) instead of emoji, but
   the tab _set_ is unchanged.
2. **Phase 2 "Más…" surface.** A 4th Operativo bottom-tab labelled
   `MÁS` (icon: `more-horizontal` or `layout-grid`) opens a
   roll-up screen exposing all secondary affordances: role change,
   scanner shortcut, clientes list, comprobantes recientes,
   export data, feedback, settings shortcut. This is the explicit
   parking lot for everything the mocks suggest belongs on the
   bottom bar but doesn't fit the §1 contract.
3. **Director home — preserve mandated cards behind a "Más" panel.**
   Above the fold matches mock 4 exactly (black hero, 2×2 KPI
   grid, Salud Financiera, CxC list). The `StockBajoCard`,
   `PendientesDirectorCard`, `ActividadReciente`, and
   `ConflictosRecientesCard` move into a collapsed `<Card>` panel
   below the CxC list, expanded by tapping the panel's eyebrow
   ("Más"). They remain mounted (so notifications + conflict
   surfacing still work) but stop competing for above-the-fold
   pixels.
4. **Icon system.** Adopt `lucide-react-native` (works on RN +
   web/Tauri via `react-native-svg`). Add a `<Icon>` wrapper at
   `packages/ui/src/components/Icon/` with a curated `IconName`
   union so consumers cannot import arbitrary icons. Replace every
   emoji glyph in `packages/ui/src/screens` and
   `packages/ui/src/components` runtime code (stories may keep
   emoji as documentation devices).
5. **New primitives** to support the mocks:
   `<InitialsAvatar>` (yellow rounded-square avatar in TopBar),
   `<SegmentedToggle>` (chip-toggle radio group for `MÉTODO DE
PAGO`), `outline` Btn variant (white + 2-px black border + hard
   shadow for `CANCELAR` next to a primary `GUARDAR`).

### Alternatives Considered

- **Adopt the mocks verbatim and rewrite CLAUDE.md §1.**
  Rejected because dropping `EGRESOS` + `INVENTARIO` as primary
  tabs hides core daily affordances behind a pill button — every
  egreso would require an extra tap (open Inicio → tap "+ Egreso"
  → fill modal). The Phase 1 user (single Operativo
  capturing 50+ ventas + 5–10 egresos a day) loses time. Also
  conflicts with CLAUDE.md §2 principle 1 ("less clicks, most
  value").
- **Cut the mandated Director cards entirely.** Rejected because
  StockBajo is the visible counterpart to the stock-low push
  notification (CLAUDE.md §1) — without the card, a tap on the
  push lands on a screen that doesn't surface the data. Same
  reasoning for ConflictosCard (CLAUDE.md §1 multi-device
  awareness — conflicts must surface inline, never silently).
- **Build the "Más…" tab now in Phase 1.** Rejected because the
  4th-tab affordance has no concrete user need yet — every
  affordance the mocks imply lives on the tab is already reachable
  in one tap from elsewhere (settings cog in TopBar, scanner via
  Inventario, clientes from NuevaVenta). Phase 2 with real-user
  feedback is the right time to spec the screen contents.

### Consequences

- **Easier:** the §1 contract stays stable, no ADR cascades. The
  audit's foundation work (icons, primitives, top-bar avatar)
  ships immediately because none of it touches the tab contract.
  Future "Más…" expansion has a clear architectural home.
- **Harder:** the Director home loses some of the mock's whitespace
  feel — the "Más" panel adds a row even when collapsed. Mitigated
  by the `<Btn variant="ghost">` eyebrow taking <44 px of vertical
  space.
- **Committed to:** a Phase 2 ROADMAP entry for the Operativo
  "Más…" tab; the eight UXD-M1/M2/M3 tasks landing under
  `## 🚧 UX Design-Mock Alignment (UXD)` in ROADMAP.md.

### References

- ROADMAP.md `## 🚧 UX Design-Mock Alignment (UXD)` block
  (added in this slice)
- ROADMAP.md `## Post-Phase 1 — Future Phase Candidates`
  (Operativo "Más…" tab entry)
- CLAUDE.md §1 (modules), §2 principles 1–3, §8 (brand)
- Design mocks: April 2026 stakeholder review

---

## ADR-041

### Anchored `<Combobox>` (Tamagui Popover) replaces bottom-sheet select; install icon native modules in apps

**Date:** 2026-04-25
**Status:** Accepted

### Context

After ADR-040 shipped the line-icon foundation and the
`<Input type="select">` migrations, a Round-2 audit found two
breakages in the running mobile app:

1. **Pink `"Un"` rectangles in the bottom tab bar.** RN's
   `_Unimplemented` native-component placeholder. `lucide-react`,
   `lucide-react-native`, and `react-native-svg` were declared as
   peer deps of `@cachink/ui` (the JS modules resolved correctly
   via the existing `nodeModulesPaths` rule in
   `apps/mobile/metro.config.js`), but RN autolinking only runs
   for packages declared as **direct** deps of an app's
   `package.json`. Because none of those three libs were direct
   deps of `apps/mobile`, the iOS `pod install` step never
   registered `RCTRNSVG…` and every `<Svg>` element rendered the
   placeholder.
2. **Director Home crashed** the moment any `<EmptyState
icon="…">` mounted (info / package / bell / receipt). Same
   root cause: the unlinked native module made every `<Icon>`
   site throw inside RN's reconciler.
3. **`<Input type="select">` opened a separate bottom-sheet
   `<Modal>`** on RN. The picker pinned to the viewport's bottom
   edge regardless of where the trigger lived, reading as
   "misaligned at the bottom-left" — not the inline anchored
   picker the design mocks call for.

A user decision was solicited and locked: **Path A** for icons
(install Lucide correctly), **D1.A** for migration (refactor
`<Input type="select">` internally; zero call-site changes),
**D2.alt** (add typeahead now), **D3** (anchored popover on both
platforms; no `<Adapt>`-driven sheet).

### Decision

1. **Install icon native modules as direct app deps.**
   - `apps/mobile/package.json` adds
     `lucide-react-native@^1.11.0` and
     `react-native-svg@15.15.4` (the version pinned by Expo SDK
     55's lockfile — `expo install --check` will warn if a
     different version is used).
   - `apps/desktop/package.json` adds `lucide-react@^1.11.0`.
   - The peer-dep declarations in `packages/ui/package.json`
     stay (they document the contract), but the apps own the
     native-link contract.
2. **Build a new `<Combobox>` primitive at
   `packages/ui/src/components/Combobox/`** that wraps Tamagui's
   `@tamagui/popover` (added as a peer dep of `@cachink/ui` at
   `2.0.0-rc.41` — same version as the rest of the Tamagui
   family already in use). The primitive ships with a curated
   trigger (2 px black border, 12 radius, white surface, chevron
   icon that flips with open state), an anchored panel (2 px
   border, 14 radius, hard `4 × 4` black drop shadow), an
   optional searchable filter row, an empty-state row, and
   `aria-combobox` / `aria-expanded` / `aria-selected` wiring.
3. **`<Input type="select">` (web + native) delegates to
   `<Combobox>` internally.** ~12 existing call sites continue
   to use `Input type="select" options={readonly string[]}` and
   migrate automatically — the wrapper maps strings to
   `{ key, label }` and forwards. Lists with **more than six
   options** auto-enable `searchable` so categoría pickers get
   typeahead while two-option pickers stay clean.
4. **Use `Popover.Anchor`, not `Popover.Trigger`.** The trigger
   View owns its own press handler. Tamagui's `Popover.Trigger
asChild` relies on internal proxying that doesn't merge
   cleanly onto a styled `<View>` child — `onOpenChange` would
   never fire in jsdom or RN. `Popover.Anchor` positions the
   panel without claiming click handling, which keeps state in a
   `useComboboxBindings` reducer.
5. **No platform-extension split for `<Combobox>`.** Pure
   composition over Tamagui primitives, no platform-specific
   capability invoked → CLAUDE.md §5.3 justified-split test
   fails. The same file renders the same View tree on Vite +
   Metro.
6. **Drop the bottom-sheet `<Modal>` import from
   `input.native.tsx`** — the SelectField branch is the same
   Combobox now. The `<Modal>` primitive itself stays for
   transactional flows (NuevaVenta, NuevoEgreso); only the
   select branch loses it.

### Alternatives Considered

- **Path B — replace Lucide with hand-authored brand SVGs.**
  Rejected after the user reviewed the trade-off: still requires
  `react-native-svg` on RN (no escape hatch — RN doesn't render
  HTML `<svg>`) so it doesn't avoid the native-module install,
  and demands 36 hand-drawn glyphs from a designer who hasn't
  shipped them yet. Documented as a Phase 2 candidate (replace
  the Lucide component map with an inline-path map; the
  `<Combobox>` chevron + every screen icon stays renamed-only).
- **Tamagui `<Adapt>` morphs the popover into a sheet on
  mobile.** Rejected per D3 — re-introduces exactly the
  "separate component feel" the user flagged. With ≤ six
  options the popover fits comfortably even on a 4-inch phone.
- **Migrate every `<Input type="select">` call site to
  `<Combobox>` directly with `{ key, label }`.** Rejected per
  D1 — adds churn across ~12 sites for no net benefit. Internal
  delegation gives every caller the new behaviour with zero
  breakage. A typed migration can land incrementally as
  individual screens get redesigned (UXD-M3-T07 already does
  this for `MÉTODO DE PAGO` via `<SegmentedToggle>`).
- **Wrap `<Icon>` in an error boundary that falls back to a
  neutral `<View>`.** Rejected — would hide real native-link
  bugs from CI. The pink `"Un"` rectangle is a useful visual
  signal that something's wrong with autolinking. The fix here
  (one-line dep add per app) eliminates the recurring class.

### Consequences

- **Easier:** zero call-site churn for the picker migration;
  bottom-tab icons + EmptyState icons + Director Home all
  render correctly without per-screen patches; brand-styled
  picker with hard drop shadow and chevron flip is now a single
  reusable primitive (5 stories, 14 tests, 100% generic over
  `T extends string` so domain unions like `PaymentMethod`,
  `Regimen` keep their literal types).
- **Harder:** apps must run `pnpm install` + `cd apps/mobile/ios
&& pod install` after pulling this slice for the first time
  on a real device. Local Expo Go users need a dev build
  (`npx expo run:ios`) — Expo Go's bundled native runtime ships
  a different RN-SVG version. EAS Build handles this
  automatically.
- **Committed to:** `@tamagui/popover@2.0.0-rc.41` as a
  permanent peer dep of `@cachink/ui`. Future Tamagui upgrades
  must move this dep in lockstep with `@tamagui/dialog` /
  `@tamagui/input` / `@tamagui/portal` (already pinned at the
  same version). The `Popover.Anchor` pattern is documented at
  the top of `combobox.tsx` so future contributors don't
  silently switch to `Popover.Trigger` and reintroduce the
  open-state wiring bug.

### References

- ROADMAP.md `## 🚧 UX Design-Mock Alignment (UXD)` →
  Milestone UXD-R2 (closed 2026-04-25)
- `packages/ui/src/components/Combobox/combobox.tsx`
  (architectural notes block + `useComboboxBindings`)
- `packages/ui/src/components/Combobox/combobox-views.tsx`
  (`TriggerView`, `OptionRow`, `SearchInput`, `EmptyRow`)
- `packages/ui/tests/combobox.test.tsx` (14-test regression
  set covering trigger, panel, search, disabled)
- ADR-040 (icon contract this builds on)
- CLAUDE.md §3 (deps), §5 (cross-platform components), §8.3
  (brand shadow rules)

---

## ADR-042

### Multi-step transactional flows are Stack pages, not single modals with internal tabs; KeyboardAvoidingView at the Modal primitive

**Date:** 2026-04-25
**Status:** Accepted (supersedes ADR-020 for the Egreso 3-tab modal in
particular and the modal-vs-page question in general)

### Context

The April 2026 mobile-first UI/UX audit surfaced two structural
problems with the way Phase 1 ships its forms:

1. **`<NuevoEgresoModal>` packed three sub-tabs (Gasto / Nómina /
   Inventario-purchase) inside one bottom-sheet `<Modal>`, and each
   tab can spawn its own nested modal** (NuevoEmpleadoModal inside
   the Nómina tab; NuevoProductoModal + Scanner inside the Inventario
   tab). Real users hit a 4-deep stack the moment they try to create
   an empleado mid-nómina-egreso. Tamagui's `<Dialog>` focus trap was
   never designed for stacked dialogs; the inner dialog steals focus
   but the outer dialog's backdrop still listens for `onPress` →
   tapping inside the inner Combobox sometimes dismisses the
   grandparent. Recovery requires re-opening every level. ADR-020
   accepted "one modal, three tabs" as the simpler shape; the audit
   showed it doesn't survive contact with the nested-create flows.
2. **`position: 'fixed'` was passed to the bottom-sheet
   `<Modal>` on RN.** RN doesn't accept `'fixed'` as a `position`
   value (only `'absolute'` and `'relative'`); the property was
   silently dropped on iOS / Android, leaving the sheet to render
   in the document flow on devices. The web tests caught nothing
   because the value resolves correctly on browser CSS.
3. **No modal in the codebase wrapped its content in
   `<KeyboardAvoidingView>`.** On RN, the soft keyboard slides up and
   covers the bottom half of the sheet — exactly where the focused
   input lives. Users have to scroll the sheet manually, which is not
   discoverable and breaks the controlled-input round-trip when the
   keyboard hides.

### Decision

1. **Adopt "Stack pages over single multi-tab modals" as the default
   for Phase 1.5+ multi-step transactional flows.** Specifically, the
   `NuevoEgreso` flow becomes a route stack:
   - `/egresos/nuevo` — sub-tab landing (renders the
     `<SegmentedToggle>` choosing Gasto / Nómina / Inventario).
   - `/egresos/nuevo/gasto`, `/egresos/nuevo/nomina`,
     `/egresos/nuevo/inventario` — one full-screen page per sub-flow.
   - `/egresos/nuevo/nomina/empleado-nuevo` — the create-empleado
     side-flow lives as its own route, **not** as a modal mounted
     inside the Nómina page. Same for
     `/egresos/nuevo/inventario/producto-nuevo`.
     The route refactor itself ships in a separate slice (the audit's
     PR 3 implementation work) — this ADR is the architectural
     commitment that justifies that refactor.

2. **Single-decision modals (≤ 5 fields, single submit, no nested
   create-flow) remain modals.** RegistrarPagoModal, NuevoClienteModal,
   ConfirmDialog, and the CorteDeDía card flow stay as bottom-sheet
   `<Modal>` instances because they don't trigger a sub-flow that
   needs its own keyboard / scroll context. The decision-rule:
   if a flow ever opens another modal from inside itself, **the parent
   must be a page**, not a modal.

3. **`<KeyboardAvoidingView>` lives at the `<Modal>` primitive, not
   per-screen.** Wrapping every modal-based form individually would
   guarantee drift — some screens forget. Wrapping at the primitive
   means every modal benefits without the call-site needing to know
   about RN keyboard semantics. Behaviour: `'padding'` on iOS, `'height'`
   on Android (the OS-recommended defaults). The web target is
   unaffected because `react-native-web`'s
   `<KeyboardAvoidingView>` is a no-op div.

4. **`position: 'fixed'` is replaced with `'absolute'` on the RN
   variant.** Inside the `<Dialog.Portal>`-mounted root view,
   `'absolute'` produces the same screen-edge anchoring as `'fixed'`
   does on web — but RN actually accepts the value. Web variant is
   unchanged.

5. **`react-native` is aliased to `react-native-web` in the UI
   package's Vitest config.** The `.native.tsx` platform variants now
   import from `'react-native'` for `KeyboardAvoidingView`, `Platform`,
   `Share`, and friends; vitest can't parse RN's Flow-typed
   `index.js`, so the alias maps to RN-Web's plain-JS equivalents
   under jsdom. Tests still exercise structure / wiring, which is what
   the existing `tests/modal.native.test.tsx` already does.

### Alternatives Considered

- **Keep one-modal-three-tabs and add a guard against nested modals.**
  Rejected: the nested-create flows are the user's expected path
  ("I'm creating an egreso and realised this empleado isn't in the
  list yet"), forcing them to back out and reopen breaks the mental
  model. The audit's user-impact rating was the deciding factor.
- **Bottom-sheet with virtual stacks.** Push subsequent screens into
  the same sheet via Tamagui's `<Sheet>` snap-points API. Rejected
  because it doesn't address the keyboard-coverage problem, retains
  the focus-trap conflict for nested forms, and locks us into a
  Tamagui-version-specific API. Real Stack pages compose with Expo
  Router and the desktop's home-grown `desktop-router-context.tsx`
  without any new sheet plumbing.
- **Skip `<KeyboardAvoidingView>` and rely on Tamagui's
  `<Sheet>` keyboard handling.** Rejected: the existing `<Modal>`
  primitive uses `<Dialog>`, not `<Sheet>`. Migrating modal → sheet
  is a separate decision (the audit didn't ask for it; the brand
  visuals already match the bottom-sheet shape we want). Wrapping
  in `<KeyboardAvoidingView>` is the smallest fix.

### Consequences

**Easier:**

- Forms with deep create-side-flows (Egreso → Empleado / Producto)
  can host their own keyboard, scroll, and back-navigation contexts
  without fighting Dialog focus traps.
- Every modal-based form on RN now keeps its inputs visible while
  the keyboard is up — no per-screen plumbing needed.
- The mobile bundle's RN-vs-web Modal divergence is one constant
  (`'absolute'` not `'fixed'`) instead of a quietly-broken value.

**Harder:**

- The `NuevoEgreso` route refactor (audit's PR 3 implementation) is a
  meaningful piece of work — Maestro flows, smart wrappers, the
  `apps/desktop` `desktop-router.tsx` dispatch table, and the
  ROADMAP-archived `S9-A` adapter all need updates. The route
  refactor lands in its own slice; this ADR is the architectural
  green light.
- Bookmarkability / deep-linking semantics differ between modal and
  page. Once `/egresos/nuevo/nomina` is a real route, navigating
  there from anywhere in the app is unambiguous — but the previous
  modal-state-in-Zustand pattern stops working. Each smart wrapper
  re-derives state from the URL.

**Committing to:**

- New transactional flows ship as Stack pages by default; modals are
  the exception, justified per case in the PR description.
- The `<Modal>` primitive owns keyboard avoidance — call sites do not
  add their own `<KeyboardAvoidingView>`.
- ADR-020 (Egresos sub-tab pattern) is **superseded** for the
  three-tab Egreso modal in particular. ADR-020 stays in the log
  for forensic context but its Status is now `Superseded by ADR-042`.

### References

- ROADMAP.md §"Audit M-1 PR 3" (the implementation slice this ADR
  authorises).
- The April 2026 mobile-first UI/UX audit, sections 2 (modal vs
  full-screen) + 5 (keyboard handling) + 8.1 (Tamagui Dialog on RN).
- `packages/ui/src/components/Modal/modal.native.tsx` (the
  primitive that closes Blockers 1.9 + 1.10).
- `packages/ui/vitest.config.ts` (the `react-native → react-native-web`
  alias that lets the .native variant test under jsdom).
- ADR-020 (Egresos sub-tab pattern, now superseded).

---

## ADR-043

### `<Tag>` is decorative-only; tappable-chip primitive deferred to Phase 2

**Date:** 2026-04-26
**Status:** Accepted

### Context

The April 2026 mobile-first UI/UX audit (section 3.10) flagged a worry
that `<Tag>` — a small pill used for `categoria`, `metodo`, and pago
status across `VentaCard`, the egresos list, the inventario list,
`<CuentasPorCobrarStrip>`, and the receipt comprobante — _visually
implies tappability_ even though the primitive ships no `onPress`, no
focus ring, and no press-transform. The audit raised this as a
judgment-call finding, not a blocker, and asked for an explicit
decision: either build a parallel `<Chip>` primitive that adds tap
behaviour to the same visual shell, or commit to "Tag is decorative
only" and document it.

A reconnaissance pass through the codebase before this decision
confirmed:

1. **Zero `<Tag>` instances are mounted as a tap target today.** Every
   call-site (~60 across `packages/ui/src/components`) renders Tag
   inside a card whose parent already owns the press behaviour, never
   as the press target itself.
2. **`<SegmentedToggle>`** (already shipped, audit 3.2) is the
   established primitive for chip-styled radio-group choices —
   period filters, sub-tab pickers, the `<MovimientoFields>`
   tipo toggle. Every "tappable chip group" in Phase 1 already routes
   to `<SegmentedToggle>`, not to a hypothetical `<Chip>`.
3. **Single-tappable chips don't appear anywhere in the Phase 1
   surface.** The closest candidates (Cuentas-por-Cobrar status pills,
   filter dismissers) are either decorative or could be expressed as a
   `<Btn>` with a smaller size variant when the need genuinely arises.

Building `<Chip>` now would mean shipping a primitive with no callers
that has to be maintained alongside its visual twin `<Tag>`. The
"single-place" rule (CLAUDE.md §2.3) favours one primitive with a
clear contract over two visually-similar primitives whose distinction
is "this one is tappable, that one isn't".

### Decision

1. **`<Tag>` is decorative-only.** It exposes no `onPress`, no
   `role="button"`, no focus ring, and no press-transform. The JSDoc
   on `tag.tsx` codifies this contract and points future contributors
   at the right alternative for any tap need.
2. **For radio-group / segmented chip needs**, callers use
   `<SegmentedToggle>` — already shipped with the 48-pt effective tap
   target, brand press-transform, and `aria-selected` semantics.
3. **For single-tappable chips that don't fit a segmented group**, the
   path forward is to extend `<Btn>` with a future `chip` size variant
   rather than introducing a separate `<Chip>` primitive. This keeps
   tap semantics in one component (`<Btn>` already owns `hitSlop`,
   `aria-label`, `disabled`, the press-transform, the loading state,
   and Dynamic Type clamping); a `<Chip>` would duplicate that surface
   for no benefit.
4. **A standalone `<Chip>` primitive is deferred to Phase 2+** and only
   built if a real surface (e.g. tappable filter chips on a future
   reports screen) demands a shape that neither `<SegmentedToggle>`
   nor `<Btn chip>` can express. When that surface lands, a follow-up
   ADR will supersede this one.

### Alternatives Considered

- **Build `<Chip>` now anyway.** Rejected — it has no callers in
  Phase 1 and would be the kind of speculative duplication the
  "single-place" rule catches. Worse, the visual twinning with `<Tag>`
  invites future drift (a new contributor hits "should this be a Tag
  or a Chip?" every time).
- **Add an optional `onPress` to `<Tag>`.** Rejected — that would make
  the primitive's contract conditional ("decorative unless you pass
  onPress"), which is the kind of dual-mode surface area that
  CLAUDE.md §2 flags as a feature smell. Tap semantics deserve a
  primitive that owns them end-to-end.
- **Defer the decision.** Rejected — leaving the audit finding as
  "judgment call, unresolved" means every future contributor
  re-litigates it. An ADR makes the decision explicit and reversible.

### Consequences

**Easier:**

- Reviewers can immediately reject any PR that adds `onPress` to
  `<Tag>` by pointing at this ADR + the JSDoc.
- The `<Tag>` test surface stays small (just visual variants) — no
  press-state matrix, no a11y matrix.
- New contributors learn the decision-tree once: decorative chip →
  `<Tag>`, radio chip → `<SegmentedToggle>`, single tap chip →
  `<Btn>` (chip variant when added).

**Harder:**

- A future need for a tappable chip that doesn't fit `<SegmentedToggle>`
  or `<Btn chip>` will require a new ADR + a new primitive. That cost
  is acceptable because it's deferred to a real call-site, not paid
  speculatively today.

**Committing to:**

- `<Tag>` will not gain a press behaviour. If the audit sweep
  re-surfaces this in Round 2, the answer is "see ADR-043".
- The `chip` size variant on `<Btn>` is the next response to a
  single-tappable-chip need; it will be added inline in the slice that
  introduces the first call-site, not built speculatively.

### References

- CLAUDE.md §2 (UX simplicity is a feature; one place rule).
- ROADMAP.md §"M-1 PR 5.5-T05" (the audit finding this resolves).
- The April 2026 mobile-first UI/UX audit, section 3.10 (tag-vs-chip
  judgment call).
- `packages/ui/src/components/Tag/tag.tsx` (the JSDoc that codifies
  the contract).
- `packages/ui/src/components/SegmentedToggle/` (the established
  alternative for radio-group chips).

---

## ADR-044

### Component tests run on Vitest + jsdom + react-native-web alias, not Jest + React Native Testing Library

**Date:** 2026-04-26
**Status:** Accepted (clarifies CLAUDE.md §3)

### Context

CLAUDE.md §3's "Testing" block, written at project bootstrap, lists the
component-test stack as **"Jest + React Native Testing Library —
component tests"**. That line predates the actual implementation. By
the time `packages/ui` started shipping primitives, the codebase had
already standardised on **Vitest** for the domain, application, data,
and testing packages (Vitest is a hard dependency of the shared
`@cachink/config/vitest` base config). Adding a second test runner
would have meant:

- Two coverage providers (`@vitest/coverage-v8` for non-UI packages,
  `jest --coverage` for UI), two HTML reporters, two CI invocation
  paths, two watch modes.
- Two transformer pipelines: Vite/esbuild for non-UI, Babel + Metro
  preset for UI. Drift between them silently produces "passes
  locally on Jest, fails in Vitest" bugs at the package boundary.
- Duplicated mocks and fixtures: `@cachink/testing` already exports
  Vitest-flavoured contract factories under `@cachink/testing/contract`
  (ADR-033). A Jest fork of those would be a second source of truth.

Independently, ADR-042 ("Multi-step transactional flows are Stack
pages…") observed that the `.native.tsx` platform variants of
primitives like `<Modal>` import from `'react-native'` for
`KeyboardAvoidingView`, `Platform`, and `Share`. Vitest runs on Vite,
which can't parse RN's Flow-typed `index.js`. ADR-042 addressed this
in passing by aliasing `'react-native' → 'react-native-web'` in
`packages/ui/vitest.config.ts`, but the decision body of that ADR was
about modal/keyboard semantics, not test infrastructure.

The audit pass on 2026-04-26 surfaced this as a **documentation drift,
not a test gap**: 152 component test files (915 tests) ship under
Vitest+jsdom and clear the CLAUDE.md §6 70% gate (current measured:
82.19% lines / 86.94% branches / 78.5% functions / 82.19% statements).
The drift is solely that CLAUDE.md §3 still describes a stack the
codebase never adopted.

### Decision

1. **Component tests run on Vitest + `@testing-library/react` under
   `jsdom`.** This is the project-wide test runner — the same one used
   by `@cachink/domain`, `@cachink/application`, `@cachink/data`, and
   `@cachink/testing`.
2. **The `react-native` package is aliased to `react-native-web` in
   `packages/ui/vitest.config.ts`** so `.native.tsx` platform variants
   load under jsdom without parsing RN's Flow-typed entry point. The
   alias is documented inline in `vitest.config.ts` and was first
   introduced as a side-effect of ADR-042; this ADR ratifies it as the
   canonical mechanism for `.native.tsx` testing.
3. **`.native.tsx` tests assert structure / wiring, not platform-native
   APIs.** `KeyboardAvoidingView`, `Share`, `Platform`, and friends
   resolve to `react-native-web`'s plain-JS web shims under jsdom.
   Anything that requires a real RN runtime — gesture handlers,
   native modules, camera, push notifications — is covered by Maestro
   E2E flows (`apps/mobile/maestro/flows/`), not by unit tests.
4. **Jest and React Native Testing Library are NOT installed and not
   on the roadmap.** Any future PR proposing to add them needs a new
   ADR that supersedes this one.
5. **CLAUDE.md §3's Testing block is updated** to read
   _"Vitest + `@testing-library/react` under jsdom — component tests
   (see ADR-044 for the RN→RNW alias rationale)"_. The §3 edit is the
   prerequisite-checked work this ADR authorises per CLAUDE.md §0
   ("rules-grow rule") — the ADR ships first, the rule edit follows.

### Alternatives Considered

- **Add Jest + RNTL alongside Vitest, keeping CLAUDE.md §3 literal.**
  Rejected — duplicates runner, transformer, coverage, and mocking
  infrastructure for zero behavioural gain. The Vitest+jsdom +
  RN→RNW-alias setup already runs every test the proposed Jest+RNTL
  setup would, including `.native.tsx` variants.
- **Migrate UI tests off Vitest to Jest + RNTL to match CLAUDE.md §3
  literally.** Rejected — would invalidate 915 passing tests and the
  ADR-033 contract-factory infrastructure, deliver no new coverage,
  and reintroduce the Babel-vs-Vite transformer drift the project
  consciously avoided.
- **Leave the drift in place and address it ad-hoc whenever a
  contributor notices.** Rejected — the rules-grow rule (CLAUDE.md
  §0) means a stale rule is a recurring source of false-positive
  audit findings (e.g., the 2026-04-26 scanner that produced the
  finding this ADR closes). Recording the decision once is cheaper
  than re-litigating it per audit.
- **Replace the alias with a real Babel pipeline that compiles RN's
  Flow source.** Rejected — adds a Babel toolchain to the UI test
  surface, doubles cold-start time, and `react-native-web` already
  exports the surface the `.native.tsx` tests need.

### Consequences

**Easier:**

- One test runner across the monorepo. `pnpm -r test` is the entire
  story for unit/integration coverage. No per-package runner cheatsheet.
- Contract factories (ADR-033's `describe*RepositoryContract`) work
  identically when consumed from `@cachink/data` integration specs and
  hypothetical future `@cachink/ui` repository-driven tests.
- Coverage reports are produced by a single provider
  (`@vitest/coverage-v8`) and roll up cleanly per the CLAUDE.md §6
  thresholds.
- Audit tooling that grep-checks for `jest.config.*` to "verify the
  component-test stack" can now be told the right file to look at:
  `packages/ui/vitest.config.ts`.

**Harder:**

- `.native.tsx` tests cannot exercise gesture handlers or true
  native-module behaviour. This is by design — those code paths are
  the explicit responsibility of the Maestro flows. Reviewers
  rejecting a `.native.tsx` test that tries to assert
  `PanResponder` semantics is the correct outcome.
- New contributors familiar with the React Native ecosystem will
  expect `jest --testEnvironment=node` and have to learn the alias
  trick. Documented inline in `packages/ui/vitest.config.ts` (lines
  13-25) and now ratified here.

**Committing to:**

- Vitest is the project-wide test runner for unit + integration. Adding
  a second runner requires a superseding ADR.
- The `'react-native' → 'react-native-web'` alias stays in
  `packages/ui/vitest.config.ts` as the canonical mechanism for
  `.native.tsx` tests under jsdom.
- CLAUDE.md §3 is updated in the same slice that lands this ADR. Any
  future contributor reading §3 sees the current truth.
- `.native.tsx` tests stay scoped to **structure and wiring**.
  Behaviour that needs a real RN runtime is Maestro's responsibility.

### References

- CLAUDE.md §3 (Testing block, updated in the same slice).
- CLAUDE.md §6 (TDD coverage thresholds — the gates this stack
  satisfies).
- CLAUDE.md §0 (rules-grow rule — why a §3 edit needs an ADR first).
- ADR-033 (split `@cachink/testing` barrel; the contract factories
  this stack consumes).
- ADR-042 §"Decision" item 5 (introduced the RN→RNW alias as a
  side-effect of fixing modal keyboard semantics; this ADR ratifies
  the alias as the canonical mechanism for `.native.tsx` tests).
- `packages/ui/vitest.config.ts` (lines 13-25 — the alias rationale).
- `packages/config/vitest.ts` (the shared base config every package
  inherits).
- `apps/mobile/maestro/flows/` (where platform-native behaviour is
  actually verified).

---

## Deferred Decisions

These are options that were explicitly considered and **not** chosen
during a slice, but are not "rejected forever" the way ADRs catalogue.
They live here so a future contributor can revisit them without
re-doing the analysis.

### `__cachink_auth_state` table for Cloud-mode session persistence (Slice 8 M4-C17, deferred 2026-04-25)

**Considered:** adding a dedicated SQLite table to persist Cloud-mode
refresh tokens locally so power users can sign in once and skip the
re-authentication step on cold start.

**Why deferred:** Supabase's own `persistSession: true` (localStorage
on web/Tauri, AsyncStorage on RN once we wire it in Phase 2 per
ADR-037) handles refresh-token persistence today without a custom
table. Adding a separate table now would duplicate work the SDK
already does and complicate the migration story. Re-evaluate after
Phase 2 telemetry tells us how often users hit the cold-start
re-auth path; if the count is high enough to matter, a Phase 3 ADR
can introduce the table with a proper migration plan.

### Solo → LAN data import (ADR-039 wizard rewrite, deferred 2026-04-25)

**Considered:** building an in-app data import path for users who start
with `mode = 'local'` on a tablet/phone, later buy a desktop, and want
that desktop to become the LAN server with the existing tablet's data
as the seed. Two implementation options were evaluated:

- **Excel-format round-trip importer.** Parse the `.xlsx` produced by
  `useExportarDatos` back into rows. User-friendly file format. But
  format-fragile: date/money parsing, ULID regeneration, FK resolution
  across 10 entities, conflict handling for re-imports. Significant
  new code with low confidence in edge-case correctness.
- **`.bak` SQLite file copy** (from `database-backup.ts`). Lossless,
  fast, schema-aware. Filename is technical
  (`cachink.db.backup-...bak`) but renamable in the share sheet. Still
  needs UX work: file transfer between devices, pairing the imported
  DB with a new server identity (deviceId / businessId reconciliation),
  re-keying any device-bound state.

**Why deferred:** both options need design work that wasn't ready for
the Phase 1 wizard rewrite. The wizard ships an honest
**migration-deferred screen** (`packages/ui/src/screens/Wizard/migration-deferred-screen.tsx`)
visible from Step 2B's `importLink` on desktop. Copy reads:

> La migración directa de tablet a computadora llega en una versión
> próxima. Por ahora puedes:
>
> 1. En tu otro dispositivo abre Cachink → Ajustes → Exportar todos
>    los datos.
> 2. Mándate el archivo de Excel a esta computadora (correo, WhatsApp,
>    USB) para tenerlo como respaldo.
> 3. Aquí elige "Esta computadora guarda los datos del negocio" para
>    empezar limpio, o conecta esta computadora como cliente si ya hay
>    un servidor.

**Re-evaluate when:**

- A real user requests it via Settings → "Enviar comentarios"
  (`<FeedbackAction>` already routes to a dedicated bucket), or
- Phase 2 design capacity opens up to spec the file-transfer +
  deviceId reconciliation UX

**Reference:** ADR-039 §"Decisions" item 3.

### Settings → "Avanzado" submenu reorganization (ADR-039 follow-up, deferred 2026-04-25)

**Considered:** introducing an "Avanzado" expandable section in
`Settings` that holds "Re-ejecutar asistente" + "Backend avanzado" +
future advanced toggles. This was the original spec wording for the
wizard rewrite ("re-runnable from Settings → Avanzado").

**Why deferred:** Settings information-architecture is its own concern.
The current top-level "Re-ejecutar asistente" button works, has
maestro-flow coverage (`settings-re-run-wizard` testID is referenced
by `cloud-signup-signin.yaml` and `lan-pair.yaml`), and would need a
separate UX pass to design the submenu hierarchy without pushing the
Notifications / Idioma / Negocio rows further from the user's reach.

**Re-evaluate when:** the next Settings feature lands (export-import,
advanced backend, audit log) and we genuinely need a sub-shelf to keep
the screen readable. At that point, design the Avanzado submenu
holistically — don't bolt it on for one row.

**Reference:** ADR-039 §"Alternatives Considered".

### `useLanRole()` hook and `__cachink_sync_state.lanRole` scope (ADR-039, deprecated 2026-04-25)

**Status:** the hook is **retired** as of ADR-039. The sync-state
scope remains in the schema for forensic safety but is no longer read
by new routing code. Hydration-time migration in
`hydrateAppConfig` reads it once on legacy upgrades to derive
`'lan-server'` vs `'lan-client'` AppMode values, then never again.

**Cleanup task (Phase 2):** add a `0002_drop_lan_role_scope.sql`
migration that deletes orphaned rows where `scope = 'lanRole'`. Kept
in deferred-decisions rather than executed now to avoid coupling the
wizard rewrite to a schema migration that isn't strictly required for
correctness.

---

## ADR-045

### Rename `Inventario` tab → `Productos` with sub-tabs

**Date:** 2026-04-28
**Status:** Accepted

### Context

The UXD-R3 audit identified that the `Inventario` tab name was confusing for service-only and mixed businesses — users selling services had no mental model for "inventario". The tab should surface the **catalogue** (products + services) as the primary concept, with stock tracking as an opt-in sub-feature.

### Decision

1. Rename the tab from `Inventario` to `Productos`.
2. The tab has three sub-tabs: `Catálogo` (default), `Stock`, `Movimientos`.
3. Sub-tab visibility adapts to `Business.tipoNegocio`:
   - `producto-con-stock` / `mixto` → all three sub-tabs visible.
   - `producto-sin-stock` / `servicio` → only `Catálogo` visible.
4. CLAUDE.md §1 module 4 updated to reflect the rename.
5. Expo Router path changes from `/inventario` to `/productos` with a one-release redirect alias.

### Alternatives Considered

- **Keep `Inventario` and add a separate `Servicios` tab.** Rejected: would add a fourth top-level tab for something that can be handled with a type discriminator on the existing catalogue.
- **Rename to `Catálogo`.** Rejected: less intuitive for physical-product businesses that associate "productos" with their catalogue.

### Consequences

- All file paths under `packages/ui/src/screens/Inventario/` move to `packages/ui/src/screens/Productos/`.
- Import paths across the monorepo must be updated (automated via search-and-replace).
- The `tab-definitions.ts` file changes the key from `inventario` to `productos`.

---

## ADR-046

### Producto.tipo + seguirStock + Business.tipoNegocio + atributosProducto

**Date:** 2026-04-28
**Status:** Accepted

### Context

UXD-R3 introduces a "Smart Catalog" where productos can be physical goods (with or without stock tracking) or services. The UI adapts form fields and visibility based on the business type. Custom attributes allow businesses to add category-specific metadata (e.g., "talla", "color", "duración") to their products.

### Decision

**Product entity gains four fields:**
- `tipo: 'producto' | 'servicio'` — discriminator.
- `seguirStock: boolean` — opt-in stock tracking; forced `false` when `tipo='servicio'`.
- `precioVentaCentavos: bigint` — selling price for quick-sell flow.
- `atributos: Record<string, string>` — sparse key/value map for custom attributes.

**Sale entity gains two fields:**
- `productoId: ProductId | null` — optional FK to a catalogue producto.
- `cantidad: number` — multi-unit sales (defaults to 1).

**Business entity gains three fields:**
- `tipoNegocio: 'producto-con-stock' | 'producto-sin-stock' | 'servicio' | 'mixto'` — archetype.
- `categoriaVentaPredeterminada: SaleCategory` — default for quick-sell.
- `atributosProducto: AttrDef[]` — custom attribute definitions for the catalogue.

**Migration `0002_smart_catalog.sql`:** adds all columns with safe defaults. Backfills `precio_venta_centavos` from `costo_unit_centavos × 1.3` for existing products.

### Alternatives Considered

- **Separate `Servicio` entity.** Rejected: would duplicate 90% of the Product schema and complicate queries.
- **Store `precioVenta` on the Sale rather than the Product.** Rejected: the selling price is a property of the catalogue item, not the transaction. The sale stores `monto` (which may differ from `precioVenta` after discounts in Phase 2).

### Consequences

- `NewProductSchema` now requires `precioVentaCentavos`.
- `RegistrarVentaUseCase` auto-creates a salida `MovimientoInventario` when `producto.seguirStock=true`.
- UI forms adapt field visibility based on `Business.tipoNegocio`.

---

## ADR-047

### Persistent AppShell via Expo Router group layout

**Date:** 2026-04-28
**Status:** Accepted

### Context

The BottomTabBar was disappearing on certain routes (Inventario, Settings) because each authenticated route rendered its own `<AppShellWrapper>`, causing re-mount of the shell + tab bar on navigation. Additionally, screens without `<ScrollView>` could overflow into the tab bar's space, making it appear to vanish.

### Decision

1. **Shared parent layout:** Move all authenticated routes into an `(authenticated)/` group folder in Expo Router. The group's `_layout.tsx` renders `<AppShellWrapper>` once; child routes only swap the inner content.
2. **`activeTabKey` resolution:** Centralize pathname → tab-key mapping in `useActiveTabKey()` so off-tab screens (Settings, Cuentas por Cobrar) light up the correct parent tab.
3. **Scroll containment:** Every screen body that can overflow is wrapped in `<ScrollView>` to prevent content from bleeding into the BottomTabBar's space.
4. **Keyboard avoidance:** `<KeyboardAvoidingView>` wraps the children area *above* the BottomTabBar inside AppShell, so the bar stays anchored when the keyboard opens.

### Alternatives Considered

- **Tab navigator with nested stacks.** Rejected: Expo Router's file-based routing makes this awkward and would require restructuring every route.
- **Fixed positioning for the BottomTabBar.** Rejected: React Native doesn't support CSS `position: fixed`; the flex layout approach is more reliable.

### Consequences

- All authenticated routes move into `apps/mobile/src/app/(authenticated)/`.
- Wizard and role-picker routes stay outside the group (no shell).
- Desktop already uses a single-shell pattern; no changes needed beyond verification.

---

## ADR-048

### Product-only sales: `Venta.productoId` required, Ventas screen becomes inline POS

**Date:** 2026-04-28
**Status:** Accepted

### Context

Cachink's Phase 1 Ventas screen originally used a free-text form modal (concepto + monto + method). This UX was designed before the smart catalogue (ADR-046) existed. Now that every business has products with `precioVentaCentavos`, requiring users to type a concept and amount is redundant for businesses that sell catalogued items — which is all of them.

The free-text form also:
1. Broke the link between sales and inventory (no automatic stock deduction).
2. Made "Total del día" unreliable because users would type amounts inconsistently.
3. Violated the "less clicks, most value" principle — a product-card tap should be all it takes.

### Decision

1. **`Venta.productoId` is required (non-nullable).** Every sale maps to exactly one catalogue product. The `?` is removed from the domain type. `producto_id` column in SQLite has a `NOT NULL` constraint.

2. **`Venta.concepto` and `Venta.categoria` are auto-derived.** `concepto` defaults to the product name; `categoria` defaults to `Business.categoriaVentaPredeterminada`. Both are still stored on the row (denormalized for query performance + export).

3. **`Venta.montoCentavos` is auto-calculated.** `cantidad × product.precioVentaCentavos`. The user can override this in Phase 2 (discounts), but for Phase 1 the monto is derived.

4. **The Ventas screen is now an inline POS surface.** Product cards live directly on the screen; tapping a card opens a `<VentaConfirmSheet>` bottom-sheet modal with 2–3 fields (quantity, payment method, client when Crédito). The old `<NuevaVentaModal>` and `<ManualVentaForm>` are deleted.

5. **Layout:** Tablet landscape uses `<SplitPane>` — product grid left, today's sales right. Tablet portrait / phone stacks them vertically.

6. **Empty state:** When no products exist, `<VentasEmptyProductos>` renders a CTA directing the user to the Productos tab.

7. **Migration strategy:** Since the app hasn't shipped publicly, the `productoId NOT NULL` constraint was folded directly into `migration-0000.ts` (no separate migration needed). The unregistered `migration-0002` columns were also folded in.

### Alternatives Considered

- **Keep free-text form as a fallback tab.** Rejected: two input modes means more code, more tests, and confuses the user with a choice that doesn't add value. Businesses that don't have products yet get the empty-state CTA to create one first.
- **Make `productoId` nullable and allow both modes.** Rejected: introduces a "semi-structured sale" that makes financial calculations (cost of goods, margin) unreliable. A sale without a product is just a number — not useful for business intelligence.
- **Auto-create a "Generic" product for free-text sales.** Rejected: pollutes the catalogue and confuses the user when they see a product they didn't create.

### Consequences

- Every venta requires a product. Users must create at least one product before they can record sales.
- `RegistrarVentaUseCase` now validates `productoId` exists and auto-creates a `MovimientoInventario` (salida) when the product has `seguirStock=true`.
- The old `<NuevaVentaModal>`, `<VentaForm>`, and `<ManualVentaForm>` components are deleted. Callers of the old modal API (route files, tests) were updated.
- Maestro E2E flows (`venta-efectivo.yaml`, `venta-credito.yaml`) were rewritten for the inline POS interaction pattern.
- The `EditarVentaModal` remains for editing existing sales (different from the create flow).
