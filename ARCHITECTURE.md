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

| ADR             | Date       | Title                                                                         | Status                        |
| --------------- | ---------- | ----------------------------------------------------------------------------- | ----------------------------- |
| [001](#adr-001) | 2026-04-23 | Tauri 2 over Electron for desktop                                             | Accepted                      |
| [002](#adr-002) | 2026-04-23 | Expo + React Native for mobile (tablets)                                      | Accepted                      |
| [003](#adr-003) | 2026-04-23 | Tamagui as the single cross-platform UI library                               | Accepted                      |
| [004](#adr-004) | 2026-04-23 | Turborepo + pnpm workspaces as the monorepo tool                              | Accepted                      |
| [005](#adr-005) | 2026-04-23 | Layered architecture with hard boundaries                                     | Accepted                      |
| [006](#adr-006) | 2026-04-23 | Local-first as the default; sync is additive                                  | Accepted                      |
| [007](#adr-007) | 2026-04-23 | LAN sync is first-party; Cloud sync uses PowerSync                            | Accepted                      |
| [008](#adr-008) | 2026-04-23 | Supabase is Cloud-mode default, not a core dependency                         | Accepted                      |
| [009](#adr-009) | 2026-04-23 | Money stored as bigint centavos, never float                                  | Accepted                      |
| [010](#adr-010) | 2026-04-23 | ULIDs as primary keys for all entities                                        | Accepted                      |
| [011](#adr-011) | 2026-04-23 | Drizzle ORM over raw SQL or Prisma                                            | Accepted                      |
| [012](#adr-012) | 2026-04-23 | Cross-platform components live in `packages/ui`, never duplicated per app     | Accepted                      |
| [013](#adr-013) | 2026-04-23 | TDD mandatory for domain and use-case layers                                  | Accepted                      |
| [014](#adr-014) | 2026-04-23 | Spanish (es-MX) is the only launch language                                   | Accepted                      |
| [015](#adr-015) | 2026-04-23 | Two documents (CLAUDE.md, ROADMAP.md) with distinct roles                     | Accepted                      |
| [016](#adr-016) | 2026-04-23 | Brand asset management: single masters at repo root, derivatives per platform | Accepted — amended by ADR-019 |
| [017](#adr-017) | 2026-04-23 | Storybook 10 over Ladle for component docs + visual regression                | Accepted                      |
| [018](#adr-018) | 2026-04-23 | Local Husky pre-push gate replaces GitHub Actions for Phase 0/1               | Accepted                      |
| [019](#adr-019) | 2026-04-23 | Per-platform splash masters (amends ADR-016)                                  | Accepted                      |
| [020](#adr-020) | 2026-04-24 | Egresos sub-tab pattern: one modal, three tabs                                | Accepted                      |

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
Status: Accepted

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
