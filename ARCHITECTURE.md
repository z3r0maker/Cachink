# ARCHITECTURE.md — Xangarro! Decision Log

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

<!-- ADR-INDEX -->

| ADR | Date | Title | Status |
| --- | --- | --- | --- |
| [001](#adr-001) | 2026-04-23 | Tauri 2 over Electron for desktop | Accepted |
| [002](#adr-002) | 2026-04-23 | Expo + React Native for mobile (tablets) | Accepted |
| [003](#adr-003) | 2026-04-23 | Tamagui as the single cross-platform UI library | Accepted |
| [004](#adr-004) | 2026-04-23 | Turborepo + pnpm workspaces as the monorepo tool | Accepted |
| [005](#adr-005) | 2026-04-23 | Layered architecture with hard boundaries | Accepted |
| [006](#adr-006) | 2026-04-23 | Local-first as the default; sync is additive | Accepted |
| [007](#adr-007) | 2026-04-23 | LAN sync is first-party; Cloud sync uses PowerSync | Accepted |
| [008](#adr-008) | 2026-04-23 | Supabase is Cloud-mode default, not a core dependency | Accepted |
| [009](#adr-009) | 2026-04-23 | Money stored as bigint centavos, never float | Accepted |
| [010](#adr-010) | 2026-04-23 | ULIDs as primary keys for all entities | Accepted |
| [011](#adr-011) | 2026-04-23 | Drizzle ORM over raw SQL or Prisma | Accepted |
| [012](#adr-012) | 2026-04-23 | Cross-platform components live in `packages/ui`, never duplicated per app | Accepted |
| [013](#adr-013) | 2026-04-23 | TDD mandatory for domain and use-case layers | Accepted |
| [014](#adr-014) | 2026-04-23 | Spanish (es-MX) is the only launch language | Accepted |
| [015](#adr-015) | 2026-04-23 | Two documents (CLAUDE.md, ROADMAP.md) with distinct roles | Accepted |
| [016](#adr-016) | 2026-04-23 | Brand asset management: single masters at repo root, derivatives per platform | Accepted |
| [017](#adr-017) | 2026-04-23 | Storybook 10 over Ladle for component docs + visual regression | Accepted |
| [018](#adr-018) | 2026-04-23 | Local Husky pre-push gate replaces GitHub Actions for Phase 0/1 | Accepted |
| [019](#adr-019) | 2026-04-23 | Per-platform splash masters (amends ADR-016) | Accepted |
| [020](#adr-020) | 2026-04-24 | Egresos sub-tab pattern: one modal with three tabs, not three modals | **Superseded by [ADR-042](#adr-042)** (2026-04-25). The |
| [021](#adr-021) | 2026-04-24 | Egreso + MovimientoInventario dual-write via a single use-case (no transaction) | Accepted |
| [022](#adr-022) | 2026-04-24 | Barcode scanning: expo-camera on mobile, `BarcodeDetector` API on desktop web | Accepted |
| [023](#adr-023) | 2026-04-24 | Repository interfaces extend in place with `update(id, patch)` — no separate UpdateRepository | Accepted |
| [024](#adr-024) | 2026-04-24 | PagoCliente application always goes through RegistrarPagoClienteUseCase — UI never composes the payment + state-flip pair | Accepted |
| [025](#adr-025) | 2026-04-24 | Export formats: `exceljs` for Excel workbooks, `@react-pdf/renderer` for PDF reports | Accepted |
| [026](#adr-026) | 2026-04-24 | Notifications — `expo-notifications` on mobile, `@tauri-apps/plugin-notification` on desktop, unified behind a `NotificationScheduler` interface | Accepted |
| [027](#adr-027) | 2026-04-24 | Sentry crash reporting behind explicit local-first consent; default opt-out; PII scrubbing always on | Accepted |
| [028](#adr-028) | 2026-04-24 | Vite resolves `.web.*` before `.ts`/`.tsx` on the desktop target so `.native.*` files never enter the bundle graph | Superseded by ADR-032 |
| [029](#adr-029) | 2026-04-24 | LAN sync wire protocol — HTTP push/pull + WebSocket events, versioned via `X-Cachink-Protocol` | Accepted |
| [030](#adr-030) | 2026-04-24 | SQLite triggers + `__cachink_change_log` for driver-agnostic change capture | Accepted |
| [032](#adr-032) | 2026-04-24 | Vite dep scanner restricted to `index.html`; `react-native` excluded from pre-bundle on the desktop target | Accepted (supersedes ADR-028) |
| [033](#adr-033) | 2026-04-24 | Test infrastructure never lives in `@cachink/ui`'s runtime graph — split the `@cachink/testing` barrel and move `MockRepositoryProvider` out of `@cachink/ui` | Accepted |
| [034](#adr-034) | 2026-04-24 | `@cachink/ui` components use web-standard ARIA props — Tamagui 2.x removed the RN-style a11y translation layer | Accepted |
| [035](#adr-035) | 2026-04-24 | PowerSync Sync Streams as the Cloud sync engine; hybrid backend — Cachink-hosted Supabase is the wizard default, Settings → Avanzado unlocks BYO Supabase/Neon/self-hosted | Accepted |
| [036](#adr-036) | 2026-04-24 | Launch artifacts and versioning — semver floor, EAS release profiles, Tauri code signing + updater | Accepted |
| [037](#adr-037) | 2026-04-24 | `@supabase/supabase-js` as a direct dependency of `apps/mobile` for Cloud-mode Auth | Accepted |
| [038](#adr-038) | 2026-04-25 | `react-native-get-random-values` as a direct mobile dependency to polyfill `crypto.getRandomValues` for Hermes/ULID | Accepted |
| [039](#adr-039) | 2026-04-25 | Setup wizard rewrite + AppMode collapse + lan-server/lan-client split | Accepted |
| [040](#adr-040) | 2026-04-25 | Design-mock alignment — keep §1 tab contract, defer extras to Phase 2 "Más…" | Accepted |
| [041](#adr-041) | 2026-04-25 | Anchored `<Combobox>` (Tamagui Popover) replaces bottom-sheet select; install icon native modules in apps | Accepted |
| [042](#adr-042) | 2026-04-25 | Multi-step transactional flows are Stack pages, not single modals with internal tabs; KeyboardAvoidingView at the Modal primitive | Accepted (supersedes ADR-020 for the Egreso 3-tab modal in |
| [043](#adr-043) | 2026-04-26 | `<Tag>` is decorative-only; tappable-chip primitive deferred to Phase 2 | Accepted |
| [044](#adr-044) | 2026-04-26 | Component tests run on Vitest + jsdom + react-native-web alias, not Jest + React Native Testing Library | Accepted (clarifies CLAUDE.md §3) |
| [045](#adr-045) | 2026-04-28 | Rename `Inventario` tab → `Productos` with sub-tabs | Accepted |
| [046](#adr-046) | 2026-04-28 | Producto.tipo + seguirStock + Business.tipoNegocio + atributosProducto | Accepted |
| [047](#adr-047) | 2026-04-28 | Persistent AppShell via Expo Router group layout | Accepted |
| [048](#adr-048) | 2026-04-28 | Product-only sales: `Venta.productoId` required, Ventas screen becomes inline POS | Accepted |
| [049](#adr-049) | 2026-05-10 | PIN for login, Password for recovery | Accepted |
| [050](#adr-050) | 2026-05-14 | Wheel picker for bounded quantity inputs | Accepted |
| [051](#adr-051) | 2026-08-18 | First run drops the wizard; the Director bar drops "Otros" | Accepted |
| [052](#adr-052) | 2026-08-18 | "Otros" leaves the Operativo bar too — into Caja, not Configuración | Accepted |
| [053](#adr-053) | 2026-09-11 | Cachink becomes a capture client; the web portal owns everything else | Accepted |
| [054](#adr-054) | 2026-09-11 | Rebrand to Xangarro — `Xangarro` in code, `Xangarro!` in presentation | Accepted, pending IMPI trademark clearance on "Xangarro" |
| [055](#adr-055) | 2026-09-11 | GitHub Actions returns as the gate for `main`; the pre-push hook becomes its local mirror | Accepted |
| [056](#adr-056) | 2026-09-17 | The Asesor generates inside `apps/portal` on Vercel Cron; extraction to a dedicated runtime is scheduled for product phase 2 | Accepted |
| [057](#adr-057) | 2026-09-17 | The portal styles with vanilla-extract over `@xangarro/tokens` and Radix primitives; no Tailwind, no styled component library | Accepted |
| [058](#adr-058) | 2026-09-17 | The Claude Design project is the portal's specification; where it contradicts ADR-053, the architecture wins and the design is amended upstream | Accepted |
| [059](#adr-059) | 2026-09-17 | Plans are renamed to Xangarrito / Xangarro / Xangarrote, entitlement gains `capabilities`, and every LLM-backed surface ships «Próximamente» in production | Accepted |
| [060](#adr-060) | 2026-09-17 | Two entity classes — synced and portal-only — amending CLAUDE.md §11; Avisos and the Asesor feed share one `notices` table | Accepted |
| [061](#adr-061) | 2026-09-17 | The portal's database is a Supabase-shaped Postgres, and its session carries the Supabase claim shape — so the RLS path production uses is the one we test | Accepted |
| [062](#adr-062) | 2026-09-17 | Portal writes reuse the application use cases through Postgres repositories, and the table's sync scope — not the author — decides whether a write reaches the devices | Accepted |
| [063](#adr-063) | 2026-09-17 | An internal admin console, `apps/admin` at `admin.xangarro.mx`, replaces "Supabase Studio + Stripe Dashboard" as the back-office | Accepted |
| [064](#adr-064) | 2026-09-17 | Dormant free-tier accounts are archived to cold storage after 180 days, amending "the portal keeps everything forever" | Accepted |
| [065](#adr-065) | 2026-09-17 | Plan limits measure transactions per month and active products, are advisory for transactions on every tier, and are counted by the server | Accepted |
| [066](#adr-066) | 2026-09-17 | Merchant card collection through a `PaymentProvider` port (Mercado Pago + Clip); the server holds the intent, the device still writes the venta | Accepted |
| [067](#adr-067) | 2026-09-17 | Onboarding is signup → "Platícanos de ti" wizard → recommended plan; annual billing and a 14-day trial on both paid tiers at launch | Accepted |
| [068](#adr-068) | 2026-09-17 | Database scaling moves by measured triggers, reviewed monthly, amending ADR-053 §7 | Accepted |
| [069](#adr-069) | 2026-09-17 | The mobile app is a business-employee sign-in tool with no in-app selling, to satisfy App Store 3.1.1/3.1.3 and Play payments policy in Mexico | Accepted |
| [070](#adr-070) | 2026-09-17 | Every subscription payment gets a CFDI; the automation is built and wired behind a switch, and production starts with manual issuance in the SAT portal | Accepted (amended the same day after owner review) |
| [071](#adr-071) | 2026-09-17 | A linked browser is a capture device — the operator's register ("caja") runs in the portal's origin, but it is a device with its own outbox, never a portal writer | Accepted |
| [072](#adr-072) | 2026-09-17 | The operator NIP is four digits and only the owner sets or resets it; the activation code stays eight characters and the design is amended | Accepted |
| [073](#adr-073) | 2026-09-17 | A sale is a ticket: a header entity carries folio, method, client, cash tendered and cancellation; `sales` become its lines | Accepted |
| [074](#adr-074) | 2026-09-17 | Receivables are derived from two facts — fiado tickets and client abonos — and the turno's expected cash has one calculator | Accepted |
| [075](#adr-075) | 2026-09-17 | Owner-to-operator messages and operator replies are two synced tables; «De tu caja» is derived on the device; `notices` is untouched | Accepted |
| [076](#adr-076) | 2026-09-17 | The radius scale gains the dense steps 11 and 13; 15 and 17 are corrected upstream to 16 | Accepted |
| [077](#adr-077) | 2026-09-17 | `yellowRule` (#DBB80A) replaces the design's translucent divider on yellow cards | Accepted |
| [078](#adr-078) | 2026-09-17 | The sync cursor is a per-tenant counter taken under a row lock; pull pages one ordered stream; UP rows get receipts, not log entries | Accepted |
| [079](#adr-079) | 2026-09-17 | Portal sessions are server-side; throttling lives in Postgres | Accepted |
| [080](#adr-080) | 2026-09-18 | Five owner decisions: own auth with emailed links, portal-only code issuance, portal-only feature flags, Deno in CI, portal creates products | Accepted |
| [081](#adr-081) | 2026-09-18 | Inventory movements flow to every phone (UP → HYBRID); the portal records movements; portal-created products start at zero stock | Accepted |
| [082](#adr-082) | 2026-09-18 | The business's régimen is stored as its SAT code; the name bucket is derived | Accepted |
| [083](#adr-083) | 2026-09-18 | Track O's open design questions get provisional answers so the screens can close; each is reversible by the owner | Accepted, provisional |
| [084](#adr-084) | 2026-09-18 | The marketing site joins the monorepo as `apps/landing` | Accepted |
| [085](#adr-085) | 2026-09-18 | Track O's design amendments landed upstream; the operator code follows the pulled files | Accepted |
| [086](#adr-086) | 2026-09-18 | Track N utility screens are code-first under the token contract; receipts stay design-first | — |
| [087](#adr-087) | 2026-09-19 | The account's display name lives on `auth.users`; celebrations are marked in a write-once table | Accepted (decides owner action O-24; P-13, P-27, P-33) |
| [088](#adr-088) | 2026-09-19 | The Asesor's deterministic layer materialises on read, ahead of P-30's cron | Accepted (P-26; amends ADR-056's timing, not its shape) |
| [089](#adr-089) | 2026-09-20 | Régimen-aware ISR from the published SAT tables, with a reference disclaimer | Accepted (resolves finding F-2; owner asked for tables-from-the-web + disclaimer instead of waiting on O-25's contador) |
| [090](#adr-090) | 2026-09-21 | `informeMensual` moves down to Xangarro; the mock gains `over-limit`; the PAC contracted for subscription CFDIs must serve a future tenant-facing facturación add-on | Accepted |
| [091](#adr-091) | 2026-09-22 | Infrastructure failures in the console's auth flow become form state, not an unhandled throw; the console gains error boundaries | Accepted |
| [092](#adr-092) | 2026-09-22 | Analítica geográfica por estado, sin IP — un contador diario, no una bitácora de eventos; y la atribución de campaña que faltaba | Accepted |
| [093](#adr-093) | 2026-09-22 | The hero illustration ships in v1 as the handoff's own PNG, optimised — reversing ADR-058 §7 | Accepted |
| [094](#adr-094) | 2026-09-22 | Money crossing the `@xangarro/data-pg` boundary is parsed, never asserted | Accepted |
| [095](#adr-095) | 2026-09-22 | A producto with negative stock is valued at zero on the Balance — and the seed may never produce one | Accepted |
| [096](#adr-096) | 2026-09-22 | The console measures the business and can look over a tenant's shoulder — two amendments to ADR-063 row 3 | Accepted 2026-09-22 (owner decision, same day) |
| [097](#adr-097) | 2026-09-22 | One sidebar entry per destination; the duplicated pairs merge | Accepted |
| [098](#adr-098) | 2026-09-23 | The alta wizard asks how you work, not what your papers say — superseding the design's four steps | Accepted |
| [099](#adr-099) | 2026-09-20 | One SVG renderer for the receipt templates; PDF is a page of that raster | Accepted |
| [100](#adr-100) | 2026-09-23 | The root contract is rewritten against the code it governs, and its table of contents is generated | Accepted |
| [101](#adr-101) | 2026-09-23 | Activation answers one generic error, and the QR carries a 15-minute token in the fragment | Accepted |
| [102](#adr-102) | 2026-09-23 | The portal's coverage is unit + E2E merged, and a floor that only rises holds it | Accepted |
| [103](#adr-103) | 2026-09-24 | The seeded portal tenant is read-only while the viewport projects run; a spec that writes it carries `@serial` | Accepted |

<!-- END ADR-INDEX -->

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
4. **Keyboard avoidance:** `<KeyboardAvoidingView>` wraps the children area _above_ the BottomTabBar inside AppShell, so the bar stays anchored when the keyboard opens.

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

---

## ADR-049

### PIN for login, Password for recovery

Date: 2026-05-10
Status: Accepted

### Context

The current auth model uses a free-text password (≥6 chars) for daily login and a 6-digit numeric PIN only for recovery. For a mobile-first POS app targeting Mexican emprendedores, a numeric PIN is faster to enter and more natural for quick user-switching — the target audience switches users multiple times daily on shared tablets. A 6-digit numeric PIN with a dedicated number pad is significantly fewer taps than a full keyboard password.

### Decision

Swap roles — PIN becomes the daily login credential, Password becomes the recovery credential. The database keeps both hashed fields but their semantic roles are inverted:

- `password_hash` column → renamed to `pin_hash` (stores bcrypt hash of 6-digit login PIN)
- `recovery_pin_hash` column → renamed to `recovery_password_hash` (stores bcrypt hash of alphanumeric recovery password)
- `must_change_password` column → renamed to `must_change_pin` (flag for forced PIN change on first login)

Domain, application, data, testing, UI, and E2E layers all updated to reflect the new semantics. Migration 0013 handles the column renames via `ALTER TABLE … RENAME COLUMN`.

### Alternatives Considered

- **Keep password for login, add a "quick PIN" as optional shortcut.** Rejected: two credentials for login is more confusing, not less. One primary credential per action is cleaner.
- **Remove password entirely, PIN-only for everything.** Rejected: recovery needs a stronger credential since it resets the primary login method. A forgotten PIN should be recoverable with a memorized alphanumeric password.

### Consequences

- **Security trade-off:** 6-digit numeric PIN has 10⁶ combinations (vs alphanumeric password). Acceptable for a local-first app with a physical-access-only threat model — the device itself is the security boundary.
- **Migration required:** `ALTER TABLE users RENAME COLUMN` for the three columns. SQLite ≥3.25 required (all supported platforms meet this).
- **UX improvement:** QuickSwitch screen now shows a numeric keypad instead of full keyboard. Faster login aligns with CLAUDE.md §2.1 — fewer clicks, the most value.
- **All auth screens, use cases, i18n, and E2E flows updated.** No code path references the old password-for-login or PIN-for-recovery semantics.

### References

- CLAUDE.md §2.1 — UX simplicity principle
- CLAUDE.md §1 — two-role model, quick user switching

---

## ADR-050

### Wheel picker for bounded quantity inputs

Date: 2026-05-14
Status: Accepted

### Context

Every quantity input in Cachink (sale units, stock movements, recipe
multipliers, days of month) uses IntegerField — a plain text box that
opens the system keyboard. On mobile this is a 3-tap interaction
(tap field → wait for keyboard → type number → dismiss keyboard) for
values that are almost always 1–99. UX audit flagged this as a friction
point for operativos doing high-frequency POS entry.

### Decision

Add `react-native-wheely` (v0.6.0, MIT, zero dependencies, pure JS,
478 GitHub stars) and wrap it in a `WheelQuantityPicker` component.
Use this for all bounded integer quantities ≤999. Keep IntegerField for
unbounded/large numbers. Keep StepperField for ±1 threshold tuning.

### Alternatives Considered

- **StepperField only** — We already have it, but scrolling through
  20+ values with [−][+] taps is slow. Good for thresholds, not quantities.
- **react-native-wheel-scrollview-picker** (v2.0.9, 148 stars) — More
  recently updated but fewer users and less customizable styling API.
- **@quidone/react-native-wheel-picker** (301 stars) — Pulls in
  `date-fns` and `@rozhkov/react-useful-hooks` as transitive deps.
  Overkill for a simple number drum.
- **react-native-wheel-picker-expo** (v0.5.4) — Needs
  `expo-linear-gradient` which we don't have installed.
- **Build custom with FlatList + snapToInterval** — ~150 lines, no dep,
  but reinvents momentum scrolling, deceleration tuning, and item
  memoization that wheely already handles well.

### Consequences

- New dependency: `react-native-wheely` (0 transitive deps, ~8KB).
- Form state for quantity fields changes from `string` to `number`.
- All new bounded-integer fields must use WheelQuantityPicker per the
  Component README decision tree.
- If wheely ever becomes unmaintained, the wrapper isolates the swap
  to one file.

### References

- https://github.com/erksch/react-native-wheely
- packages/ui/src/components/README.md (Input selector decision tree)

---

## ADR-051

**Title:** First run drops the wizard; the Director bar drops "Otros"

**Date:** 2026-08-18

**Status:** Accepted — amends ADR-039

**Context**

A round of user feedback on the beta produced ten items. Six were UX,
one was a genuine cache bug, and three were positive. Two of the UX
items were about the same thing from opposite ends: what the app asks
before it has earned the right to ask, and what it puts in front of a
Director who opens it to check the numbers.

1. **First run led with the sync wizard.** ADR-039 made the wizard the
   boot entry point: step 1 asked "¿un dispositivo o varios?", step 2A
   asked "¿local o nube?". An emprendedora with one phone has no
   opinion on either and no vocabulary for the second. The very first
   interaction with the product was a question about network topology.

2. **The Director bottom bar ended in "Otros."** A label that means
   nothing, occupying one of four slots, while Gastos — half of the
   money story — had no tab at all.

**Decision**

_Onboarding._ `readAndMigrateMode` now defaults `AppConfig.mode` to
`'local'` **when and only when the key is absent**, and persists it.
`WizardGate` is therefore never reached on a fresh install. The boot
order becomes:

```
hydrated → FeatureDiscovery ("¡Bienvenido a Cachink!") → BusinessForm → auth gates
```

`FeatureDiscoveryGate` moved ahead of `BusinessGate` so the welcome
carousel is the first screen rather than a régimen-fiscal form. It is
still one-shot on the `discoveryShown` flag, so existing installs pass
straight through.

The wizard is **not** deleted. Every branch it had — solo/multi,
local/nube, unirse a un dispositivo existente, the help modal — is
intact and now lives at **Configuración → Sistema → "Sincronización y
dispositivos"**, which is where a user goes when they actually acquire
a second device.

_Director navigation._ `DIRECTOR_TABS` becomes
`Inicio | Ventas | Gastos | Estados`. The Otros grid was not deleted
either: `directorSettingsNavItems(flags)` renders it inside the
Settings hub, above the category cards, reusing `OtrosCard` and the
same `otros-<key>` testIDs. Operativo keeps its Otros tab — it has five
slots and a genuinely different set of tools.

**Consequences**

- The `raw === null` guard is load-bearing. Keying the default on
  `parseMode(raw) === null` instead would rewrite an unparseable stored
  value to `local` and strand a LAN or cloud install past its sync
  gate. `wizard-rerun-with-data.yaml` and
  `wizard-confirm-mode-change.yaml` cover that boundary, and
  `app-config-provider.test.tsx` asserts a stored `cloud` survives
  hydration untouched.
- E2E entry points moved. Three shared subflows now own the paths that
  changed, so no individual flow inlines them:
  `shared/first-run-onboarding.yaml` (launch → welcome → negocio),
  `shared/open-sync-wizard.yaml` (Configuración → Sistema → wizard),
  and `shared/open-director-tools.yaml` (the tool grid, role-agnostic).
- `shared/navigate-to-settings.yaml` branches on role: Operativo still
  goes via the Otros grid, Director via the top-bar cog.
- The welcome copy moved from the wizard's step-1 header to
  `discovery.title`, so "¡Bienvenido a Cachink!" is still the first
  string a new user reads and flows asserting it keep working.

**Alternatives considered**

- _Keep the wizard but hide every option except "Local."_ Rejected:
  it does not avoid the breaking change it appears to avoid. The seven
  wizard flows key off the options being hidden
  (`wizard-step1-multi`, `wizard-step1-join-existing-link`,
  `wizard-step2a-cloud`), not off Local — so the same flows break,
  and the user still gets a question screen with one answer.
- _Delete the wizard._ Rejected: LAN and cloud are shipped features
  with real users. Moving is not removing.
- _Give Director five tabs._ Rejected: Phase 1 surface area is
  deliberately fixed, and a five-slot bar on a phone is where labels
  start truncating.

**References**

- ADR-039 (wizard as boot entry point — amended here)
- ADR-045 (Inventario → Productos rename)
- `packages/ui/src/app-config/app-config-provider.tsx`
- `packages/ui/src/app/gated-navigation.tsx`
- `packages/ui/src/screens/AppShell/tab-definitions.ts`

---

## ADR-052

**Title:** "Otros" leaves the Operativo bar too — into Caja, not Configuración

**Date:** 2026-08-18

**Status:** Accepted — amends ADR-051

**Context**

ADR-051 read review item #7 as a Director problem and removed "Otros"
from that bar only. Re-reading Toni's note against the code, the ask was
unqualified: _"'Otros' debería moverse arriba, dentro de Configuración,
en lugar de estar en la barra inferior."_ The Operativo bar still ended
in a label that says nothing.

Two facts decided where it should go instead of "Configuración,
obviously":

1. **The two grids are not the same kind of thing.** The Director's held
   eleven mostly-administrative entries (usuarios, funciones,
   configuración, notificaciones, indicadores). The Operativo's holds
   three — `caja`, `caja-movimientos`, `cancelaciones` — all shift-floor
   work done many times a day, and one of them duplicated a tab that
   already existed.
2. **Configuración would have cost a tap on the most frequent path in
   the app.** That is the opposite of _the less clicks, the most value_.

There was also a vocabulary bug sitting next to it: the same `/egresos`
module was labelled **"Gastos"** for the Director and **"Pagos"** for the
Operativo, while everywhere else in Cachink a _pago_ is money coming
**in** from a client (`useRegistrarPago`, and the `Pagos` sheet of the
Excel export is `clientPayments`).

**Decision**

`operativoTabs()` drops its fifth slot: **Ventas | Caja | Gastos |
Productos**, mirroring the Director's four. The three Operativo tools
move _inside the Caja tab_ via `operativoCajaToolItems(flags)`, which is
`operativoOtrosItems` minus the self-referential `caja` entry — the exact
shape `directorSettingsNavItems` already uses to filter `configuracion`.
`CajaContent` renders them with the same `SettingsNavSection` /
`OtrosCard` the Settings hub uses, keeping the `otros-<key>` testIDs
byte-identical.

Tap count is unchanged: **Caja → tool**, where it used to be **Otros →
tool**.

The `/egresos` label is **"Gastos"** in both roles. `tabs.pagos` and
`tabs.egresos` remain in `es-mx.ts` resolving to "Gastos" so a stale
caller renders a word rather than a raw key; nothing in the repo consumes
them.

**Consequences**

- "Otros" no longer appears in any bottom bar. `OtrosScreen` and the
  `/otros` route still exist and still render — nothing was deleted, and
  the Director's grid is unchanged inside Configuración.
- `shared/open-director-tools.yaml` now discriminates on `tab-caja`
  (only the Operativo bar has it) instead of `tab-otros`, and both
  branches land on `settings-nav-section`. `shared/navigate-to-settings.yaml`
  loses its dead Operativo branch — the cog is the single entry for
  every role. The ~26 MVP flows that address `otros-<key>` cards are
  untouched, which is the whole reason the testIDs were preserved.
- `apps/mobile/src/shell/use-active-tab-key.ts` was deleted in the same
  change: nothing imported it but its own test, and its
  `'/egresos' → 'egresos'` mapping contradicted the live `deriveActiveTab`
  in `(tabs)/_layout.tsx`.

**Alternatives considered**

- _Move the Operativo grid to Configuración, symmetric with the
  Director._ Rejected: symmetric on paper, worse in the hand. It buries
  movimientos de caja and cancelaciones — mid-shift actions — behind a
  cog, to make two dissimilar grids look alike in the code.
- _Keep the Operativo Otros tab and just rename it._ Rejected: renaming
  a junk drawer does not stop it being one, and the tab was 60%
  redundant with Caja.
- _Rename the module to "Pagos" everywhere instead._ Rejected: it
  collides head-on with client payments, which are money in.

**References**

- ADR-051 (first-run + Director bar — amended here)
- `packages/ui/src/screens/Otros/otros-items.ts`
- `packages/ui/src/screens/Caja/caja-content.tsx`
- `packages/ui/src/screens/AppShell/tab-definitions.ts`

---

## ADR-053

**Title:** Cachink becomes a capture client; the web portal owns everything else

**Date:** 2026-09-11

**Status:** Accepted — amends CLAUDE.md §1 (Phase 1 module list) and §2.2
(local-first). Parks ADR-035 (PowerSync) and the LAN-sync runtime.

**Context**

Cachink shipped as a standalone, local-only app: a device held the whole
product — capture, accounting, dashboards, users, settings — and cloud
sync was an optional extra layered on top. Two years of that shape
produced 33 screens and ~31k lines of screen code, of which roughly a
third is administration and reporting that a phone is a poor host for.

The product intent has changed. Cachink is now **the capture surface of a
larger service**: the phone registers ventas, egresos, and movimientos de
inventario on the shop floor, and a responsive web portal owns everything
else — identity, roles, business configuration, catalog management,
dashboards, financial statements, and billing. Subscriptions are sold and
renewed on our own site, not through the app stores.

This is not a new architecture so much as a subtraction. The Operativo
role already _is_ the capture app: its bar reads
`Ventas | Caja | Gastos | Productos`, which is the target product almost
exactly. The work is deleting the Director half, moving administration to
the web, and adding activation plus an upload path.

**Decision**

### 1. The app is strictly single-role

The `role` dimension is removed, not narrowed. There is no Director build
of the app, no role branching in `tab-definitions.ts`, no
`otros-items-director.ts`, and no `auth.role` scoping in the sync streams.
A director who wants to register a sale signs in as an ordinary capture
user. Roles continue to exist as a concept — they are assigned and
enforced **in the web portal**.

`RolePicker` is deleted. `DirectorHome`, `DirectorSetup`, and
`UserManagement` move to the web.

### 2. First run is: email + code → capture

The wizard leaves the app. A fresh install shows one activation screen:
the user enters the email they signed up with on the website and the code
that was mailed to them. On success the device receives a `business_id`
and a signed entitlement (§5) and goes straight to Ventas.

Business name, tipo de negocio, ISR rates, tipos de pago, feature flags,
employees, and users are all configured in the portal and arrive on the
device as reference data. `Wizard`, `BusinessForm`, `FuncionesNegocio`,
and `CloudOnboarding` move to the web.

### 3. Surface split

**Stays (floor work):** Ventas, Egresos, Caja + turnos, Checkout,
CorteDeDia, Cancelaciones, Login (PIN only), AppShell, ConsentModal.

**Stays but dormant** (MVP flag-off; these are physical floor work and
belong to capture when re-enabled): Merma, Conversion, Auditoria.

**Moves to web:** Estados, DirectorHome, Wizard, CloudOnboarding,
Telemetria, BusinessForm, Otros, UserManagement, FuncionesNegocio,
CajaReportes, DirectorSetup, MermaReportes, Notificaciones.
**Deleted:** RolePicker.

**Split down the middle** — each keeps a thin capture seam on the device
because forcing a trip to a laptop mid-shift violates _the less clicks,
the most value_:

- **Inventario/Productos.** The app keeps stock view, movimientos,
  barcode scanning, and a **quick-add** that creates a minimal product
  inline, plus on-device stock-low notifications. The portal owns full
  catalog management: pricing, attributes, archive, the product icon set,
  and **bulk import from Excel**.
- **Clientes.** The app keeps a picker and quick-create for crédito
  sales. The portal owns client management and history.
- **Settings.** Split by what owns the value, not by topic. Tenant data
  (business profile, ISR, tipos de pago, indicadores, empleados) → web.
  Device data (sound, crash reporting, notifications, bug report, export,
  activation and sync status) → app.

`Estados`' UI moves, but the NIF B-2/B-3/B-6 calculations and the KPI
logic **stay in `packages/domain`** and are consumed by the portal.

### 4. The website lives in this monorepo

The portal is a workspace in this repo so it imports `@cachink/domain`
directly. Reimplementing NIF accounting in a second codebase would
guarantee drift between what the phone captures and what the portal
reports. This is the single constraint that makes the split safe.

### 5. Entitlement: two clocks, never a lock-out

The server issues a **signed entitlement** (`business_id`, `valid_until`,
`grace_until`) that the device verifies offline against a public key and
refreshes on every successful sync. Two independent clocks govern it:

- **Payment grace (~7 days):** the server _says_ expired. Banner; full
  capture continues. Mexican SMBs pay by SPEI and OXXO, which confirm in
  hours or days, so a paid-up user routinely looks unpaid for a while.
- **Offline staleness (~30 days):** the server _has not been reachable_.
  A paid user in a market stall with no signal must never be locked out
  by our inability to phone home.

When both expire the app degrades to **read-only plus export**. Data is
never deleted, never locked, never held hostage. The user can always see
and export their own books.

### 6. Sync is a hand-rolled outbox; PowerSync is parked

Capture data is append-mostly: a venta is a fact, not mutable state. That
makes general bidirectional sync the wrong tool.

- **Upstream (device → cloud):** an append-only outbox. Every record
  carries a client-generated UUID and is idempotent on it. Retry forever;
  exactly-once by construction; conflicts structurally impossible.
- **Downstream (cloud → device):** reference data only — catalog,
  business config, entitlement. Small, infrequent, last-write-wins.

`packages/sync-cloud` (PowerSync + Supabase, ADR-035) is **commented out
of the code path, not deleted.** Its stream descriptors document the
scoping model and stay as reference. Retained on disk, unreferenced at
runtime.

`packages/sync-lan` is likewise **parked, not retired** — code stays,
nothing mounts it. The cloud is the backbone now.

### 7. Multi-tenancy: shared schema, `business_id`, RLS

Confirmed as-is from ADR-035. One Postgres database, one schema,
`business_id` on every row, enforced by **Postgres RLS** rather than
application-level filtering. This carries thousands of tenants.

The escalation path, and the discipline that keeps it cheap:

1. **Now** — shared DB + RLS.
2. **Growth** — `business_id` as the _leading_ column of every index;
   read replicas; a separate read model for portal analytics so reporting
   never contends with capture writes.
3. **Scale** — shard by tenant via a `business_id → shard` routing table,
   or Citus.

Rules that keep step 3 from becoming a rewrite, binding from today: never
join across tenants; `business_id` on every table including join tables;
client-generated UUIDs and no reliance on global sequences; no query
reachable without a tenant predicate. **Schema-per-tenant is rejected** —
it reads as isolation and becomes migration debt past a few hundred
tenants.

### 8. Local retention

With the cloud as the archive and no Director reporting on the device,
the 90-day window of ADR-035 becomes the _only_ window. The local SQLite
database gets a real retention policy instead of growing without bound.

**Consequences**

- CLAUDE.md §1 no longer describes the app. Estados Financieros,
  Indicadores, and Director Home leave the module list; a web portal
  workspace joins the structure. **CLAUDE.md is edited by humans only —
  this ADR is the authorisation, not the edit.**
- CLAUDE.md §2.2 ("local-first ... never prerequisites") is amended:
  activation requires one network round-trip, and continued use requires
  periodic reachability under §5's two clocks. Between those bounds the
  app remains fully offline-capable, which is the part that mattered.
- Roughly 11k of ~31k lines of screen code leave the app.
- App-store risk moves to the top of the register. Signing in to a
  subscription sold on our own site is standard B2B practice (Apple
  Guideline 3.1.3(b) multiplatform services). **In-app steering toward
  external purchase is the exposed part.** The app therefore ships with
  no purchase UI and no checkout link — activation and a neutral status
  message only. Any outbound link is feature-flagged by storefront, and
  the current rules for the Mexican storefront must be verified rather
  than assumed. A working demo account is kept for review.
- `sync-cloud` and `sync-lan` remain in the build graph as typechecked
  but unmounted packages. They must not silently rot: either keep their
  tests green or mark them explicitly excluded.

**Follow-ups**

- `packages/ui/src/screens/Inventario/` and `Productos/` hold ten
  duplicated files — eight byte-identical, two (`producto-detail-popover`,
  `producto-detail-route`) diverged, with the live copies in
  `Inventario/` and the drifted copies unused. The comment at
  `screens/index.ts:18` is false. Consolidate into `Productos/` before
  the catalog split lands (CLAUDE.md §2.3).
- ROADMAP.md's "last updated" still reads 2026-04-28 against commits
  through September; it needs a truthful reset alongside this pivot.
- Ventas Maestro flows still exercise the removed SessionStrip → TotalBar
  UI and must be re-scoped to the inline POS or dropped.

---

## ADR-054

**Title:** Rebrand to Xangarro — `Xangarro` in code, `Xangarro!` in presentation

**Date:** 2026-09-11

**Status:** Accepted, pending IMPI trademark clearance on "Xangarro".
Does not amend ADR-053; the two land in sequence.

**Context**

The product is being renamed from **Cachink!** to **Xangarro!**
(`xangarro.mx`), positioned as _"Finanzas para tu negocio — la app que le
da flujo a las PyMEs de México."_ The brand keeps the trailing
exclamation mark and the existing yellow-on-black palette.

The exclamation mark is not cosmetic from an engineering standpoint. F0-T02
recorded that a `!` anywhere in the workspace path triggers
`Encoding::CompatibilityError` in CocoaPods under a non-UTF-8 locale; the
abandoned `~/Downloads/Cachink!` checkout next to the live one is the
scar. Carrying the bang into code would reproduce a bug we have already
paid for once.

Both names carry meaning, but of different kinds. _Cachink_ is
onomatopoeia for a cash register — which is why a branded _cha-ching_
sound ships in `apps/mobile/assets/sounds/cachink.mp3` behind
`Settings/cachink-sound-toggle.tsx`. _Xangarro_ is wordplay on
**changarro**, Mexican colloquial for a tiny corner business. It names
the _customer_ rather than the sound of a sale — sharper positioning for
"finanzas para tu negocio", and unmistakably Mexican in a way an English
onomatopoeia never was. What it does not do is describe a noise.

**Decision**

### 1. Two forms, one rule

**`Xangarro`** — no bang, no diacritics — is the only form permitted in
anything a machine parses:

| Surface                         | Value                   |
| ------------------------------- | ----------------------- |
| Workspace scope                 | `@xangarro/*`           |
| iOS / Android bundle            | `mx.xangarro.mobile`    |
| Tauri identifier                | `mx.xangarro.desktop`   |
| Expo `slug` / `scheme`          | `xangarro`              |
| Repo + all directory names      | `Xangarro` / `xangarro` |
| testIDs, env vars, DB filenames | `xangarro`              |

**`Xangarro!`** — with the bang — is for humans only: Expo `name`, Tauri
`productName`, store listing titles, in-app copy, `es-mx.ts` strings,
logos, marketing, and the landing site.

The rule is mechanical: **if a compiler, shell, package manager, or
filesystem reads it, no bang.**

### 2. Identifiers change immediately; the sweep waits

Bundle identifiers are **immutable once published** — changing one after
release means a new store listing and the loss of every review, ranking,
and install. The app is not yet published (`eas.json` carries an
`appleTeamId` but no `ascAppId`; preview is `distribution: internal`; and
`docs/landing/index.html` still points at the placeholder
`apps.apple.com/mx/app/cachink/id0000000000`). The identifier change is
therefore free today and impossible later. **It happens now.**

The wider string sweep does not. Of 1,222 files containing "cachink",
**592 sit in `packages/ui`** — the exact surface ADR-053 removes. The
order is **ADR-053 teardown → rename sweep**, so the sweep never touches
code that is about to be deleted.

### 3. History is not rewritten

`ARCHITECTURE.md` is append-only. ADR-001 … ADR-053 say "Cachink" because
that was the product's name when those decisions were taken. They stay as
written, as does `ROADMAP-archive.md`. This ADR is the pointer that
explains the discontinuity.

### 4. testIDs move atomically with their flows

Any testID carrying the name is referenced by Maestro flows under
`apps/mobile/maestro/flows/`. Renaming a testID without its flow silently
breaks E2E coverage, so both change in a single commit or neither does.

### 5. Local data paths are a migration, not a rename

`mx.cachink.desktop` determines where the desktop SQLite database lives
(`~/Library/Application Support/mx.cachink.desktop`). Changing the
identifier orphans the data of every existing install; the Expo `scheme`
change likewise breaks existing deep links. While the product is in
prebeta on partner devices this is accepted **as a deliberate cost**, not
absorbed as a surprise. Should the rename slip past first public release,
a directory-migration step becomes mandatory.

### 6. Asset rework, and a pipeline to restore

ADR-016 designates `assets/brand/` the single source of truth, with
derivatives copied out to each app. **Four of its five documented masters
are missing from disk and from git** — `icon.png`, `logo.png`,
`splash-mobile.png`, and `splash-desktop.png` are described in
`assets/brand/README.md` but only `icon-padded.png` survives. The
derivatives still exist in the apps; the originals they came from do not.

The rebrand replaces all of them anyway, so this is the moment to
**restore the pipeline rather than work around it**: land the new masters
complete, and regenerate derivatives from them per ADR-016.

The four role illustrations in `assets/brand/`
(`role-{operativo,director}-{dark,light}.png`) are **not redrawn** —
ADR-053 removes the role concept from the app and deletes the picker that
consumed them.

### 7. The sound loses its pun

The _feature_ keeps its rationale: an audible confirmation that a sale
registered is genuinely useful on a noisy shop floor, and nothing about
the rename changes that. What breaks is only the **naming**.
`cachink.mp3` and `cachink-sound-toggle.tsx` are named for the noise
itself, and `xangarro.mp3` would carry a pun the new brand does not make
— _changarro_ names the shop, not the register.

So the sound survives under a neutral name (`sale-confirm.mp3`,
`SaleSoundToggle`), decoupled from the wordmark for good. Whether to
commission new audio for the brand is a product decision and explicitly
**not** part of the mechanical sweep.

### 8. The palette survives

`theme.ts:16` is `#FFD60A` ("Amarillo Vibrante — hero color"), matching
the mobile splash and Android adaptive-icon backgrounds. The new identity
is the same yellow-on-black. The exact hex is to be confirmed against the
final brand master, but the rebrand is a wordmark and artwork change, not
a palette change.

**Consequences**

- Bundle identifiers, workspace scope, and directory names change ahead of
  the string sweep, so the repo briefly reads `Xangarro` in its
  identifiers and `Cachink` in its copy. This is intended and temporary.
- Every developer re-clones or renames their working directory. **No path
  may contain `!`.**
- Existing prebeta installs lose local data on the desktop identifier
  change and must be re-activated.
- `assets/brand/README.md` needs rewriting once the masters land, since it
  currently documents files that do not exist.
- The name is not yet cleared at IMPI. Should clearance fail, everything
  above is reversible except any store listing published under
  `mx.xangarro.*` — which is one more reason the identifier change must
  precede publication, not follow it.

**Follow-ups**

- IMPI trademark search on "Xangarro"; register `xangarro.mx`.
- Product decision on the confirmation sound (§7).
- New brand masters at the sizes ADR-016 specifies, then regenerate
  derivatives and store screenshots (`docs/store/screenshots/` currently
  holds only a README).
- Update `docs/store/listing-app-store.md` and `listing-play-store.md`.

---

## ADR-055

**Title:** GitHub Actions returns as the gate for `main`; the pre-push hook becomes its local mirror

**Date:** 2026-09-11

**Status:** Accepted — supersedes the decision of ADR-018 (its reasoning stands; its trigger has fired)

**Context**

ADR-018 removed `.github/workflows/ci.yml` for a solo-developer phase and
named its own revisit condition: "a second contributor joins the repo".
The Xangarro pivot (ADR-053) is executed as parallel tracks in separate
sessions branching from `main` (docs/plan/00-README.md §1). That is
several contributors, each of whom can push a red `main` for the others.
A local hook cannot protect a shared branch from a machine it does not
run on.

**Decision**

`.github/workflows/ci.yml` gates every pull request and every push to
`main` with typecheck (building referenced packages first), unit tests,
root script tests, and lint. The job is named `ci` so branch protection
can require it by that name. `.husky/pre-push` stays, but as a local
mirror of the same steps, not a replacement — ADR-018's "harder"
consequence (gates only run where hooks are installed) is exactly the
failure mode being closed.

Two temporary carve-outs, removed together by task F-09: lint for
`@xangarro/ui` is reported but not blocking, and the pre-push hook
excludes the same package, because 29 pre-existing violations there
predate the gate. Every other package lints clean today and is blocking
from the first run.

Maestro E2E does **not** gate merges. It runs on demand
(`maestro-e2e.yml`, `workflow_dispatch`) until one run has been watched
to completion on GitHub's macOS image; only then is a schedule worth
paying for.

**Consequences**

- Coverage thresholds and Storybook visual snapshots remain manual, as
  ADR-018 left them. Adding them to CI is a separate decision.
- Renovate's `automerge` stays off; a green `ci` check is a prerequisite
  for turning it back on, not a substitute for the decision.
- `git push --no-verify` no longer weakens the shared branch: the server
  side gate is the one that counts.

---

## ADR-056

**Title:** The Asesor generates inside `apps/portal` on Vercel Cron; extraction to a dedicated runtime is scheduled for product phase 2

**Date:** 2026-09-17

**Status:** Accepted — names its own revisit trigger (see *Phase 2*)

**Context**

The portal design project ships an **Asesor** surface (Para ti, Metas,
Diagnóstico) that is sold as the primary differentiator between the three
plans: Xangarrito gets one aviso per week, Xangarro a daily "Para ti"
plus conclusions on the estados financieros, caja-difference explanations
and Metas, and Xangarrote adds a monthly Diagnóstico, the "¿Me alcanza?"
forecast and a written estrategia. The decision to build all of it,
including the generative parts, was taken in the plan interview of
2026-09-17.

Most of what the design draws is deterministic: cost deltas, category
baselines, staleness windows, duplicate detection, margin math and goal
pacing. Those are SQL plus functions that already exist in
`@xangarro/domain` — the same functions `packages/ui/src/screens/Estados`
renders and that P-14 instructs implementers to locate rather than
reimplement. A minority is genuinely generative: the Diagnóstico prose,
the estrategia, and the "importa tu catálogo con una foto" vision step.

Nothing in Track B funds a scheduled job. The work needs a runtime, a
trigger, and a home for the model credentials.

**Decision**

Generation runs as a **route handler inside `apps/portal`**, invoked by
**Vercel Cron** declared in the same `vercel.json` that P-01 already
creates, in the same `iad1` region as the rest of the deployment.

- **One business per invocation.** The cron entry enqueues; it does not
  loop over tenants inside a single request. This is a structural
  requirement, not a performance note — a monthly Diagnóstico over a
  year of history plus a model call will not fit a single request
  budget, and the design already renders `diagState: 'generating'`, so
  asynchronous production is what the screens expect.
- **Cadence derives from `capabilities.asesor`** (the plan-level enum
  added in the same amendment as the plan-id rename). A daily job
  selects the businesses that are due; the tier decides how many rows
  get written and how often, never what the store looks like.
- **Output is `notices` rows with `source='asesor'`** — the single
  notice entity shared with Avisos. No separate insight table.
- **The deterministic layer is computed from `@xangarro/domain` and the
  generative call is the last step**, prompted from the values those
  functions produced. A figure may never be computed twice by two
  different paths: what the Diagnóstico asserts and what Estados
  financieros displays are the same number or the feature is worse than
  not shipping.

**Alternatives considered**

- **Supabase Edge Function + `pg_cron`.** Rejected: the Deno runtime
  cannot consume the TypeScript workspace packages the analytics live
  in, so the margin and NIF math would be duplicated in SQL or Deno.
  That is the CLAUDE.md §2.3 duplication rule violated on the most
  correctness-sensitive code in the product, and it splits the model
  credential across two secret stores.
- **A separate worker service.** Rejected for now: a second deploy
  target, a second observability wiring and a second set of database
  credentials, bought before any evidence that the portal's runtime is
  the constraint. Its strongest argument — that slow vision and
  Diagnóstico jobs contend with interactive page renders — is real but
  is an argument for acting when it bites, not before.

**Consequences**

- `packages/observability` and the Sentry wiring the portal already
  carries cover the Asesor for free; B-18 extends to the cron handler
  with no new integration.
- The model credential lives in one place, in the portal's Vercel
  environment, and is never exposed to the browser.
- Prompt inputs are tenant-controlled strings (product names, expense
  concepts, uploaded photographs). Treating them as data rather than
  instruction is a requirement of the generative task, not an optional
  hardening step.
- Any text the model produced carries the «Asesor» marker and the
  «Generado con IA a partir de tus registros» footer, per the design
  plan §6. Deterministic insights must **not** claim AI authorship.
- Vercel function limits become a real operating constraint. The
  one-business-per-invocation rule is what keeps them survivable.

**Phase 2**

Extraction to a dedicated runtime (`apps/api`, per the pre-existing
Z-04 task) is **planned, not conditional on failure**. It lands in
product phase 2 — the same phase that carries ventas a crédito — and a
superseding ADR records the move at that point. Z-04's existing triggers
stand as early-exit conditions if any fires sooner: sync p95 latency
above 800 ms at the handler, Vercel function limits reached, or a second
client needing the API without the portal.

---

## ADR-057

**Title:** The portal styles with vanilla-extract over `@xangarro/tokens` and Radix primitives; no Tailwind, no styled component library

**Date:** 2026-09-17

**Status:** Accepted — amends the stack named in `docs/plan/04-portal.md` P-01

**Context**

P-01 as originally written scaffolded `apps/portal` with Tailwind plus
`shadcn/ui`. The portal design plan forbids both in §2b: «no librerías de
componentes con estilo propio, no Tailwind por defecto sin mapear
tokens». Its Fase 5 verification adds a value auditor that fails on any
colour outside the tokens, any radius off the 8/10/12/14/16/18/20/22
ladder, any shadow with blur, and any border that is not 2 or 2.5 px.

That auditor already exists. `scripts/design-lint/` enforces
`token/hex-offscale`, `token/hex-inline-duplicate`, `token/rgba-literal`,
`token/radius-offscale`, `token/borderwidth-offscale`,
`token/soft-shadow` and `token/fontsize-literal`, plus a11y rules for
44 px targets and `gray400`-as-text. It imports `colors` and `radii` from
the theme so that, in its own words, "the linter can never drift from the
design system it enforces", it ratchets against
`.design-lint-baseline.json`, and that baseline currently reads
`total: 0`. Its rules are line regexes over raw source matching camelCase
properties — `borderRadius`, `borderWidth`, `shadowRadius`, `fontSize` —
and its `ROOTS` are `packages/ui/src` and `apps/mobile/src`.

`packages/ui/src/theme.ts` is the real token source: 275 lines, zero
imports, and the only place carrying the contrast-verified `textMuted`,
`greenText`, `redText`, `blueText` and `warningText` values that
`tests/theme.test.ts` recomputes on every run. The design system's
`colors_and_type.css` is a derived artifact — its own header says so —
and a stale one: it lacks those five tokens plus `purple`, `cyan` and
`scrim`, and its `.t-muted` rule sets body text to `var(--gray-400)`,
which `theme.ts` annotates "NOT text". Every `.dc.html` prototype
re-declares the missing tokens inline for exactly this reason.

**Decision**

- **Behaviour comes from Radix UI primitives used directly** — Dialog,
  Popover, DropdownMenu, Tabs, RadioGroup, Select, Tooltip. No shadcn
  styled layer. `shadcn/ui` is Radix plus Tailwind classes; taking Radix
  alone adopts the engine and discards only the skin, which the design
  contract requires discarding anyway. The behaviours the design
  specifies — drawer dismissal on backdrop, close button and Escape;
  dropdowns closing on outside pointerdown with `aria-expanded`; tabs
  with `aria-selected`; `role="radio"` groups — are the ones that are
  genuinely hard to hand-write correctly.
- **Styling is vanilla-extract** (`.css.ts`). Because its style objects
  are TypeScript with camelCase properties, the existing design-lint
  rules match them unchanged. `scripts/design-lint/index.ts` gains
  `apps/portal/src` in `ROOTS`, and two new rules cover the CSS-shaped
  `border` shorthand and `boxShadow`. The portal joins the existing
  ratchet rather than needing a second auditor built against a CSS
  parser and then kept in agreement with the first.
- **Tokens move to a new zero-dependency `packages/tokens`
  (`@xangarro/tokens`).** `packages/ui/src/theme.ts` becomes a re-export,
  so none of its fifteen existing consumers change and the mobile app is
  untouched. `tests/theme.test.ts` moves with the tokens and therefore
  guards both consumers. The extraction is also the moment to split the
  file, which is 275 lines against the §2.6 ceiling of 200.
- **The portal depends on `@xangarro/tokens`, never on `@xangarro/ui`.**
  `theme.ts` is pure, but the package around it is not: it pulls
  `@xangarro/application`, `@xangarro/data`, `drizzle-orm`, `exceljs`,
  `jspdf`, `@react-pdf/renderer`, `html2canvas`, `bcryptjs` and
  `@sentry/browser`. None of that belongs in a Next.js install closure
  for 275 lines of constants.
- **`@xangarro/tokens/css` emits the `:root` custom properties** as a
  build artifact, and DESIGN_CONTRACT.md's token table is generated from
  the same source so the contract cannot drift from the code it governs.

**Gate.** Fase 0 carries an explicit spike: scaffold the portal on
`next@16` with `@vanilla-extract/next-plugin` and confirm both `build`
and `dev`. The plugin is webpack-shaped and was last published
2026-04-12, with its most recent prerelease tagged
`fix-broken-webpack-externals`, while Next 16 defaults to Turbopack; its
peer range is `>=12.1.7`, so npm will not warn. If the spike fails and
`--webpack` is not acceptable, the fallback is CSS Modules plus a
purpose-built CSS auditor, budgeted as a Fase 0 task rather than
discovered in Fase 5.

**Alternatives considered**

- **Tailwind + shadcn/ui** (P-01 as written). Rejected: Tailwind ships a
  default palette, a blurred shadow scale and a radius scale that does
  not match the ladder — precisely the values the Fase 5 auditor exists
  to reject. Overriding them is possible but means maintaining a
  permanent deny-list against a library whose value is its defaults.
- **CSS Modules.** Rejected: the token rules cannot see `.module.css`,
  so the portal would need a second auditor; and `var(--yellow)` is an
  unchecked string, so a typo silently drops the property — which in
  this design means a missing black border nobody notices in review.
- **Shipping `colors_and_type.css` as the portal's stylesheet.**
  Rejected: it inverts the direction of truth and imports the stale
  file's defects, including the `gray-400`-as-text rule.

**Consequences**

- The portal starts under the same ratchet as the rest of the repo, at
  `total: 0`, gated by the CI job ADR-055 established.
- `recipes` can express the scales as types — radius restricted to the
  ladder, border to `2 | 2.5` — so the contract is enforced at compile
  time, not only after the fact.
- One more build plugin on the Renovate treadmill, and a Next major
  upgrade now has a second thing to verify.
- Table, Toast, the segmented tab bar, the money input and the charts
  are hand-built. Recharts still covers charting per P-01.

---

## ADR-058

**Title:** The Claude Design project is the portal's specification; where it contradicts ADR-053, the architecture wins and the design is amended upstream

**Date:** 2026-09-17

**Status:** Accepted — does not amend ADR-053; resolves conflicts against it

**Context**

The design project `5dd266f3-42e7-403f-b941-95c8e6551dc6` carries twelve
portal screens, a design system, and a `Plan de implementación` that
states the governing rule: «El diseño no es inspiración: es la
especificación. Si el código y el diseño no coinciden, el código está
mal.» It also states the exception, in §6: «Cuando un requisito del
diseño choque con el código existente, el agente se detiene y pregunta;
no improvisa una tercera opción.»

Several requirements do collide with decisions already executed. The
design descends in part from a brief written against the Cachink-era
architecture, and its design-system README still describes Tauri,
PowerSync and the Operativo/Director role split — all archived by F-02,
F-03 and F-07. The reconciliations below were settled in the plan
interview of 2026-09-17.

**Decision**

The design governs everything visual: structure, measurement, colour,
typography, copy, interaction, states and accessibility, at the eight
conditions the plan's §1 lists. ADR-053 governs data flow, sync and
device scope. The following nine conflicts resolve in favour of the
architecture, and the design files are amended upstream in the design
project before the corresponding code is written — never edited in the
repository.

1. **Sincronización loses its four mode cards.** «Solo este dispositivo
   · En la nube · Conectar a un servidor local · Ser el servidor local»
   are strings inherited from the mobile sync chip; the design-system
   README lists them verbatim under *Voice samples*. A browser has no
   local SQLite, so "solo este dispositivo" is not a state a web portal
   can occupy, and "ser el servidor local" would require the desktop app
   F-02 archived. The screen becomes read-only sync health: per-device
   last push and pull, pending counts, the rejected-rows table with
   `ERROR_CATALOG` messages, "Marcar como resuelto", and the history
   log — which is what P-11 already specified. The onboarding wizard
   drops its step 3 and runs four steps instead of five. The Resumen
   card also loses "Conflictos por resolver", because ADR-053 Q6 records
   that no conflict class exists.

2. **The portal never writes a transactional table.** `scope.ts` lists
   `sales`, `expenses`, `inventory_movements`, `cancelacion_logs` and
   the rest as `UP_TABLES` — device to cloud — with no down path, and
   C-08 froze it. The design's "Nueva venta", "Nuevo gasto", the
   drawer's "Cancelar", Productos' "Ajustar inventario" and "Registrar
   movimiento", and Empleados' "Registrar nómina" are all removed. The
   design brief's own §8 already said so: "the portal only views them".
   Two writers on one table would create the first conflict class in the
   system, which the entire outbox design presumes does not exist. A
   portal-created venta would also carry no device, operator, turno or
   folio — every field its own detail drawer displays.

3. **Nómina becomes a read-only view.** Payroll is captured on the phone
   as a nómina-category gasto (ADR-053 §3). The tab groups those
   expenses by period, and the header chip "Nómina de la semana por
   pagar" is derived: expected, from the sum of employee salaries,
   against recorded, from the nómina gastos. The design's own footer
   note — that each payroll payment is also recorded as a gasto —
   already describes this relationship.

4. **Operators keep permissions and lose roles.** A-03 and A-17 are
   rescoped: they remove `role` and `UserRoleEnum` as planned, but
   **preserve** `UserPermissionsSchema`, which is not deprecated and
   carries `canCancelSales`. ADR-053 Q1 makes the app single-role; it
   does not require every operator to hold identical powers, and since
   cancellation stays on the phone, who may cancel is a portal decision
   with cash attached. `canUserCancelSales` loses its role argument.
   `users` is already a `DOWN_TABLE`, so permissions ride a row that
   flows down and no contract change is needed. The design's uppercase
   role label and its "Escritorio" operator state pill are removed; the
   latter presumes a desktop client that no longer exists.

5. **Empleados ships two tabs, not three.** Asistencia is cut from v1:
   nothing produces attendance data. There is no clock-in anywhere, and
   ADR-053 §3 fixes the app's surface. Deriving hours from `caja_turnos`
   would cover a minority — the design's own KPIs say two of five
   employees have app access — leaving a grid that is structurally blank
   for the rest, and manual entry would decay until "Horas de la semana
   168 h" became a confidently wrong number on a screen whose job is
   trust. Revisit when a customer with "Por horas" employees asks how
   their pay is computed; that question will also reveal which capture
   surface they want.

6. **Fase 8 ships in full, including rachas.** The design-system
   README's «No gamification, no streaks, no emoji confetti» is
   superseded: the designer already relaxed it twice, in the onboarding
   confetti and in the Asesor. The *sello* is the brand's own metaphor —
   every pressable element stamps — so a seal awarded on a goal is that
   metaphor paying off at its largest scale. One constraint attaches:
   the streak metric must not be protectable by junk entry. Measure
   goals met per month, not days with a record; a streak on "days you
   recorded something" rewards recording something, which corrupts the
   data the product exists to keep true.

7. **The hero illustration does not ship in v1.** `hero-taqueria.png`
   was generated from a text prompt and the handoff says to replace it
   with a licensed or commissioned asset before shipping. Commissioning
   it now would put a second external dependency on the X-07 → X-05 →
   X-10 chain, which is already blocked on external logo work. The auth
   panel's flex column reflows around the four-scene looping animation,
   which is the block that actually demonstrates the product. Commission
   in parallel; land post-launch at the specified 2.5:1 ratio with the
   right third empty.

8. **Both typefaces are self-hosted, and 800 is the portal's maximum
   weight.** Anton and Plus Jakarta Sans are Google Fonts under the SIL
   OFL; the design files load them over the network and production must
   not. `theme.ts` exports `weights.black: 900` and the design-system
   README asks for 900 headings, but Google Fonts tops out at 800, so
   900 renders as synthetic bold — inconsistently across engines. Every
   prototype uses 800. Whether `theme.ts` drops `black` is a separate
   question, because it touches the phone.

9. **Screens are presentational; containers fetch.** Fase 3 requires
   that every state can be forced «sin tocar código», while the
   handoff requires deleting the prototype's state-switching FAB and its
   `panelOpen` state. Both hold only if the screen is a pure component
   taking `{ state, role, data }` and a server component resolves the
   request lifecycle above it. Forcing then means rendering with fixed
   props — in Storybook, in Playwright, and via a development-only
   affordance compiled out of production. Fase 5's 4 states × 3 roles
   sweep becomes a loop over props rather than twelve sign-ins.

**The design reference is committed and read-only.** The twelve
`.dc.html` files, the `_ds/` folder, `assets/hero-taqueria.png` and the
design tool's runtime (`support.js`, `doc-page.js`, `image-slot.js`,
`_ds_bundle.js`) live at `/design-reference/` at the repository root,
pinned per commit so that a screenshot comparison is reproducible and a
design change arrives as a reviewable diff. They are refreshed by pulling
from the design project, never hand-edited. They are excluded from
Prettier, from ESLint and from `design-lint`'s `ROOTS`, and sit outside
`apps/portal` so Next never compiles them. The runtime files are vendored
for rendering only and are never imported by product code.

**Verification splits three ways.** Fase 5's check 1 — the side-by-side
comparison — is a **review harness**, not a CI gate: the plan itself
lists browser width, text reflow and real data as acceptable
differences, which no pixel-diff can distinguish from a wrong padding,
and the design files render through a vendored runtime that fetches
fonts over the network. Check 2 is `design-lint` (ADR-057). Check 3 is
Playwright, including `@axe-core/playwright` per P-16. Separately, the
portal gets its own visual-regression suite against its own committed
baselines, reusing the ADR-017 Storybook harness — the two comparisons
answer different questions and both are needed.

**Consequences**

- Design amendments are a real work item with a real ordering
  constraint: upstream first, then code. Tasks that depend on an amended
  screen are blocked until the pull lands.
- The design-system README is stale on platforms, sync, roles and icons,
  and is refreshed as part of the same upstream pass.
- Removing the five write CTAs means a director who miscounts stock must
  correct it on the phone. Revisit alongside a designed down path for
  transactional tables, not before.

---

## ADR-059

**Title:** Plans are renamed to Xangarrito / Xangarro / Xangarrote, entitlement gains `capabilities`, and every LLM-backed surface ships «Próximamente» in production

**Date:** 2026-09-17

**Status:** Accepted — requires contract task C-11; extends ADR-053 §5

**Context**

The Suscripción design is marked by its handoff as the one screen whose
content is real — "The pricing on this screen is real. Copy it
verbatim." It names three plans **Xangarrito $0**, **Xangarro $199** and
**Xangarrote $399 MXN/mes**, against the `freelancer` / `emprendedor` /
`mipyme_pro` identifiers in `packages/domain/src/entities/plan.ts`,
`packages/contracts/src/entitlement.ts` and
`packages/contracts/src/mock/scenarios.ts`.

That screen also sells **«Asesor en cada plan»** as a block of its own,
separate from the plan feature lists: Xangarrito one aviso per week plus
catalogue import from a photograph; Xangarro a daily "Para ti",
conclusions on the estados financieros, caja-difference explanations,
Metas with daily tracking, and one free Diagnóstico at ninety days;
Xangarrote adding a monthly Diagnóstico, "¿Cuánto puedo sacar?", the
"¿Me alcanza?" forecast and a written estrategia. None of that fits
`FEATURE_FLAG_KEYS`, whose seven members — `stock`, `barcode`,
`conversionMateriaPrima`, `conversionAutomatica`, `auditoriaInventario`,
`merma`, `ventasCredito` — are tenant-toggleable business capabilities
with dependency cascades, rendered by Negocio §5 as switches under
«Disponible · En tu plan · Activada».

**Decision**

- **`PLAN_IDS` become `xangarrito | xangarro | xangarrote`,** amended in
  place at `PROTOCOL_VERSION = 1` by a new contracts task **C-11**. No
  version bump and no legacy aliases: `PROTOCOL_VERSION` exists to
  protect deployed clients from deployed servers, and there are none —
  B-01 is unstarted, `00-README.md` §6 records that no hosted project
  exists, and no device has ever received an entitlement. Aliases would
  permanently enshrine identifiers no tenant ever held. C-11 touches
  `plan.ts`, `entitlement.ts`, both domain tests, `mock/scenarios.ts`,
  `mock/cli.ts`, the contracts signature-vector test,
  `use-feature-flags.ts`, the i18n labels and the `?plan=` URLs in P-03,
  then re-freezes.
- **Stripe lookup keys carry a `plan_` prefix.** The mid-tier plan id and
  the product name are both `xangarro`; inside external namespaces they
  must be distinguishable.
- **`PlanLimits` gains `capabilities`** — plan-level gates with no
  tenant switch: `estadosFinancieros`, `informeMensual`,
  `permisosPorUsuario`, and `asesor: 'semanal' | 'diario' | 'completo'`.
  `FEATURE_FLAG_KEYS` is unchanged and keeps its meaning. Nobody toggles
  off their financial statements, so putting these in the flag array
  would force P-15 to render permanently-disabled switches or maintain
  an exclusion list; and the Asesor is not a boolean — six booleans that
  must move together admit sixty-one invalid plans, where one enum
  admits none. The design already draws the distinction by rendering the
  two sets in different places. `capabilities` lands in the signed
  payload as part of the same C-11 amendment, so the contract is
  unfrozen once.
- **Xangarrito has no NIF statements.** Estados financieros gains a
  fifth state, `locked`, alongside `happy / loading / empty / error`,
  reusing the teaser treatment the Asesor already defines. Raw export of
  ventas and gastos stays on every tier and for every role, which is
  what `00-README.md` Q14 means by "raw export is on every tier (Pro
  gates formatted reports)". Inicio's "Utilidad del mes" hero stays on
  every tier — it is arithmetic, not a statement — and its "Ver estados"
  link lands on the locked state. The paywall sits at the report, not at
  the number.
- **The Asesor is built in full**, deterministic and generative, per the
  decision recorded in ADR-056.
- **Production gates on the model call, not on the feature.** Any code
  path that makes an LLM call renders «Próximamente» in production;
  **locally nothing is gated** and every surface is live and
  developable. One environment flag, checked at the single model-call
  module boundary ADR-056 establishes. At launch this puts the
  Diagnóstico tab, the estrategia and the photo catalogue import behind
  «Próximamente», while the Para ti feed, capacidades gating, Metas in
  all seven states, trophies, celebrations and Avisos ship live —
  because all of those are SQL and `@xangarro/domain` arithmetic.
- **A useful consequence, adopted deliberately:** the rule makes "does
  this call a model?" decide whether a feature ships. For borderline
  surfaces — conclusiones on the estados financieros, the caja-
  difference explanation, "¿Me alcanza?" — prefer templated prose over
  computed figures. That ships them live *and* makes them testable in
  CI, which a model call is not.
- **Local development uses recorded fixtures** as the default path, with
  a real API key for the occasional live call. Fixtures are what make
  CLAUDE.md §2.4's one-happy-plus-three-unhappy-paths possible against a
  generative feature. Proxying a Claude consumer subscription is not
  used: it is outside those terms, and it offers no Batches API and no
  stable limits.
- **Model selection.** `claude-opus-5` by default. The two scheduled
  jobs go through the **Message Batches** API at half cost, since
  neither is latency-sensitive — the design renders `diagState:
  'generating'` — while the photo import uses a normal streaming call
  because a person is waiting. The stable prefix (brand voice, es-MX
  register rules, notice schema, the "never assert a figure you were not
  given" constraint) sits before the last `cache_control` breakpoint so
  only per-tenant numbers bill at full rate. Adaptive thinking
  (`thinking: {type: "adaptive"}`); `budget_tokens` returns 400 on this
  model. Structured output (`strict: true` or `output_config.format`) on
  the photo import so extracted rows validate against the `Producto`
  schema rather than arriving as prose. Every tenant string — product
  names, expense concepts, uploaded photographs — is data, never
  instruction.
- **The production credential is deferred**: a direct Anthropic API key
  or Microsoft Foundry. Foundry bills through the Microsoft Marketplace
  at the same standard rates, so it is a procurement choice, not a cost
  one. **Batches and prompt caching availability must be verified before
  Foundry is chosen**, because both are load-bearing above.

**Alternatives considered**

- **Keeping the plan identifiers and renaming only the labels.**
  Rejected by the owner in favour of coherence between what customers
  say and what engineers type. The cost is C-11 and one rebase, taken
  now because nothing is persisted yet and it will never be cheaper.
- **Extending `FEATURE_FLAG_KEYS` with ten booleans.** Rejected: it
  conflates tenant-toggleable capabilities with plan gates and cannot
  express the Asesor's tiers.
- **NIF statements on every tier.** Rejected: it requires declaring the
  one artifact marked authoritative to be wrong, and a Balance computed
  from a fifty-record monthly ceiling is a demo, not a decision tool.

**Consequences**

- Xangarrote's headline features are dark at launch and light up when
  the production credential lands. Nothing is cut; it is shipped dark.
- The Diagnóstico's `teaser`, `free` and `notenough` states, and Fase 7's
  «Próximamente» WhatsApp card, already give the gate a visual
  treatment. No new design work.
- Two `capabilities` entries — `estadosFinancieros` and
  `informeMensual` — are the first plan gates the phone must also
  honour, since it renders neither. They travel in the same signed
  payload and are inert on the device until it does.

---

## ADR-060

**Title:** Two entity classes — synced and portal-only — amending CLAUDE.md §11; Avisos and the Asesor feed share one `notices` table

**Date:** 2026-09-17

**Status:** Accepted — the CLAUDE.md edit is applied by task X-06

**Context**

CLAUDE.md §11 requires, for every new entity: a branded ID, Zod schema
and domain test; a Drizzle **SQLite** table, migration, journal entry and
registration, plus a repository interface and implementation; an
in-memory repository in `packages/testing` and an entry in
`mock-repository-provider.tsx`; entries in `Repositories` and
`buildDrizzleRepositories()` plus a `useXRepository()` hook in
`packages/ui`; and route files in `apps/mobile/src/app/` and
`apps/desktop/src/app/routes/`.

The portal introduces entities that only Postgres and Next.js will ever
touch: `notices`, `metas`, `diagnosticos`, and the seals and streaks of
Fase 8. None crosses the wire — `scope.ts` is untouched. Following §11
literally would produce SQLite tables, in-memory repositories, accessor
hooks and Expo Router files for data the device never reads, on a device
whose surface A-01 is actively removing. §7 forbids exactly that. Not
following §11 is worse: §2.10 states the contract "grows only when new
rules are added" and that "if a rule must change, add an ADR in
`ARCHITECTURE.md` first".

§11 is also already stale. Its `apps/desktop/src/app/routes/` (wouter)
line names an app F-02 archived out of the workspace, so anyone
following the checklist today produces a file with nowhere to go.

**Decision**

§11 is amended to define two entity classes, with membership derived
from a classification the codebase already makes.

- **Synced entity** — a table named in `UP_TABLES`, `HYBRID_TABLES`,
  `DOWN_TABLES` or `NEVER_SYNCED_TABLES` in
  `packages/contracts/src/scope.ts`. The full §11 checklist applies,
  minus the archived `apps/desktop` line.
- **Portal-only entity** — a table named in none of them. The checklist
  is: branded ID type; Zod schema and inferred type, exported from the
  entities barrel; a domain entity test; a Drizzle **pg-core** table in
  `@xangarro/data-pg` with its migration; a repository interface and
  implementation, both exported; the portal screen and its route; i18n
  keys in `es-mx.ts`; the §2.6 file and function budgets; and CLAUDE.md
  §2.4's one happy path plus three unhappy paths per use case. No SQLite
  table, no `packages/testing` in-memory repository, no `Repositories`
  entry, no `useXRepository()` hook, no Expo Router file.

The checklist gets shorter, not weaker: every rule that is not
mobile-specific survives.

**`notices` is one table serving two surfaces.** Avisos and the Asesor's
"Para ti" feed have the same shape and the same lifecycle — severity,
title, body, a deep link, a relative timestamp, and an unread → read →
resolved/dismissed progression, each with four data states. Xangarrito's
Asesor entitlement is literally "1 **aviso** por semana". The table
carries `source ∈ sistema | operacion | asesor`, severity, title, body,
a CTA target, `state ∈ nuevo | leído | listo | descartado`, and a `data`
JSONB column for per-insight payload such as the price-suggestion table
and product references.

- The Avisos page renders `sistema` and `operacion` as its two tabs; the
  Asesor tab filters `source='asesor'`.
- **The header bell counts unread excluding `source='asesor'`** — the
  design shows the badge and the Asesor nav item carrying separate
  unread notions.
- Plan tiering governs the **generator**, not the store: `capabilities
  .asesor` decides how many `source='asesor'` rows are written and how
  often. Read and dismiss behave identically regardless of origin.
- One table means one RLS policy, one retention rule, one index, and one
  delivery configuration for Fase 7's «Configurar» matrix — without
  which the weekly aviso could not be delivered by WhatsApp, which is
  the whole Xangarrito Asesor promise.
- `notices` is portal-only and never synced. `NEVER_SYNCED_TABLES`
  already holds `director_alerts`, the device's own local alert store,
  so the phone keeps its stock-low notification (A-13) unchanged and
  `scope.ts` is not touched again by C-11.

**Alternatives considered**

- **Following §11 literally.** Rejected: guaranteed dead code, which
  A-15's rename sweep would then have to carry.
- **Skipping §11 silently.** Rejected: precisely the drift §2.10 exists
  to prevent, and the next reader of §11 would have no way to know it
  did not apply.
- **Separate `notices` and `asesor_insights` tables.** Rejected: it
  duplicates the state machine, the badge counting and the empty states,
  and it splits the delivery configuration in two.

**Consequences**

- X-06 grows: it now carries the §11 amendment and the removal of the
  stale `apps/desktop` line, alongside whatever else it accumulates.
- A future decision to sync one of these tables is a real migration —
  adding it to `scope.ts` promotes it to a synced entity and the full
  checklist applies from that point.
- The `source` column plus `data` JSONB absorbs a good deal of
  divergence before a split would be warranted. Splitting later is
  easier than merging later.

---

## ADR-061

**Title:** The portal's database is a Supabase-shaped Postgres, and its session carries the Supabase claim shape — so the RLS path production uses is the one we test

**Date:** 2026-09-17

**Status:** Accepted — auth provider for production still open; this decision keeps it open

**Context**

The portal needed a real database under test, and then real authentication.
Three facts shaped both:

1. `xangarro.current_business_id()` coalesces **two** claim sources: Supabase's
   `request.jwt.claims ->> 'business_id'`, and our own session GUC
   `xangarro.business_id`. Every existing test exercised only the second.
   Nothing in the repository ever set `request.jwt.claims`, so the branch
   production would use was untested from the day it was written.
2. Writing the first test against it found a shipping defect:
   `current_setting('request.jwt.claims', true)::jsonb` raises 22P02 on an
   empty string, a state PostgREST produces. One empty GUC turned every query
   on all 25 tenant tables into an error.
3. The production auth provider is undecided (Q in the Phase 2 interview).
   Supabase Auth is assumed by B-05/P-02, but nothing is committed.

**Decision**

**The local database is Supabase-shaped, through a local-only layer.**
`packages/data-pg/local/0000_supabase_compat.sql` provisions what a hosted
project provides before any migration runs: the `auth` schema and
`auth.users` (in Supabase's own column shape), the `anon`/`authenticated`/
`service_role` roles, and `auth.jwt()`/`uid()`/`role()`/`email()` transcribed
from Supabase's definitions. It lives **outside** `drizzle/`: that directory
is what a hosted project receives, where `CREATE ROLE anon` fails and
`CREATE OR REPLACE FUNCTION auth.uid()` would overwrite the platform's own.
`db-local.sh` applies `local/*.sql` before `drizzle/*.sql`, and CI calls the
same script, so both run byte-identical SQL from one place.

**Migrations stay platform-agnostic.** They never call `auth.*`; they read
`current_setting` directly, so they apply to plain Postgres, Neon or a
self-host as well as Supabase. The compat layer makes the *environment*
match; it does not give the schema a platform dependency.

**The session payload is the Supabase claim shape** — `sub`, `role`,
`business_id` — in an HMAC-signed cookie. `withSession` writes it into
`request.jwt.claims`, so the branch of `current_business_id()` that binds in
production is the one `claims.integration.test.ts` proves, including that the
claim wins over the GUC when they disagree. Adopting GoTrue later replaces the
*issuer* of that payload, not every query, guard and policy downstream.

**Sign-in's membership lookup goes through a `SECURITY DEFINER` function**,
`xangarro.memberships_for_user(text)`, with `search_path` pinned. Sign-in is
the query that decides *which* tenant, so it cannot be tenant-scoped, and with
no claim set `tenant_isolation` correctly returns zero rows. The function's
whole surface is one user id in, membership rows out.

**Alternatives considered**

- *Full `supabase start` locally and in CI.* Highest fidelity, and the only
  thing that can issue a GoTrue session. Rejected for now: several containers,
  most of whose surface the portal does not use, and it would commit us to
  GoTrue's shape before the provider decision is made.
- *Plain Postgres, no compat layer.* Sufficient for reads. Rejected because it
  leaves the production claim path permanently untested — which is precisely
  how the 22P02 defect survived.
- *Give the app a `BYPASSRLS` role for the membership lookup.* One query's
  convenience, at the cost of every other query being one mistake away from
  reading across tenants. Rejected.

**Consequences**

- `drizzle/0001_rls.sql` is **not pushable to a hosted project as written**:
  its grants name `xangarro_app`, which a hosted project lacks, and its
  policies carry no `TO` clause. `supabase-compat.integration.test.ts` pins that
  state deliberately, so B-03 cannot grant to `authenticated` by accident.
- `CREATE ROLE xangarro_app LOGIN PASSWORD …` moved out of `drizzle/` into the
  compat layer. Left where it was, the first `supabase db push` would have put
  a login role with a repository-published password on production.
- `SESSION_SECRET` has no default. A fallback would make every cookie forgeable
  on any host that forgot to set it.
- Choosing GoTrue later is a change to `server/actions/auth.ts` and the seed,
  not to `withSession`, `requireMember` or any policy.

---

## ADR-062

**Title:** Portal writes reuse the application use cases through Postgres repositories, and the table's sync scope — not the author — decides whether a write reaches the devices

**Date:** 2026-09-17

**Status:** Accepted

**Context**

The portal began writing. Its rules already existed: `EditarProductoUseCase`
re-validates a patch, refuses a missing row and forbids retroactive cost edits,
and the phone runs it over SQLite. Separately, `@xangarro/contracts` already
classifies every table as UP, HYBRID, DOWN or never-synced, and devices only
learn of a cloud-side change by finding a row in `sync_log`.

Two failure modes were live. Reimplementing a rule in the portal would
duplicate it (CLAUDE.md §2.3). And a portal write that updated its table but
skipped `sync_log` would look perfect on screen while never reaching the
phone — invisible in any UI.

**Decision**

**Use cases are reused, not reimplemented.** Each takes a repository
interface from `@xangarro/data`; the portal supplies a Postgres implementation
(`apps/portal/src/server/repositories/`) bound to one tenant transaction.
`server/actions/*` are composition roots and nothing else. Repositories do not
filter by the `businessId` their interface carries — RLS already scopes the
transaction, and trusting a caller-supplied id over the policy is how
cross-tenant reads happen.

**The table's scope decides the `sync_log` append.**
`repositories/sync-log.ts` derives its accepted tables from `DOWN_TABLES` and
`HYBRID_TABLES` in `@xangarro/contracts`, so a table moving scope is a compile
error at every call site. The append always shares the write's transaction: a
row must never change without the record a device pulls, nor be announced
when the write rolled back. Portal-only tables (`notices`,
`activation_codes`) never append — no device has them.

**Where a table is device-created, the portal does not create.** `products`
is HYBRID: born on a phone mid-sale, corrected in the portal. The Postgres
repository's `create`/`delete` throw, and the portal's "Nuevo producto" is
labelled «próximamente» pending a product decision rather than wired against
the contract.

**Portal-created rows carry a documented device sentinel**, a fixed ULID,
because `deviceId` is NOT NULL and ULID-typed, and a portal member's `sub` is
a UUID from `auth.users` — a different id space. `createdByUserId` names a
device *operator*, so for a portal write it is honestly null.

**Alternatives considered**

- *Write through the phone's `POST /sync/push`.* Rejected: the portal would
  impersonate a device, invent a `clientSeq`, and be refused by the very
  `isPushable` rule that protects portal-only edits.
- *Let each action decide whether to log.* Rejected: it is exactly the
  judgement that gets forgotten, and forgetting it is silent.

**Consequences**

- Writing forced domain validation onto data no read path had ever validated,
  and the seed failed it: non-ULID ids, `'Producto'` for `'producto'`,
  `'Semanal'` for `'semanal'`. Postgres accepted all of them, because ids are
  `text` and Drizzle's `enum` is a TypeScript type, not a CHECK constraint.
  `seed-contract.integration.test.ts` now validates seeded rows against their
  domain schemas.
- Postgres renders `timestamptz` as `2026-01-02 15:00:00+00`, not ISO 8601, so
  every pg repository converts at the boundary.
- Follow-up: a CHECK constraint per enum column would make the database
  enforce what Drizzle only describes. Not done here; it is a migration with
  its own old→new test (CLAUDE.md §2.9).

## ADR-063

**Title:** An internal admin console, `apps/admin` at `admin.xangarro.mx`, replaces "Supabase Studio + Stripe Dashboard" as the back-office

**Date:** 2026-09-17

**Status:** Accepted — supersedes README Q16 and Track Z-09; tasks N-05 … N-10, N-46 … N-48

**Context**

Q16 made the back-office Supabase Studio plus the Stripe Dashboard, with a
separate internal app (Z-09) only once support passed ten tickets a week. The
feature interview of 2026-09-17 added needs neither tool covers: linking Stripe
licence state to tenants with audited overrides, usage-versus-limit alerts to
the provider, an inbox for escalations and migration requests, platform kill
switches, and a dormant-account lifecycle. Several of these are launch-day
needs, not support-volume needs.

**Decision**

- A separate Next.js app, `apps/admin`, its own Vercel project, at
  `admin.xangarro.mx`. It is **never** a route in `apps/portal`.
- Staff authenticate with Supabase Auth against a `staff_members` allowlist;
  TOTP 2FA (AAL2) is mandatory; every mutation writes `staff_audit_log`.
- The Supabase service-role key exists only in this project. A CI check fails if
  it is referenced under `apps/portal`.
- Portal-side privileged writes (the Stripe webhook, B-10) use a dedicated
  least-privilege Postgres role (`xangarro_billing`: billing tables plus one
  SECURITY DEFINER entitlement function), never the service role — confirmed
  after the N-26 audit (SEC-SEC-01), 2026-09-17.
- v1 at launch: tenants + licences + Stripe, usage and capacity, inbox, platform
  flags. Post-launch: sync health, broadcasts, dormancy.
- Staff alerts: inbox for everything, a daily 08:00 digest email, and a
  Slack/Discord webhook for urgent items only.
- Stripe remains the billing source of truth; the admin reads webhook-derived
  state and applies expiring, audited overrides.

**Alternatives considered**

- *Route group inside `apps/portal`.* Rejected: the cross-tenant key and code
  would ship in the customer deployment; a portal bug could expose every tenant.
- *Keep Studio + Stripe.* Rejected: no place for alerts, inbox or overrides.
- *Retool / Appsmith.* Rejected: paid vendor, logic outside the repo, no reuse
  of `packages/application`.

**Consequences**

- One more deployable and one more auth surface — covered by the N-26 audit.
- Z-09 is dropped as superseded. B-16's Studio queries stay useful until N-46.

## ADR-064

**Title:** Dormant free-tier accounts are archived to cold storage after 180 days, amending "the portal keeps everything forever"

**Date:** 2026-09-17

**Status:** Accepted — amends README Q9 retention; task N-48

**Context**

Q9 says the portal keeps everything forever and data is never deleted in any
abuse scenario. The owner wants abandoned accounts out of the live database. Two
constraints shape the answer: Mexican taxpayers must keep accounting records for
five years (CFF art. 30), so deleting a customer's books can destroy their tax
evidence; and LFPDPPP requires personal data not be kept beyond its purpose.

**Decision**

- Scope: **free-tier tenants only**. A paying tenant is never dormant.
- Dormant = no portal login **and** no device sync for 90 days. Emails at day 90
  and day 150; any activity resets the clock.
- Day 180: a full export (Excel + JSON, the P-34 exporter) is written to a
  private, encrypted storage bucket and verified by row counts; then the
  tenant's rows are deleted from Postgres.
- The archive is retained **6 years**, then purged. CFF art. 30 counts the
  taxpayer's 5 years from the filing of the annual return, not from the
  transaction or from inactivity, so 5 years after archiving would fall short
  for the last archived year; 6 covers it. The obligation is the taxpayer's; the
  emails and the aviso de privacidad say so and offer "Descarga tus datos".
- The archive is held under the LFPDPPP (DOF 2025-03-20; authority: Secretaría
  Anticorrupción y Buen Gobierno) *bloqueo* regime: kept only for restore or an
  authority's request, then deleted.
- A returning owner can "Restaurar mis datos", which re-imports the archive.
- Q9's "never deleted in any abuse scenario" still holds: abuse never triggers
  deletion; only verified, archived inactivity does.

**Alternatives considered**

- *A second "dormant" Supabase project.* Rejected: a second database to migrate,
  secure and pay for.
- *Mark dormant, never move.* Rejected by the owner: rows stay in the hot DB.
- *Hard delete after notice.* Rejected: risks customers' SAT records; no way back.

**Consequences**

- The restore path must accept archives from older schema versions (the JSON
  carries its schema version; restore runs through migrations).

## ADR-065

**Title:** Plan limits measure transactions per month and active products, are advisory for transactions on every tier, and are counted by the server

**Date:** 2026-09-17

**Status:** Accepted — amends README Q14 ("50 records/month enforced on the phone"), A-10, and ADR-059's limit values; contract task C-12

**Context**

`PLAN_LIMITS` had one metric, records per month, with xangarrito blocking the
51st record on the phone. Fifty records is less than one day of a taquería. A
single metric also lets one business shape escape: a taquería has few products
and many sales; a ferretería has many products and few sales. The owner's rule:
"if they hit the limit we don't stop their operation, but we need a warning to
the user and to me".

**Decision**

- Metrics: **transactions/month** (ventas + gastos + inventory movements) and
  **active catalog products**.
- Values: xangarrito 300 / 50 · xangarro 10 000 / 1 000 · xangarrote 30 000 / 5 000.
- **A transaction is never blocked on any tier.** Thresholds at 80 % and 100 %
  warn the owner (app, portal, email); 100 % and 150 % alert the provider via
  the admin inbox; two consecutive months over create an upgrade-suggestion task.
- Free tier only: the product cap is hard in the portal and in app quick-add.
  The server still accepts overflow rows from offline phones (rows are never
  dropped, Q4) and flags them.
- The server is authoritative for usage (computed on push and nightly) and sends
  it down unsigned beside the entitlement.
- On the phone, limit messages are neutral and never name a plan or price
  (ADR-069); the upgrade prompt lives in the portal and in email.

**Alternatives considered**

- *Transactions only / products only.* Rejected: each lets a business shape
  escape.
- *Keep the free hard block.* Rejected: breaks a sale at the counter.

**Consequences**

- The free tier's conversion lever becomes capabilities, devices and catalog
  size, not a blocked register.

## ADR-066

**Title:** Merchant card collection through a `PaymentProvider` port (Mercado Pago + Clip); the server holds the intent, the device still writes the venta

**Date:** 2026-09-17

**Status:** Accepted — post-launch; tasks N-40 … N-45, contract C-13

**Context**

Merchants want to charge cards and have the money land in their own account.
The Mexican micro-merchant market uses Clip and Mercado Pago almost exclusively,
both cheap. The owner wants both QR / payment links and physical terminals.
ADR-053 §6 and ADR-058 §2 require that the server never writes transactional
tables — the one-writer rule that means no conflict class exists.

**Decision**

- A `PaymentProvider` port in `packages/application`; adapters for Mercado Pago
  and Clip, backend only. Modes: dynamic QR / link and terminal push.
- **Mercado Pago first, Clip immediately after, both before public release.**
  Verified 2026-09-17: MP offers OAuth, a sandbox, HMAC-signed webhooks, the
  Orders API for Point Smart 1/2 in Mexico and dynamic QR. Clip offers a PinPad
  API (Total 3 / Ultra / PinPad / Stand 2, not Plus) that requires Clip to
  install an app per device, production-only testing, merchant-created
  Basic-auth keys instead of OAuth, and **unsigned** webhooks. Therefore every
  webhook is a signal only; status is confirmed by fetching from the provider.
- Money settles to the merchant's own provider account. **Xangarro takes no
  fee** and never holds funds. Gated by `capabilities.cobrosIntegrados` on the
  paid tiers.
- Provider tokens live server-side (encrypted), never on devices.
- Flow: the device creates an intent via the API; the provider webhook resolves
  it; the device polls and, on approval, **writes the venta itself** with a
  `payment_ref` and syncs it as usual. Nightly reconciliation surfaces approved
  intents with no venta. Offline, the button is disabled with a manual fallback.
- An external penetration test precedes enabling it in production.

**Alternatives considered**

- *Single provider (MP or Stripe Connect + Terminal).* Rejected: leaves half the
  market; Stripe Terminal availability in MX is uncertain and needs new KYC.
- *Server writes the venta on the webhook.* Rejected: breaks the one-writer rule.
- *Device calls the provider directly.* Rejected: payment tokens on shared phones.
- *A platform fee.* Rejected: inconsistent across providers, regulatory exposure,
  erodes the "cheap" pitch.

**Consequences**

- Card collection needs connectivity; the offline fallback is the merchant's
  existing terminal plus a manual "Tarjeta" venta.
- Provider API availability (Clip terminal push, MP Point cloud in MX) is
  unverified until the N-40 spikes.

## ADR-067

**Title:** Onboarding is signup → "Platícanos de ti" wizard → recommended plan; annual billing and a 14-day trial on both paid tiers at launch

**Date:** 2026-09-17

**Status:** Accepted — amends P-03, P-04, B-10; supersedes Z-10; tasks N-01, N-12 … N-15

**Context**

P-03 sent signup straight to Stripe Checkout, and P-04 was a four-step setup
that could not be re-run. The owner wants a questionnaire ("¿qué tipo de negocio
tienes? ¿cómo cobras? ¿inventario? ¿caja?…") with visible progress, re-runnable
from settings. Several answers map to paid-only features.

**Decision**

- Order: signup → an 8-step, every-step-skippable wizard whose answers are
  turned into configuration by a pure domain function → "Tu plan ideal" with
  reasons → trial Checkout or stay free.
- Paid-only answers are badged; if the tenant stays free they are stored as
  pending and applied on upgrade by the subscription webhook.
- The "¿Cómo empiezo?" checklist tracks tasks; the wizard only configures.
- Re-running shows a summary of what will change before applying.
- Stripe: monthly and annual prices (annual = 10× monthly); 14-day trial on both
  paid tiers **without collecting a payment method up front**
  (`payment_method_collection=if_required`).
- Payment methods (verified against Stripe's Mexico docs, 2026-09-17): **card**
  on both intervals through Checkout; **SPEI** on annual only, through an
  API-created `send_invoice` subscription paid to a per-customer CLABE
  (`customer_balance`); **no OXXO** — Stripe supports it neither for
  subscriptions nor for invoices, and OXXO prohibits merchant category 6538
  (Software). This amends README Q13 ("cards + OXXO + SPEI").
- **Prices are plus IVA** (owner decision): $199 / $399 monthly and $1 990 / $3 990
  annual are subtotals; Stripe applies 16 % IVA as an exclusive tax, so the
  customer pays $230.84 / $462.84 and $2 308.40 / $4 628.40. Every displayed
  price carries "+ IVA". Risk noted: PROFECO expects total prices when selling
  to consumers; many customers are personas físicas, so checkout always shows
  the IVA-inclusive total before payment.

**Alternatives considered**

- *Plan-first (P-03 as written).* Rejected: people choose before understanding.
- *Everyone free, upsell later.* Rejected: an extra step to reach paid features.
- *Two flows (P-04 + questionnaire).* Rejected: overlapping questions twice.

**Consequences**

- Landing CTAs still pass `?plan=`, now only a preselection (N-31, L-03).

## ADR-068

**Title:** Database scaling moves by measured triggers, reviewed monthly, amending ADR-053 §7

**Date:** 2026-09-17

**Status:** Accepted — amends ADR-053 §7; tasks N-07, N-51, N-52

**Context**

ADR-053 §7 names the stages (shared schema + RLS → replicas and an analytics
model → sharding) without saying when to move. Projection: 1 000 tenants ×
~3 000 transactions/month ≈ 36 M rows ≈ 18 GB per year.

**Decision**

- **S1 (now):** shared schema, RLS, `business_id`-leading indexes, dormancy
  archive (ADR-064).
- **S2** when any of: DB > 25 GB, a table > 50 M rows, sync p95 > 800 ms —
  monthly range partitioning of transactional tables, a read replica for portal
  reports and the Asesor, the next compute size.
- **S3** when DB > 500 GB or > 10 000 active tenants — an analytics read model;
  evaluate Citus or tenant sharding under a new ADR.
- The triggers are displayed on the admin capacity card and reviewed monthly.

**Alternatives considered**

- *Customer-count milestones.* Rejected: tenants differ in weight by orders of
  magnitude.
- *No numeric triggers.* Rejected: reactive scaling under load.

**Consequences**

- Partitioning is a migration with an old→new test (CLAUDE.md §2.9) and must
  keep `server_seq` ordering intact.

## ADR-069

**Title:** The mobile app is a business-employee sign-in tool with no in-app selling, to satisfy App Store 3.1.1/3.1.3 and Play payments policy in Mexico

**Date:** 2026-09-17

**Status:** Accepted — amends ADR-053's store posture; tasks N-32, N-25, N-03, N-04; X-05

**Context**

ADR-053 made the app free with no purchase UI, unlocked by activation codes,
with the plan bought on the web. Checked against the current App Store Review
Guidelines on 2026-09-17: 3.1.1 names unlocking features with "license keys…
QR codes" as requiring in-app purchase; the link-out/steering exception applies
to the United States storefront only, not Mexico; 3.1.3(f) allows a free
companion only with no purchasing and no calls to action to buy outside;
3.1.3(c) allows apps sold directly to organizations for their employees to give
access to what the organization bought. Google Play allows consumption-only
apps as long as they do not steer to other payment methods; Mexico has no
user-choice billing. Track N had added in-app upsell copy (limit warnings,
"Incluido en Xangarro") that would count as steering.

**Decision**

- The app is positioned and submitted as a tool that businesses provide to
  their employees (3.1.3(c)); the owner/Director buys and administers on the
  web; operators never buy anything.
- Pairing is a **sign-in to the business account** ("Vincular este dispositivo
  a tu negocio"), never "activar", "licencia" or "desbloquear".
- **No selling in the app:** no plan names, prices, upgrade prompts or links to
  the portal. Limit messages on the phone are neutral and say the owner is
  notified. All upsell happens in the portal and by email.
- A CI string check enforces this (N-32). A demo account stays live for review
  (Guideline 2.1).

**Alternatives considered**

- *Add StoreKit / Play Billing in-app purchase.* Rejected for now: a 15–30 % fee
  and a second billing path to reconcile with Stripe. It remains the fallback
  if review rejects the framing (OQ-6).
- *Ship as designed and see.* Rejected: launch would depend on a review outcome.

**Consequences**

- Operators discover limits only as neutral notices; conversion depends on the
  owner's portal and email experience.
- An early external TestFlight submission gives a review signal before launch.

## ADR-070

**Title:** Every subscription payment gets a CFDI; the automation is built and wired behind a switch, and production starts with manual issuance in the SAT portal

**Date:** 2026-09-17

**Status:** Accepted (amended the same day after owner review) — supersedes README Q15's "issue manually; automate at ~50 paying customers" and Track Z-03; task N-33

**Context**

Q15 planned to issue CFDI by hand until about 50 paying customers. A CFDI is
required for every payment received (CFF art. 29), and a Stripe invoice has no
SAT validity. With monthly billing that is one CFDI per customer per month from
the first customer, plus a monthly "público en general" global CFDI for payers
without fiscal data, complementos de pago for SPEI-paid invoices, and
cancellations for refunds — a growing manual chore with deadlines.

**Decision**

- Stripe `invoice.paid` drives a PAC API adapter that stamps CFDI 4.0: an
  individual CFDI when the tenant's fiscal data is complete, otherwise the
  payment joins the monthly global CFDI; SPEI invoices get a complemento de
  pago; refunds trigger cancellation. Idempotent per Stripe invoice id.
- **Rollout switch `CFDI_MODE = off | test | live`.** Formal release is a month or more away and
  the first customers are few, so production starts `off`: the owner issues CFDIs manually in SAT's
  free portal, driven by an admin "pagos sin CFDI" list that each payment stays on until it is marked
  with its folio fiscal. Staging runs `test` with the PAC's test keys (never reach SAT, no cost).
  `live` is a configuration change once manual work reaches ~10–15 CFDIs a month or the contador
  signs off on the open fiscal questions (PUE vs PPD for SPEI, ClaveProdServ, global periodicity).
- Payers without fiscal data are never skipped: they go into the monthly global "público en
  general" CFDI (RFC XAXX010101000).
- Only an authorized PAC (or SAT's own manual portal) can certify a CFDI; becoming a PAC (RMF
  2.7.2.1: persona moral, MX$10 M capital, TESOFE bond, SAT technical validation) is out of
  proportion. A PAC reseller programme is the route if merchants ever invoice through Xangarro
  (N-54).
- The PAC vendor is chosen inside N-33 by current price and SDK quality (first adapter: Facturapi;
  prepaid stamp packages from another PAC to be compared before going `live`).
- The "Solicitar factura" request remains for customers who add fiscal data
  after paying (re-stamp from the global CFDI).

**Alternatives considered**

- *Manual until ~50 customers.* Rejected: a monthly obligation per customer.
- *A Stripe-app connector.* Rejected: a third-party subscription and less control.

**Consequences**

- Z-03 is dropped as superseded; the collected fiscal fields (Q15) become
  required inputs to a live integration, so their validation (RFC, régimen,
  uso, CP) must be strict in the portal.

## ADR-071

**Title:** A linked browser is a capture device — the operator's register ("caja") runs in the portal's origin, but it is a device with its own outbox, never a portal writer

**Date:** 2026-09-17

**Status:** Accepted — amends ADR-053 §1 and §3 (capture is no longer phone-only); supersedes Track N decision row 20 ("No web capture"); keeps ADR-058 §2 intact. Track O (`docs/plan/10-operador.md`).

**Context**

The second design handoff (`design_handoff_operador/`, fifteen screens) puts a
point-of-sale in the browser for the Operativo role: the browser is linked once
with a code the owner generates, each operator opens a turno with a NIP, sales
are captured by tapping the catalog, and — the handoff's rule 7 — «sin conexión
se sigue cobrando»: the sale queues in the browser and uploads on reconnect, and
a turno cannot close while records are unsent.

That collides with three recorded decisions: ADR-053 §1/§3 (the phone is the
capture surface), ADR-058 §2 («the portal never writes a transactional table»)
and Track N row 20, settled earlier the same day («the portal stays online-only
… No web capture»). The owner chose web capture after seeing the conflict, in
the operator-plan interview of 2026-09-17.

**Decision**

1. **The browser register is a device, not the portal.** It redeems an
   activation code through `POST /api/v1/activate` exactly as a phone does,
   receives a `deviceId`, a device token and the signed entitlement, and writes
   `UP_TABLES` only through `POST /sync/push` with `clientSeq`. The portal
   server still writes no transactional table; ADR-058 §2 stands. The
   register's routes live in their own route group in `apps/portal` with their
   own shell; they authenticate by device token, never by the owner's session
   cookie.
2. **`DevicePlatformSchema` gains `web`** (contract task). `devices.plataforma`
   follows with a migration.
3. **A register is a device, one to one.** «Caja 1» is `devices.nombre`,
   assigned at linking and editable by the owner. «Un turno abierto por caja»
   becomes a local invariant on one device, which is the only form of it that
   is enforceable offline — two devices without a connection cannot
   coordinate. Phones are registers by the same rule. Re-linking a browser
   whose data was cleared produces a new device; its history shows under the
   same name but a different id. A `cajas` entity was rejected for v1 because
   it adds a picker the owner's pairing design does not have.
4. **Local storage is SQLite compiled to WebAssembly, persisted in OPFS**,
   running in a Web Worker, with `navigator.storage.persist()` requested. It
   runs the same Drizzle schema, migrations, repositories, application use
   cases and change-log outbox as the phone, so there is exactly one data layer
   (CLAUDE.md §2.3). The WASM bundle is loaded only by the register routes,
   never by the owner portal. Before committing to it, a spike (O-02) proves
   the Drizzle driver on WASM; if it fails, work stops and the owner is asked
   before any fallback.
5. **`/sync/push` and `/sync/pull` become real routes in the portal** (today
   they exist only in the contract's mock server), serving phones and browsers
   alike.

**Alternatives considered**

- *The portal server writes sales through server actions.* Rejected: breaks
  ADR-058 §2, creates the first sync-conflict class, and makes offline capture
  impossible — rule 7 would be unimplementable.
- *IndexedDB with its own repositories.* Rejected: every repository and the
  outbox would exist twice and drift precisely on the sale and cash rules.
- *No web register; reinterpret the designs as phone screens.* Rejected by the
  owner.

**Consequences**

- `packages/sync/src` is absent from this checkout (only `dist/` exists); it is
  recovered from its branch before anything else (O-02).
- Browser storage can be cleared by the user. The operator screens carry the
  design's warning («no cerrar la pestaña ni borrar los datos del sitio»), and
  the turno-close block on unsent records (rule 7) is what keeps cash honest.
- Track N row 20's "friendly offline page" still applies to the owner portal;
  it does not apply to the register routes.

---

## ADR-072

**Title:** The operator NIP is four digits and only the owner sets or resets it; the activation code stays eight characters and the design is amended

**Date:** 2026-09-17

**Status:** Accepted — amends ADR-049 (PIN + recovery password), P-05 (PIN 4–6) and the Access design; Track O

**Context**

Three sources disagreed on the PIN: the operator design uses four digits
(rule 1, four boxes on Acceso and on the lock screen), the domain enforces six
(`UserSchema`'s `/^\d{6}$/`), and P-05 allowed four to six. One operator uses one
NIP on the phone and on the browser, because both read `users`.

The phone also has two device-side PIN paths — `recuperar-pin` (recovery
password) and `cambiar-pin` (including the `mustChangePin` flow). `users` is a
`DOWN_TABLE`: a device can never push it. Either path therefore changed the PIN
on one device only, silently; the cloud and every other device kept the old
hash. Harmless while one phone was the whole product, wrong once a NIP is shared
across devices.

Separately, the Access design links with a six-box code typed on a digits-only
keypad, while its own example (`TD4 91K`) contains letters and a `1`. The
contract's `ACTIVATION_CODE_REGEX` is eight characters from an alphabet without
`0`, `O`, `1`, `I`, and the owner's pairing panel (P-06) already shows eight
boxes of that code.

**Decision**

1. **NIP = exactly four digits** in the domain, the contract, the phone and the
   portal. Pre-launch, so existing rows are re-set from the seed; no
   `mustChangePin` migration is needed.
2. **Only the owner sets and resets a NIP**, from the portal (P-05's «Nuevo
   operador» and «Reiniciar NIP»). The new hash reaches devices through
   `sync_log` like any DOWN row. The phone's recovery screen and change-PIN flow
   are removed; `recoveryPasswordHash` is deprecated in place (column kept; its
   removal is a later migration with its own old → new test).
3. **Failed-attempt limits are enforced on the device** («NIP incorrecto. Te
   quedan 2 intentos.»). A four-digit bcrypt hash stored on a device is
   guessable offline by someone who extracts it; the threat model is a
   coworker at the counter, which the attempt limit and owner-only reset cover.
4. **The activation code is unchanged** — eight characters, the contract's
   alphabet. The Access screen is amended upstream first (ADR-058's order):
   eight boxes, a text input that takes the physical or on-screen keyboard
   (uppercased, spaces and hyphens ignored) instead of the numeric keypad, and
   an example code that obeys the alphabet.

**Alternatives considered**

- *Six digits and amend the design.* More entropy, more friction on a screen
  used many times a shift with a queue waiting.
- *Owner resets, operator then chooses.* Better accountability, but needs an
  upward path carrying a PIN hash and a contract change the design does not ask
  for. Revisit if a dispute over "who made this sale" ever turns on it.
- *Six-character numeric codes for browsers only.* Two code formats, and the
  owner would need to know the device kind before generating one.

**Consequences**

- The owner knows every operator's NIP.
- Acceso (O-12) is blocked until the design amendment lands and is pulled.

---

## ADR-073

**Title:** A sale is a ticket: a header entity carries folio, method, client, cash tendered and cancellation; `sales` become its lines

**Date:** 2026-09-17

**Status:** Accepted — new UP entity; migration of `sales`; Track O

**Context**

`Sale` holds one `productoId` and one `cantidad`. The phone's checkout
(`apps/mobile/src/app/checkout/_confirm-hooks.ts`) loops over the cart and
writes one sale per product: not atomic (a failure on line three leaves lines
one and two), nothing groups them, and neither cash tendered nor change is
stored. There is no folio anywhere.

The operator design treats a sale as a ticket: V-0405 has several lines, one
folio, one method, one «recibido / cambio entregado», one cancellation with a
reason; fiado is per ticket, and abonos apply to the oldest tickets first.

**Decision**

- **New UP entity, the ticket (sale header):** folio, `metodo`, `clienteId`,
  `efectivoRecibidoCentavos`, `cambioCentavos`, `cajaTurnoId`, and the
  cancellation (`cancelMotivo`, `cancelledByUserId`, `cancelledAt`).
- **`sales` become lines:** `ticketId`, product, quantity, amount. Ticket-level
  fields leave the line; the migration moves them without loss.
- **Folio = a per-device counter**, unique on (device, folio), displayed
  `V-0405`. The operator only sees their own register, so it is unambiguous
  there; the owner sees «Caja 1 · V-0405». Assigned locally at capture, so it
  works offline.
- **Registering and cancelling a ticket are one atomic use case each**,
  reused by the phone, which fixes its non-atomic loop.
- Migration: every existing sale becomes a one-line ticket, with an
  old → new test (CLAUDE.md §2.9). Pre-launch, so it touches seed and test data.

**Alternatives considered**

- *`ticketId` + `folio` columns on each line.* Ticket data would be duplicated
  per line or parked on "the first line" — the duplicated state the handoff
  says caused several errors in the design.
- *One row per ticket with lines in JSON.* Breaks automatic stock deduction and
  per-product reporting.

**Consequences**

- Every reader of `sales` (NIF statements, KPIs, portal Ventas, exports) moves
  to ticket + lines; the domain calculators change once, in `packages/domain`.

---

## ADR-074

**Title:** Receivables are derived from two facts — fiado tickets and client abonos — and the turno's expected cash has one calculator

**Date:** 2026-09-17

**Status:** Accepted — migration of `client_payments`; new columns on `clients`, `products`, `expenses`, `caja_turnos`; Track O

**Context**

The handoff's rule 5 and its client-detail spec: «dos únicos datos por
cliente: sus ventas fiadas y sus abonos»; balance, open sales, available credit,
last payment and history are **derived** — «no duplicar estado: fue la causa de
varios errores en el diseño». Abonos apply to the oldest sales first; cancelling
a fiado ticket that has abonos turns the paid money into store credit (saldo a
favor), usable only on the client's next purchase.

Today an abono (`client_payments`) belongs to one sale, there is no FIFO and no
balance calculator in the domain (it lives in a UI hook). Separately,
`computeCajaBalance` exists but `CerrarCajaUseCase` computes the expected amount
its own way — by date range rather than by turno — so the saved esperado and
the on-screen one can disagree. Expenses carry no turno reference at all.

**Decision**

1. **An abono belongs to the client** (`clienteId`, amount, method, date).
   Its application — oldest fiado ticket first — and the client's balance,
   available credit and saldo a favor are pure functions in `packages/domain`
   over tickets + abonos. Nothing stores a balance.
2. **Clients gain `limiteCentavos` and `plazoDias`** (owner-set; `clients` is
   HYBRID, so the portal edits them). **Products and clients gain a review
   status** (`pendiente`, `aprobado`, `fusionado`, `rechazado`) for «creado en
   caja».
3. **One expected-cash calculator per turno:** `fondo + ventas en efectivo +
   abonos en efectivo − gastos de caja`. `CerrarCajaUseCase` uses it; fiado is
   excluded by construction. **Expenses gain `cajaTurnoId`.**
4. **The denomination count is a JSON column on `caja_turnos`**, written once
   at close and immutable afterwards.

**Consequences**

- `client_payments` migrates from per-sale to per-client with an old → new test.
- The receivables UI hook in `packages/ui` is replaced by the domain function.

---

## ADR-075

**Title:** Owner-to-operator messages and operator replies are two synced tables; «De tu caja» is derived on the device; `notices` is untouched

**Date:** 2026-09-17

**Status:** Accepted — two new entities; Track O

**Context**

The operator's Avisos has two tabs. «De Pedro» carries owner messages — chiefly
«Pedro te pidió aclarar el corte del 13» — which the operator answers in place,
and which also drive the «Lo primero» card on Inicio. «De tu caja» carries
system notices (unsent records, low stock). `notices` (ADR-060) is portal-only,
has no recipient, holds one owner-scoped `state`, and shares rows with the
Asesor, which must never reach a device.

**Decision**

- **`mensajes_operador` (DOWN):** recipient operator, optional turno reference,
  severity, body, created time. Written by the portal (Cortes de turno's
  «Pedir aclaración», phase 13) with its `sync_log` append (ADR-062).
- **`respuestas_operador` (UP):** the message answered, the text, the operator.
  Shown in the owner's cortes panel and Avisos.
- **Read state per operator lives only on the device.**
- **«De tu caja» is derived locally** from the device's own data; nothing syncs.

**Alternatives considered**

- *Sync `notices` down with a recipient column.* Pulls would have to filter out
  Asesor rows, and one `state` cannot hold two readers.
- *An online-only API for notices.* A reply written offline would be lost or
  need a second queue.


---

## ADR-076

**Title:** The radius scale gains the dense steps 11 and 13; 15 and 17 are corrected upstream to 16

**Date:** 2026-09-17

**Status:** Accepted — amends ADR-057's radius ladder; Track O

**Context**

ADR-057 fixed the portal's radii at 8/10/12/14/16/18/20/22, and `design-lint`
enforces it. The operator handoff uses 13 px (24 times: keypad keys, 52 px
buttons, inputs) and 11 px (17 times: 40–42 px icon boxes, quantity steppers),
and its README names both in the scale («8/10/11/12/13/14/16/18/20/22»). It also
uses 15 px twice and 17 px three times, values neither list contains.

**Decision**

- `@xangarro/tokens` exports `denseRadii = { r11: 11, r13: 13 }`, emitted as
  `--r-11`/`--r-13`, accepted by `design-lint` and listed in `DESIGN_CONTRACT.md`.
- `radii` is **not** changed: about eighty call sites (portal and phone) index it
  by position, and inserting values would silently re-round every one of them.
- The five uses of 15 and 17 (`Operador Estado`, Inicio, Detalle de cliente,
  Revisión de caja) are corrected to 16 in the design project. Until that pull
  lands, code uses 16 and says so in the task's Done line.

**Consequences**

- The dense steps are for the operator's density; the owner portal keeps the
  original ladder unless a design file asks for 11 or 13.

---

## ADR-077

**Title:** `yellowRule` (#DBB80A) replaces the design's translucent divider on yellow cards

**Date:** 2026-09-17

**Status:** Accepted — Track O (O-15, and Cierre in fase 12)

**Context**

The Turno and Cierre hero cards separate their breakdown rows with
`2px solid rgba(13,13,13,0.15)`. The handoff README forbids transparency except
the modal veil, `design-lint` rejects `rgba()` in components, and no existing
token matches (`yellowDeep` is nearly invisible on `yellow`).

**Decision**

`colors.yellowRule = '#DBB80A'`: 15 % of `#0D0D0D` over `#FFD60A`, flattened.
Pixel-identical to the design on yellow, opaque, and documented as valid only
there.

**Alternatives considered**

- *A second translucent token beside `scrim`.* Faithful, but breaks the rule
  outright and invites more.
- *Amend the design to `yellowDeep` or black.* Changes the look; the designer's
  call, not ours.

---

## ADR-078

**Title:** The sync cursor is a per-tenant counter taken under a row lock; pull pages one ordered stream; UP rows get receipts, not log entries

**Date:** 2026-09-17

**Status:** Accepted — B-08, B-09; closes audit findings DB-SYNC-01, -03, -04, -05 and DB-TYPE-01

**Context**

`sync_log.seq` was a global identity column, assigned at INSERT, not at commit.
Two writers could take 5 and 6, commit 6 first, and a pull serving `max(seq)`
would hand out 6 — the device then never pulls 5. The DB audit reproduced this,
and `/activate` already served `max(seq)`. The planned pull also paged each table
to 5 000 rows and served "the max returned", which skips rows whenever two tables
truncate at different seqs, and logging every pushed UP row would make each pull
scan past other phones' sales.

**Decision**

1. **`sync_cursors`**: one row per tenant, incremented with `INSERT … ON CONFLICT
   DO UPDATE … RETURNING`. The row lock lasts until commit, so within a tenant
   seqs commit in order, and a reader serving the *committed* counter can never
   serve a cursor above an in-flight row. `sync_log.seq` becomes `bigint`, keyed
   `(business_id, seq)`. Existing seqs are kept and each counter starts at its
   tenant's maximum.
2. **Pull reads the cursor first**, then the rows: a write landing in between is
   sent twice (harmless), never zero times. `since = 0` is the full reference set;
   otherwise the page is the first N log entries in seq order, and a truncated
   page's cursor is its last seq.
3. **`sync_log` holds DOWN and HYBRID changes only.** A pushed UP row gets a
   `sync_receipts` row (its serverSeq and accepted version), which answers the
   idempotent re-push and feeds `devices.acknowledged_through`.
4. **Each pushed row runs in a savepoint, on the savepoint's own handle.** An id
   owned by another tenant surfaces as RLS 42501 (upsert) or as an invisible
   existing row (HYBRID insert); both become `DUPLICATE_CONFLICT`.

**Alternatives considered**

- *Cap the served cursor below the oldest in-flight xid (`pg_snapshot_xmin`).*
  No write serialisation, but the cap is global, so one slow tenant would stall
  every tenant's cursor, and the reasoning is harder to test.
- *`pg_advisory_xact_lock` per tenant.* Same serialisation, but the counter
  would still need a home, and a row lock on it is the lock.

**Consequences**

- Writers for one business are serialised for the length of their transaction.
  A micro-business has a handful of phones; if that ever shows, allocate a block
  of seqs per batch.
- Push's top-level `serverSeq` is informational. The phone must take its pull
  cursor from pull responses only (recorded in B-08 for A-06).
- The contract has no `hasMore`; the phone pulls again while a pull returns rows
  until C-04 is amended.

---

## ADR-079

**Title:** Portal sessions are server-side; throttling lives in Postgres

**Date:** 2026-09-17

**Status:** Accepted — B-17; closes security audit findings SEC-AUTH-01 and SEC-AUTH-02, and the rate-limit half of SEC-DEV-01

**Context**

The portal session cookie was an HMAC-signed copy of the claims. It had no
expiry of its own, logout only deleted the browser's copy, and a member removed
or demoted kept their old role for as long as the cookie lived. Sign-in had no
throttling, answered faster for unknown addresses, and ran as a role that could
`SELECT` every tenant's password hash. `/activate`, the one endpoint with no
token in front of it, could be guessed at freely.

**Decision**

1. **Sessions.** The cookie is 256 random bits; `xangarro.portal_sessions`
   stores only its SHA-256. Every request resolves it through
   `xangarro.session_resolve`, which joins the member's **current** role: logout
   (revocation), 30-day absolute expiry, 7-day idleness and removed membership
   all end a session immediately. The claims keep Supabase's shape, so
   `withTenant` and RLS are unchanged. `SESSION_SECRET` is gone.
2. **Throttling in Postgres** (`xangarro.throttle`, keys are SHA-256 of the
   subject, never an email or IP): sign-in 5 failures per address / 20 per IP in
   15 min → 15-min lockout; `/activate` 5 guesses per IP and 5 per code → 15-min
   lockout, checked before anything else; 60 calls/min per device, `429` +
   `Retry-After`. All limits are in `server/throttle-policy.ts`.
3. **Sign-in reads one hash.** The app role has column grants on `auth.users`
   without `encrypted_password`; `xangarro.login_lookup(email)` returns one
   account's. Unknown addresses are compared against a dummy bcrypt hash so the
   response time is the same.

All tables live in the `xangarro` schema with no app privileges, reached only
through SECURITY DEFINER functions with a pinned `search_path` (as 0002).

**Alternatives considered**

- *Keep the signed cookie, add `exp` and a revocation list.* Still needs a table
  lookup per request to honour revocation and role changes, so it is the same
  cost with two mechanisms instead of one.
- *Upstash/Redis for rate limits.* A new vendor for a few hundred rows.

**Consequences**

- One small DB round trip per portal request (cached per request).
- Per-IP limits trust `x-forwarded-for`'s first entry, which is correct behind
  Vercel and wrong anywhere without a trusted proxy in front.
- The throttle table is never pruned yet; expired rows are inert. A nightly
  delete is B-16's.
- Hosted Supabase (B-03): the definer functions must be owned by a role that
  bypasses RLS (audit DB-RLS-03), and the Data API must not accept these
  tokens (SEC-DATA-01).

---

## ADR-080

**Title:** Five owner decisions: own auth with emailed links, portal-only code issuance, portal-only feature flags, Deno in CI, portal creates products

**Date:** 2026-09-18

**Status:** Accepted — decided by the owner; amends B-11, B-16, P-02, P-07, P-15, F-10 and the phone's flag toggle (A-12)

**Decision**

1. **Auth stays ours.** The portal keeps its own password login and
   server-side sessions (ADR-079). Magic links and password resets are
   one-time, single-use, short-lived tokens sent by email (B-14), stored hashed
   like sessions. Supabase Auth (GoTrue) is not adopted, which retires the
   "provider undecided" note in P-02 and ADR-061. This unblocks B-16's
   "resend magic link".
2. **Activation codes come only from the portal** («Generar código»). No SQL or
   Studio issuer (B-11's Studio item is dropped), so the alphabet has one
   source: `ACTIVATION_CODE_REGEX` in the contract.
3. **Feature flags are set only in the portal** (Negocio → Funciones, P-15).
   `businesses` is DOWN; a phone-side toggle changed that one phone and nothing
   else. The phone shows flags read-only; its toggle is removed (Track A, with
   A-12), as ADR-072 did for PINs.
4. **The edge function is checked by Deno itself.** `deno check` runs in CI (the
   official setup-deno action) alongside the ESLint/tsc/Vitest checks F-10 added.
5. **The portal may create products** (P-07's «Nuevo producto» and Excel
   import). Products stay HYBRID for phones — insert up, edits down — and a
   product created in the portal reaches every phone through `sync_log`. ULIDs
   make portal/phone ids collision-free.

**Consequences**

- B-14 (transactional email) now carries the sign-in link and reset templates.
- ADR-061's provider-neutrality note is settled in favour of our own issuer; the
  Supabase claim shape stays, because RLS reads it.

---

## ADR-081

**Title:** Inventory movements flow to every phone (UP → HYBRID); the portal records movements; portal-created products start at zero stock

**Date:** 2026-09-18

**Status:** Accepted — decided by the owner; amends contract §8, ADR-058 §2 (Movimientos no longer read-only) and P-07

**Context**

Phones do not store stock; they sum `inventory_movements`. The table was UP
(phone → cloud only), so a phone only ever summed its **own** movements: with
two phones, each showed stock missing the other's sales and entradas, and a
movement recorded in the portal could never reach any phone. The owner also
wanted the portal to record stock (entradas, mermas, ajustes), and decided that
products created in the portal start at zero rather than carrying an initial
stock.

**Decision**

1. `inventory_movements` moves from `UP_TABLES` to `HYBRID_TABLES`: phones and
   the portal insert; nobody updates (a movement is never edited, only
   recorded); every insert is logged and pulled by every phone. The bootstrap
   (`/activate`, `since = 0`) sends every live movement, so a new phone's stock
   is right from the first pull. `ReferenceTablesSchema` gains
   `inventory_movements` (default `[]`, so older servers still parse).
2. The portal records movements per product («Movimiento» on a catalogue row)
   through `RegistrarMovimientoInventarioUseCase`, the phone's own. Salidas
   leave out «Venta»: sales come from phones, with a ticket.
3. The entrada's "Compra inventario" expense stays UP-scoped (cloud-side):
   phones capture expenses, the portal reports them.
4. Products created in the portal (ADR-080) start at stock 0; the import
   template has no `stock_inicial`. Stock is added with a movement.

**Consequences**

- Track A (A-06): the phone must apply pulled movements idempotently by id —
  its own come back too — and recompute stock from the merged set.
- The activation payload grows with the movement history. Fine for a micro
  business; if it ever is not, page the bootstrap through `/sync/pull`.
- Found on the way: the seed's entradas used the motivo `'Compra'`, which is not
  an entry reason; the first bootstrap that carried movements failed its own
  response check. The seed-contract test now parses every seeded movement.

---

## ADR-083

**Title:** Track O's open design questions get provisional answers so the screens can close; each is reversible by the owner

**Date:** 2026-09-18

**Status:** Accepted, provisional — the owner may reverse any item; each lists what changes if so.

**Context**

Fases 10–13 of Track O (the operator register and two owner screens) left seven
questions that the design files do not settle. Waiting on each would leave
screens with known wrong behaviour (an abono larger than the balance silently
lost; a WhatsApp confirmation claiming a message was sent), so they are decided
here with the option Track O recommended, and marked provisional.

**Decision**

1. **D1 — Type floor.** 12 px stays the floor for both ramps; the one exception
   is `portalFontSizes.tag` (11) for tags, chips and the phone tab bar, the
   design system's `.t-tag` (always bold, never a sentence). *If reversed:* raise
   `tag` to 12 and ask the design to follow.
2. **D2 — WhatsApp wording.** The portal opens `wa.me` with the text; it cannot
   send. Confirmations say «WhatsApp abierto con el comprobante / recordatorio
   para el …» instead of the files' «enviado». *If reversed:* restore the file's
   sentence (two strings).
3. **D3 — Receipt photos.** Stored in a private Supabase Storage bucket per
   business (`comprobantes/<business>/<turno>/<gasto>.jpg`), uploaded by the
   register's outbox after the expense row syncs, and referenced from the
   expense by path. No bytes travel through `/sync`. Built with O-06; nothing
   ships now.
4. **D4 — Expense categories.** The operator's five map onto the domain's
   `ExpenseCategory`: Insumos → Materia Prima, Servicios → Servicios,
   Transporte → Logística, Mantenimiento → Mantenimiento, Otros → Otro
   (`src/operador/vocabulario.ts`).
5. **D5 — An abono above the balance.** The whole amount is recorded; what
   exceeds every open ticket is **saldo a favor** (ADR-074's term), shown in the
   abono preview and the toast, and applied to the client's next fiado. Never
   capped silently: the cash is in the drawer.
6. **D6 — Close-out reasons.** The five map onto `DiscrepancyReason`'s six:
   Cambio mal dado → error-en-cambio; Vale de empleado → retiro-autorizado;
   No sé → faltante-sin-explicacion or sobrante; Venta no registrada and
   Propinas → sobrante when over, otro when short. `gasto-no-registrado` is left
   to the expense screen. The operator's label travels in the note.
7. **D7 — One account history.** Cobranza and Detalle de cliente read one set of
   accounts (tickets + abonos). Where the files disagree (Chuy's abono today),
   Cobranza's history wins, because Inicio, Turno and Cierre depend on its
   $550.00 in cash abonos. Detalle de cliente's Chuy therefore differs from its
   file until the design adopts one history.

**Consequences**

- The design amendments list (plan §4b) gains the files' side of D2 and D7.
- D3 and D6 bind O-06's writers; D4 binds the Gastos writer.

## ADR-082

**Title:** The business's régimen is stored as its SAT code; the name bucket is derived

**Date:** 2026-09-18

**Status:** Accepted — decided by the owner; amends P-08 (régimen option cards)

**Context**

`businesses.regimen_fiscal` held a name bucket («RESICO», «RIF», «Asalariados»,
«Otro») typed on the phone. The CFDI router needs SAT's c_RegimenFiscal code
(626), so a tenant with a valid RFC still fell through to the global CFDI, and
«Otro» cannot be turned into a code at all.

**Decision**

1. New nullable column `regimen_sat` (SQLite 0002, Postgres 0013), the source of
   truth. Existing rows are backfilled from the bucket (RESICO → 626, RIF → 621,
   Asalariados → 605); «Otro» stays NULL and the portal shows «Falta por
   completar» until the owner picks.
2. `regimen_fiscal` stays, **derived** from the code by `regimenPatch()` in
   `@xangarro/domain/fiscal` (626 → RESICO, 621 → RIF, 605 → Asalariados, any
   other → Otro), so phones that read the bucket for ISR keep working.
3. Display names come from one map, `REGIMEN_NOMBRE`. The portal picks the
   régimen from cards (626, 612, 601, 606, 605); a change offers the bucket's
   suggested ISR rate behind a switch, never silently.

**Consequences**

- Track A: the phone's BusinessForm should write the code too (via
  `regimenPatch`), not the bucket.
- The CFDI port should read `regimen_sat` instead of mapping the bucket.

## ADR-084

**Title:** The marketing site joins the monorepo as `apps/landing`

**Date:** 2026-09-18

**Status:** Accepted — decided by the owner; supersedes the repo half of README Q18
("Landing stays a separate Vite repo"). Q18's other half — marketing only, CTAs link to
`app.xangarro.mx/signup?plan=…` — stands.

**Context**

The landing lived in its own repo (`CachinkLanding`, Vite + React, prerendered by
`scripts/prerender.mjs`). The owner wants one repo: one CI, one dependency policy, and the
launch copy (Track L, N-31) edited next to the prices and plan slugs it must match.

**Decision**

1. **Import with history.** `git subtree add --prefix=apps/landing <CachinkLanding> main`
   (972952c, three commits, not squashed), so `git log -- apps/landing` keeps its past.
   The history carries no `.env`, `dist/` or `node_modules/`.
2. **A pnpm workspace member,** `@xangarro/landing`. `package-lock.json` is gone; the root
   lockfile covers it. Scripts match the turbo tasks: `dev`, `build`, `preview`, `lint`,
   `typecheck`, `test`, `clean`.
   - `typecheck` is a no-op: the site is plain JS, and adding `checkJs` would mean typing
     every component first — a port, not an import.
   - `test` is the production build, whose prerender asserts each route's H1 is in its
     HTML. That makes `pnpm test` (and so CI) the landing's build gate without a new job.
   - A scoped `pnpm.overrides` entry (`@xangarro/landing>react`, `>react-dom` → 18.3.1)
     keeps it on React 18: the repo-wide pin is 19.2.6, and the import upgrades no major.
     Upgrading means deleting those two lines.
3. **Lint scope.** The root ESLint config gains one `apps/landing/**/*.{js,jsx,mjs}` block:
   JSX parsing on, and the size/shape rules (`max-lines`, `max-lines-per-function`,
   `complexity`, `sonarjs/cognitive-complexity`, `sonarjs/no-duplicate-string`,
   `unicorn/filename-case`) off. CLAUDE.md §2.6's limits are for the product's layered
   code; the brochure's components are PascalCase `.jsx` with long declarative sections,
   and splitting them belongs to Track L, not to the import. Every correctness rule stays
   on, and no `eslint-disable` is added (one was removed). Its `lint` script runs from the
   repo root because flat-config `files` globs resolve from the cwd. `design-lint` and
   `store-compliance` scan fixed roots that do not include it; Prettier now formats it.
4. **Deploy.** Its own Vercel project, `xangarro-landing` (root directory `apps/landing`),
   served at `xangarro.mx`; `apps/landing/vercel.json` sets framework `vite`, build
   `pnpm run build`, output `dist`. CTAs still point at `app.xangarro.mx/signup?plan=…`.

**Consequences**

- Shared CI: every PR lints, and builds and prerenders the landing.
- The old GitHub repo is to be **archived** by the owner, not deleted.
- Content and branding are untouched (`VITE_SITE_URL` still says cachink.mx); the rebrand
  is Track L (L-01…L-05) and N-31, whose paths are now under `apps/landing/`.
- Suggested follow-ups: React 19 (drop the override), Vite 8, `@vitejs/plugin-react` 6.

## ADR-085

**Title:** Track O's design amendments landed upstream; the operator code follows the pulled files

**Date:** 2026-09-18

**Status:** Accepted — settles D2, D5 and D7 of ADR-083

**Context**

Plan §4b listed fourteen places where the operator and owner design files disagreed with each
other, with the README, or with ADR-072/074/075/076/077. The owner applied them in Claude Design
and the 16 files were pulled into `design-reference/operador/` (a mirror, never hand-edited —
ADR-058).

**Decision**

1. The pulled files are the specification again, with no standing deviations for the first
   round: one example day ($3,120.00 cobrado, $1,980.00 in cash, $620.00 of gastos, $2,710.00
   expected), one account history, one shell, Cierre counting from zero.
2. ADR-083 **D2** (WhatsApp «abierto», never «enviado»), **D5** (an abono above the balance is
   saldo a favor, said in the preview, the history and the toast) and **D7** (Cobranza and Detalle
   de cliente read one history) are now drawn in the files and stop being provisional. D1, D3, D4
   and D6 stand as written.
3. Sentences the files build from counts and dates live once, in `src/operador/ui/frases.ts`
   (cancellations, receipts, due dates «Vence el viernes» / «Se venció ayer»); `HOY` moves to
   `src/operador/fixtures.ts`.
4. Owner `DataTable` gains an `empty` slot and `EmptyState` an `inset` form, so a filtered table
   shows its empty state under its header row (Cortes de turno).
5. Three residual points go to a second round (plan §4b): lowercase count words, a gray-400
   «×0» under AA, and three owner-component values that differ from what the files draw. Code
   keeps the capitalised, AA-safe and owner-component versions until the files answer.

**Consequences**

- O-12 (Acceso) is no longer blocked on design; it waits on O-04 and O-06 only.
- Unit tests and E2E specs use the new figures; the harness comparison is box-for-box on the
  operator screens except text the runtime splits and the capitalised hints.

## ADR-086

**Track N utility screens are code-first under the token contract; receipts stay design-first**

Date: 2026-09-18 · Supersedes: none · Amends: ADR-058 (design governance scope, for the screens named below)

**Context**

ADR-058 makes the Claude Design project the specification for every portal screen: visual changes
land there first, mirrored read-only into `design-reference/`. Track N's pending work
(`09-next-features.md` N-16…N-20) adds several portal surfaces, but the repo's design mirror only
covers the operator handoff — the Director-portal mirror (P-18) never landed — and no designs exist
for the unified `/importar` screen, the Comprobantes section, the inventario-inicial step, or the
N-18 backoffice flows. Waiting on owner-authored designs for every one of them would stall most of
Track N, while the backoffice has always been built code-first under `design-lint` (its ROOTS
include `apps/backoffice/src`) with the `negocio/edicion` tabbed-form pattern as precedent on the
web side.

**Decision** (owner interview 2026-09-18)

1. **Receipt templates (N-20) stay design-first**, exactly as ADR-058 requires: the four templates
   land in the Claude Design project and are mirrored into `design-reference/` before the renderer
   is built. Receipts are the most merchant-visible surface in the epic and the spec's language
   ("designed templates", contrast check) points at a real design pass.
2. **The Track N utility screens are code-first** under `DESIGN_CONTRACT.md`'s eight replication
   conditions, the `@xangarro/tokens` contract and `design-lint`: the unified `/importar` screen
   (N-16), the saldos iniciales review + inventario inicial (N-17), the Comprobantes section inside
   `negocio/edicion` (N-19), the `/ayuda` page and the N-18 assisted-import flows. They compose
   existing, already-designed primitives (option cards, tabbed forms, tables, drawers); no new
   visual language is invented.
3. This is a scoped exception, not a general relaxation: any Track N screen whose design judgment
   matters beyond composition gets the same design-first treatment as the receipts. The sidebar
   nav stays exactly as the design files define it (no "Importar" item was added for N-16).

**Consequences**

- Track N's UI work is unblocked without pretending a design review happened.
- `pnpm lint:design` remains the enforced floor for every screen named in (2).
- When P-18's Director mirror finally lands, these screens are candidates for a design pass; any
  visual change then follows ADR-058's design-first rule again.

---
---

## ADR-087

### The account's display name lives on `auth.users`; celebrations are marked in a write-once table

**Date:** 2026-09-19
**Status:** Accepted (decides owner action O-24; P-13, P-27, P-33)

#### Context

Inicio's greeting is «Hola, {nombre}», but accounts carried no display name — the greeting was the
hardcoded «Pedro». Signup collects a *business* name (its `nombre` field and the wizard's first
question are both the negocio's); no screen ever asked the person's name. O-24 asked where the name
should live once collected: `auth.users` metadata, a `business_members` column, or an
`auth.users` JSONB blob. P-33 separately needed a cross-device «shown once per achievement» record
for the takeover and streak-milestone toasts.

#### Decision

1. **`auth.users.nombre` — a text column (migration 0020).** The name belongs to the person, not to
   a membership: one account has one name in every business it belongs to, and a per-membership
   column would give the same person a different greeting per business and force signup to write it
   on every future membership. JSONB was rejected — one known field does not justify unstructured
   storage every reader must parse.
2. **No new grant on `auth.*`** (the standing rule): `account_create` (0018) gains the name as a
   parameter — the old four-argument form is dropped, not overloaded, so no caller can mint a
   nameless identity by accident — and `session_resolve` (0005) returns it with the rest of the
   session. A blank name is stored as `NULL` (`NULLIF(btrim(…), '')`); the greeting renders bare
   «Hola» rather than «Hola, » for accounts without one.
3. **Collection point: signup**, an optional «Tu nombre» field (autoComplete="name") beside email
   and password. Optional, because the product principle is fewer required fields; an unnamed
   account degrades gracefully.
4. **`celebraciones`** — one portal-only table marking what has been shown: `(business_id, clave)`
   with deterministic keys («meta:{id}», «racha:3»). Write-once: the app role holds SELECT and
   INSERT only (0001's default privileges grant all four DML rights, so the migration revokes
   UPDATE and DELETE back). Client-side state (localStorage) was rejected — once-per-achievement
   must hold across devices, and the viewer-hiding is enforced server-side anyway.

#### Consequences

- **Amended 2026-09-19 (migration 0024):** hosted Supabase refuses DDL on `auth.users`
  (`supabase_auth_admin` owns it), so the name lives in `raw_user_meta_data` — the platform's
  own custom-data column — not a `nombre` column. The JSONB objection in the decision above
  loses to a platform constraint; one known field in one key («nombre») is the whole surface.
- The seeded owner is «Pedro» / the contador «Laura», so the greeting renders from real data.
- `session_resolve`'s return changed shape (nombre added): every portal session now carries it.
- Goals close lazily (`CerrarMetaUseCase`, P-27) and the takeover/toast read these markers, so
  P-33's «shown once» is a property of the data, not of a browser.

---

## ADR-088

### The Asesor's deterministic layer materialises on read, ahead of P-30's cron

**Date:** 2026-09-19
**Status:** Accepted (P-26; amends ADR-056's timing, not its shape)

#### Context

ADR-056 puts Asesor generation on Vercel Cron — one business per invocation, the deterministic
layer first, the model call last. But P-30 is gated behind the model credential, and nothing
writes `source='asesor'` rows: the feed read an empty table while the deterministic insights were
already computable. A fourth web cron (a fifth account-wide) would also spend the Vercel cron
budget O-7 has not confirmed, for content that needs no scheduler.

#### Decision

1. **Materialise-on-read.** When the Asesor page loads, the server computes the deterministic
   insights (`@xangarro/domain/asesor`: cost deltas, quincena seasonality, expense anomalies,
   stale inventory, duplicate gastos), filters them by the plan's cadence, and **upserts them
   into `notices`** under deterministic ids (`{businessId}:{clave}`). The feed still *reads*
   `notices`, exactly as ADR-060 designed — the table is the contract; only the writer moved.
2. **Dismissals survive recomputes.** The upsert never touches `state` or `resolved_at`; an
   insight that fixed itself (the duplicate was cancelled, the stock moved) auto-closes as
   `listo`, which is what «Anteriores» shows for dealt-with rows.
3. **The cadence gates the set, not the freshness** (owner decision, 2026-09-19): `semanal`
   (Xangarrito) receives the two most urgent insights by a deterministic ranking; `diario`
   (Xangarro) and `completo` (Xangarrote) receive all — always recomputed at read, never a stale
   weekly snapshot.
4. P-30 lifts the same `calcularInsights` functions into its cron + model step unchanged when
   the credential lands; this ADR describes the interim writer, not a second generator.

#### Consequences

- The Asesor ships with real content on every tier with no new infrastructure.
- A page load may write rows (upserts of a handful of notices) — an acceptable side effect of a
  read path, and the reason the seed's `/asesor` visits in e2e are covered by the routes sweep.
- «Próximamente» still gates only the model-backed Diagnóstico/catálogo paths (ADR-059).

---

## ADR-099

**Date:** 2026-09-20 · **Status:** Accepted · **Track:** N-20 (comprobantes)

### One SVG renderer for the receipt templates; PDF is a page of that raster

#### Context

N-20 needs four receipt templates (Clásico, Moderno, Ticket, Minimal) rendered as
the WhatsApp PNG (1080 px) and as print PDFs (media carta / 58 mm roll / A6),
from one `Comprobante` contract, for the portal live preview now and the phone
later. The obvious split — an HTML/CSS layout rasterized for PNG plus a
`@react-pdf/renderer` tree for PDF — would maintain every template twice, and
the two outputs would drift.

#### Decision

1. **The layout lives once, in the domain, as SVG** (`domain/src/comprobante/svg/`):
   pure string builders with no DOM, no measurement — the fichas size by
   character counts («24 px si pasa de 24 caracteres»), so wrapping and
   truncation are count-based and deterministic. Snapshots (12 artboards) are
   the transcription contract.
2. **Contrast is one function**: relative luminance > 0.45 → `#0D0D0D`, else
   `#FFFFFF`, decided once per comprobante and applied to every tinted block.
3. **PNG**: the web rasterizes the SVG with sharp at the target widths. Fonts
   are vendored OFL TTFs (Plus Jakarta Sans 400–800, JetBrains Mono 400–700);
   Linux resolves them through a fontconfig conf generated at render time
   (absolute paths — fontconfig resolves relative `<dir>` against the CWD);
   darwin rasterizes through CoreText, so dev machines install the same files
   via `apps/web/scripts/fuentes-comprobantes.sh`.
4. **PDF is the raster on paper**: `buildComprobantePdf` (application, the
   informe's Blob pattern) wraps the print-destination PNG in one
   `@react-pdf/renderer` page sized to the template's paper. One layout, two
   salidas; the phone can reuse both halves as-is.
5. Two destinations differ only in scaffold: `whatsapp` floats the card on the
   off-white with its hard shadow; `impresion` fills the page flat and pads
   Clásico/Moderno to the media-carta proportion.

#### Consequences

- A design change is one SVG edit; both outputs move together.
- The PDF is a high-density raster (1500 px wide), not vector text — accepted
  for receipts; the informe keeps its native-text PDF.
- `Tarjeta`'s pill colour (`#FFF8E1`, warning-soft) is the single inferred
  value in the transcription (no artboard shows it).
- The `direccion` block renders only when an address source exists; C-15's
  `address_print` is stored but nothing feeds it yet.

---

## ADR-089

### Régimen-aware ISR from the published SAT tables, with a reference disclaimer

**Date:** 2026-09-20
**Status:** Accepted (resolves finding F-2; owner asked for tables-from-the-web + disclaimer instead of waiting on O-25's contador)

#### Context

The statements computed `ISR = utilidad operativa × isr_tasa` whatever the régime. RESICO
(626) — the most common régime among the target users — is levied on **gross income**, so the
number was structurally wrong for exactly those users (F-2). O-25 asked the contador which base
per régime; the owner chose to ship from the SAT's own published tables now, with a disclaimer,
and let O-14's sign-off refine later.

#### Decision

1. **The tables are code** (`@xangarro/domain/financials/isr-regimen.ts`), integer centavos,
   sourced from the Anexo 8 RMF 2026 (DOF 28/12/2025) and Art. 113-E LISR:
   - **626 RESICO:** flat rate over the whole month's gross income by bracket — 1.00 % ≤ $25 K
     rising to 2.50 % > $350 K. (Note: the seed comment's old sketch said 2.5 % from $291 K —
     the published table has a 2.25 % bracket to $350 K first.)
   - **612 PF Empresarial y Profesional:** the Art. 96 monthly tariff (quota + marginal,
     1.92 %–35 %) on utilidad operativa as the proxy for the base gravable.
   - **Anything else** (621 RIF, 605, morals, none): the owner's own rate on utilidad — the
     exact pre-ADR behavior.
2. **`calculateEstadoDeResultados` takes an optional `regimenSat` (+ `mesesEnPeriodo`).**
   Without it — the phone's case — behavior is byte-identical to before; no phone release is
   required. Multi-month periods spread across the monthly tables (per-month base = total ÷
   months, ISR × months).
3. **The disclaimer travels with every ISR figure** (owner wording): «Es una referencia
   calculada con las tablas publicadas del SAT. Para tus cifras y deducciones reales, consulta
   a tu contador.» The notice also names the base used («sobre tus ingresos» vs «sobre tu
   utilidad»), and the loss variant («no hubo utilidad…») applies only to profit-based
   régimes — a RESICO loss month still owes its estimate on gross.
4. The tables are year-keyed in spirit: if SAT updates them, the module is the one place to
   change, with the tests' published examples as the guard.

#### Consequences

- F-2 closes structurally for 626/612; the estimate remains an estimate (no personal
  deductions, PTU, ajustes) — the disclaimer says exactly that, and O-14's contador sign-off
  stays open for the nuances.
- The seeded business (626) now shows a small ISR even in May's loss month — correct under
  RESICO, and covered by e2e.

---

## ADR-090

**Title:** `informeMensual` moves down to Xangarro; the mock gains `over-limit`; the PAC contracted for subscription CFDIs must serve a future tenant-facing facturación add-on

**Date:** 2026-09-21

**Status:** Accepted — amends ADR-059's matrix values; rides on the C-12 limits rework landed in 2a70b7f3

**Context**

The owner reviewed the plan matrix on 2026-09-21 after C-12's limits landed
(300/50 · 10 000/1 000 · 30 000/5 000, advisory transactions, the advisory
quota). One cell was wrong: `informeMensual` sat on Xangarrote alone, yet
Xangarro already renders the LLM-written conclusiones on the estados
financieros — the fancier artifact was cheaper than the simple one being gated
higher. The deterministic contador PDF is the retention hook at the tier where
retention is won; the SAT-facing reality of an RCC/RESICO emprendedor makes
monthly reporting near-mandatory, not a luxury. A $199 payer told "no PDF for
your contador" feels nickeled at the moment of maximum loyalty, while
Xangarrote's value stands on permisos, the production-inventory set and Asesor
completo.

The owner also set a constraint for the future: the PAC contracted to stamp
Xangarro's own subscription CFDIs should be chosen so the same integration can
serve a post-launch facturación add-on for tenants.

**Decision**

1. `informeMensual` is true on xangarro and xangarrote, amending ADR-059's
   values. The pricing cards say so («Informe mensual para tu contador» on
   Xangarro), and the estados header/route comments follow.
2. The mock gains the `over-limit` scenario (xangarro with
   `transactionsPerMonth: 5`), the C-12 step-6 affordance for E2E to hit the
   advisory warnings in a few captures.
3. **PAC selection constraint (CFDI reuse):** when Xangarro contracts a PAC to
   invoice its own subscriptions, it must be an API-first, **multi-emisor**
   PAC, because the same stamping wiring — auth, CFDI JSON in, XML + QR out,
   storage — is the intended foundation for a post-launch tenant-facing
   facturación add-on. The part that does not transfer is per-tenant emitter
   onboarding: each business's own CSD (certificado de sello digital) and
   fiscal data. That gap, not the PAC call, is the add-on's real cost. The
   fiado model maps to CFDI 4.0's Complemento de Recepción de Pagos (abonos →
   pagos parciales), and stamping is a server-side external call exactly like
   ADR-066's payment intents — the phone keeps writing the venta.
4. Pricing-card copy follows the table the handoff froze: «Hasta 300
   transacciones al mes / Catálogo de hasta 50 productos» (Xangarrito),
   «Informe mensual… Hasta 10 000 transacciones… 1 000 productos» (Xangarro),
   «30 000… 5 000» (Xangarrote). No line promises "ilimitado" any more —
   every tier's numbers are now real.

**Alternatives considered**

- *Leave `informeMensual` on Xangarrote.* Rejected: the conclusiones/PDF
  inconsistency, and the retention argument above.
- *Bundle a WhatsApp-sending or Asesor add-on into this change.* Rejected:
  those remain separate decisions (the manual `wa.me` share stays free on
  every tier; the Asesor stays bundled and tiered by cadence).

**Consequences**

- `apps/web`'s informe-mensual e2e moves its negative case (hidden button,
  403 route) from the seeded Xangarro tenant to a throwaway free-plan tenant,
  and gains a seeded-tenant assertion that the button now shows.
- Xangarrote's card loses no bullet it can't spare; the wizard (ADR-067) has
  nothing new to badge — the move widens Xangarro, it does not narrow
  Xangarrito.
- The values may change again by owner intent ("we might change it again
  later"); after this ADR they change in one place (`plan.ts`) plus the
  pricing copy.

---

## ADR-091

**Title:** Infrastructure failures in the console's auth flow become form
state, not an unhandled throw; the console gains error boundaries

**Date:** 2026-09-22

**Status:** Accepted

**Context**

Wiring the hosted admin deployment on 2026-09-22 produced two failures in a
row at `admin.xangarro.mx/login`, each shown as Next's generic server-error
page with no usable text: `AuthCoreError/INVALID_KEY` (`ADMIN_TOTP_KEY` was
never set on the Vercel project) and Postgres `28P01` (the project's
`DATABASE_URL` carried a stale password for `xangarro_admin`). Both are
misconfigured deployments, not bad credentials, and both had a one-line fix
that the screen could not name.

`loginRefusalMessage` (ADR-080's SEC-AUTH-02 work) already handles the other
half well: a refused *credential* gets one generic sentence in production and
a diagnostic one under `ADMIN_DIAGNOSTICS=1`. Nothing covered a sign-in that
never reached a verdict. `server/actions/auth.ts` called `authDeps()` and
`signIn()` with no try/catch, and `apps/backoffice/src/app` had no `error.tsx`
at any level.

A Next.js error boundary cannot close this gap on its own: React redacts
`error.message` in production and passes only `digest`, so a boundary can
report that something failed but never what.

**Decision**

1. `server/auth/infra-failure.ts` — a pure classifier walking the `cause`
   chain (drivers wrap: `postgres` puts the SQLSTATE on the cause of its own
   Error) and mapping known codes to a cause: `INVALID_KEY` → `totp-key`,
   `28P01`/`28000` → `db-credentials`, `3D000` → `db-missing`,
   `ECONNREFUSED`/`ENOTFOUND`/`ETIMEDOUT`/`EAI_AGAIN` → `db-unreachable`,
   everything else → `unknown`.
2. `infraFailureMessage` reuses `Diagnostics` and the `loginRefusalMessage`
   rule exactly: one identical sentence for every cause in production; the
   variable to fix plus `dbFingerprint()` under `ADMIN_DIAGNOSTICS=1`. The
   full error is logged server-side either way.
3. `detail` carries the code, or the error's *name* — never its message,
   which quotes query text and parameters (the choice `scripts/staff.ts`
   already makes for the same reason).
4. The three auth actions catch and return `FormState`: `login`
   (`attemptSignIn`), `confirmTotp` and `verifyCode` (`infraState`). The
   try/catch never encloses `redirect()`, whose `NEXT_REDIRECT` throw would
   otherwise be classified as a failure. `logout` becomes best-effort: a
   database that cannot record the revocation must not strand a staff member
   in a session they asked to end, so the cookie is cleared and the redirect
   happens regardless.
5. `app/error.tsx` and `app/global-error.tsx` are branded catch-alls for
   everything else. They promise nothing about the cause and surface the
   `digest`, which matches the deployment's runtime log line.

**Consequences**

- A misconfigured environment is now self-describing to whoever is wiring it,
  and silent to everyone else — the same trade ADR-080 made for credentials.
- New infrastructure codes worth naming are one entry in `CODES_BY_CAUSE`
  plus a case; an unnamed code still degrades to the generic sentence.
- The boundaries are deliberately thin. The failures worth explaining are
  caught where the real error still exists, not in the boundary.

---

## ADR-092

**Title:** Analítica geográfica por estado, sin IP — un contador diario, no una
bitácora de eventos; y la atribución de campaña que faltaba

**Date:** 2026-09-22

**Status:** Accepted — N-55 · N-56 · N-57 landed; N-58 · N-59 · N-60 follow

**Context**

Nothing in the product recorded *where* anyone was. The owner wanted one view
answering three questions — where people log in, where they are when they buy,
and where marketing traffic comes from — in order to decide where to spend on
advertising.

Three existing facts constrained every option:

1. **The raw IP was captured on all five auth paths and deliberately thrown
   away.** `clientIp()` feeds a SHA-256 throttle key and nothing else;
   `0005_throttle_and_sessions.sql` states the table "holds no personal data"
   (ADR-079).
2. **The backoffice CSP names no third-party origin**, and `security.test.ts`
   asserts it. Map tiles, external fonts and MapLibre's `blob:` worker are all
   unavailable, and `style-src` has no `'unsafe-inline'`.
3. **Stripe collects no address, on purpose** — `billing/catalog.ts` uses a
   flat IVA Tax Rate specifically so checkout needs no address field.

A spike on a Preview deployment answered what no document did: the **Hobby**
plan *does* receive Vercel's geolocation headers, and
`x-vercel-ip-country-region` arrives as the **bare** ISO 3166-2 code (`CHH`),
not `MX-CHH`. So no IP database, no third-party lookup, no new dependency and
no EULA.

**Decision**

1. **State level only.** Never city, coordinates or postal code, though Vercel
   sends all of them. Mexico has ~2,500 municipios and most are small: a daily
   count of one visit from a small municipality is close to naming a person,
   while a state count is not. City-level geo-IP is also 65–80% accurate and
   biased by carrier NAT — Mexican mobile traffic resolves to gateway cities —
   so it would mislead the very decision it was meant to inform.
2. **A daily counter, not an event log.** `xangarro.geo_counters` is keyed
   `(day, source, country, region)` and holds an integer. A per-event row
   carrying no IP still carries a timestamp, and "BCS, 03:14" on a two-visitor
   day is nearly identifying. The counter is an aggregate *from birth*: there
   is never a moment at which a per-person row exists to leak, subpoena or
   mis-join. It is bounded at ~36k rows/year, and a bot increments an integer
   instead of growing the table. **Forfeited permanently:** hour-of-day, page
   path, funnel, per-visit dedup. The escape hatch, if ever needed, is an
   append-only table plus a nightly rollup *behind the same read function*.
3. **The feature never reads the IP.** `regionFromHeaders` reads exactly two
   headers and never `x-forwarded-for`. The unit test's fake `Headers` throws
   on any other name, so a later stray read fails the suite. This is the
   sentence the *aviso* rests on, which is why it is enforced rather than
   documented.
4. **Unknown is recorded honestly** — country `ZZ`, region `''` — and shown as
   «sin dato», never guessed into a neighbouring state.
5. **The console reads an aggregate and nothing else.** `admin_geo_rollup` is
   a STABLE definer function granted to `xangarro_admin`, which holds **no
   grant on the counter table** (verified against real Postgres: a direct
   SELECT is "permission denied"). `xangarro_admin` also cannot EXECUTE
   `geo_record` — the console reads this data, it never writes it.
6. **Purchase location comes from the checkout request, not from Stripe.**
   Stripe's only geographic fact would be the card issuer's country — never a
   Mexican state, often wrong for a Mexican user on a foreign card — and
   extracting a state would mean switching on required address collection:
   more friction at the moment of purchase, more personal data, less answer.
7. **The console is metric-first, and two rules live in code.** Raw counts per
   state always favour big cities, a population artefact rather than an
   insight, so the map is shaded by a chosen metric. A rate below a
   denominator floor (30 visits) renders «datos insuficientes» rather than a
   bright 100% conjured from one visit; and a rate is shaded **diverging
   around the national average**, with that average printed, because "above or
   below average" is the actionable reading. The conversion metric is labelled
   «visita → checkout iniciado (no pago)», because a metric named "conversión"
   that quietly means something else is how a dashboard causes a bad decision.
8. **UTM attribution gets its own table, and first touch wins.** `businesses`
   is a DOWN table — every column syncs to every phone — and a marketing label
   has no business travelling to a shopkeeper's device, so
   `xangarro.signup_attribution` lives in the platform schema instead.
   `business_id` is the primary key and the writer is `ON CONFLICT DO NOTHING`:
   last-touch would credit whichever link someone clicked on the way back in,
   which is how ad spend gets misattributed.
9. **That row also carries the state at signup**, which is the one place this
   design keeps a per-entity location rather than an aggregate. It is
   deliberate: it makes "which campaign, in which state, produced a customer"
   a single join, which the counter cannot answer; and a business is a
   commercial entity whose fiscal address (`businesses.codigo_postal`) we
   already hold at finer granularity. Still no IP, no city, no coordinates.
10. **Cohort questions use the fiscal address, not geo-IP.** "Which states
    retain best" is answered from `businesses.codigo_postal` via
    `xangarro.tenant_fiscal` — self-declared, stable, already covered by the
    existing basis, and better data than an inference (N-62).
11. **The map is pre-projected SVG, not a map library** (N-59). Natural Earth
    ADM1 is CC0 and already carries `iso_3166_2`; the geometry is converted
    offline with `mapshaper` via `npx` and committed as path strings, so the
    CSP invariant that `docs/audits/security-2026-09-17.md:229` records as a
    positive finding is untouched. Colour comes from `styleVariants` classes,
    never a `style` attribute, which `style-src` would drop.
12. **The landing beacon is a portal-served pixel** (N-58), not a function in
    the marketing project: that project's virtue is holding no secrets, and a
    pixel fires even when the React bundle never hydrates.

**Consequences**

- A misconfigured *state* is impossible to distinguish from an unknown one, by
  construction — that is the cost of refusing to guess, and it is the right
  cost.
- The marketing question the feature exists for is **not** "where are our
  users, advertise there". That measures where we already won, favours big
  cities by construction, and at current volume cannot separate signal from
  noise. The defensible loop is attribution → conversion rate by state → a
  matched-pair holdout test → then scale. Recorded in
  `docs/plan/09-next-features.md` so the order is not silently reversed.
- The legal basis must be published before the landing pixel ships (N-60):
  the aviso's section 10 TODO is closed by this work, and the marketing site —
  which today publishes no privacy page at all — needs one, because its
  visitors are not yet customers and this aviso does not reach them.

---

## ADR-093

**Title:** The hero illustration ships in v1 as the handoff's own PNG, optimised — reversing ADR-058 §7

**Date:** 2026-09-22

**Status:** Accepted — decided by the owner; reverses ADR-058 §7

**Context**

ADR-058 §7 deferred `hero-taqueria.png`: it was generated from a text
prompt, the handoff says to "replace with a licensed or commissioned asset
before shipping", and commissioning one would have added a second external
dependency to a chain already blocked on logo work. The login panel shipped
without it and gave the room to the four-scene animation.

The 2026-09-22 design audit recorded the absence as finding A-12, and the
owner asked for the illustration back now rather than at the post-launch
date ADR-058 named. The brand panel is the first screen a customer sees and
the one place the product shows who it is for; an empty yellow column with
a wordmark does not do that.

**Decision**

1. The illustration **ships in v1**, as block 2 of the auth brand panel —
   between the wordmark row and the animation — in a `2.5px` black frame,
   `radius 18`, `5px 5px 0`, at the asset's own 2.5:1 ratio, exactly as the
   design specifies.
2. The shipped file is **the handoff's generated PNG**, converted to WebP at
   1400 px (52 KB, down from 1.4 MB) and served through `next/image`. The
   repository keeps the source PNG only in `design-reference/`, which is the
   mirror, not the build.
3. **Commissioning a licensed replacement stays open** (`11-…` §1, owner
   action). It is a file swap at the same ratio: nothing in the layout,
   the frame or the tests depends on which artwork sits inside.
4. On viewports under 720 px tall the frame is hidden. The panel must fit a
   wordmark, this, the animation and the pinned headline inside `100vh`, and
   the headline carries the promise the illustration only illustrates.

**Consequences**

- ADR-058 §7 is superseded; §1–§6 and §8–§9 stand.
- The generated artwork is now customer-facing, so the licensing question is
  live rather than deferred: until the commissioned asset lands, the product
  ships an AI-generated illustration, which is a decision the owner has now
  taken knowingly.
- `e2e/auth.spec.ts` asserts the frame renders at 2.5:1 and that the served
  file is the optimised one, so a future swap cannot silently reintroduce the
  1.4 MB source.

---

## ADR-094

**Title:** Money crossing the `@xangarro/data-pg` boundary is parsed, never asserted

**Date:** 2026-09-22

**Status:** Accepted

**Context:**

`valuacionApertura` selected `coalesce(sum(cantidad * costo_unit_centavos), 0)`
and typed it `sql<bigint>`. Postgres answers `sum()` over `bigint` with a
`numeric`, and the driver hands a `numeric` back as **text**. The annotation
was a claim, not a conversion, so TypeScript believed it and every consumer
did too.

The damage was silent rather than loud. `bigint + string` is legal JavaScript
— it concatenates — so the Balance's `capitalInicial` became the digits of one
number glued to the digits of the next, and «Total capital» on Estados
financieros read **-$640,885,164,500.00** for a real tenant. The Posición tab
then crashed in `toPesosString`, which is the only reason anyone noticed: had
the string happened to parse, the statement would simply have been wrong.

`dashboard.ts` already had the rule written in a comment — "`sum()` returns
text from Postgres, so it is parsed back to `BigInt`, never to a float" — and
its own `toCentavos` helper. One query did not follow it.

**Decision:**

A `sql<T>` annotation in `packages/data-pg` describes **what the driver
returns**, not what the caller wants. Aggregates over money are therefore
typed `sql<string>` and converted explicitly at the boundary:

```ts
total: sql<string>`coalesce(sum(...), 0)`;
// …
return BigInt(String(row.total));
```

`sql<bigint>` over an aggregate is forbidden. An integer-typed column read
directly still comes back as the driver's own type and needs no annotation.

Counts and quantities may be typed `sql<number>` **only** with an explicit
`::int` cast in the SQL, as `balance.ts`'s `stockACosto` already does.

Every money-returning query owes an integration test that asserts `typeof` on
the way out, not just the value: a seeded zero compares equal whether it is
`0n` or `'0'`, so the value alone proves nothing.
`packages/data-pg/tests/estados-facts.integration.test.ts` is the pattern.

**Consequences:**

- The conversion is one call at one boundary; nothing downstream defends
  itself, and `@xangarro/domain` keeps receiving `bigint` centavos only.
- A `typeof` assertion is cheap and catches the whole class. The existing
  money queries were swept; `estados-facts.ts` was the only offender.
- This does not make the annotation safe — it makes it honest. A future
  aggregate typed `sql<bigint>` is a defect whether or not it is noticed, and
  the reviewer's question is "what does the driver actually return?".

---

## ADR-095

**Title:** A producto with negative stock is valued at zero on the Balance — and the seed may never produce one

**Date:** 2026-09-22

**Status:** Accepted

**Context**

The portal's Estados financieros → Posición showed **Inventarios: −$3,353.90**
for Taquería Don Pedro. A negative inventory valuation is not a thing a
balance sheet can say: NIF B-6 has no negative asset line, and a shelf cannot
hold less than nothing.

Two independent defects met on that one number.

1. **The fixture sold what it never bought.** `seed-finanzas-mes.ts` wrote a
   `salida` per ticket and no restocking `entrada`. Two months of generated
   ventas — 207 movements, 631 units — ran against six fixture compras and one
   day-one ajuste, 479 units in total. Four of six productos netted negative
   (Gringa −61, Agua de horchata −64, Refresco −50, Quesadilla −33), summing
   to exactly the −$3,353.90 on screen.
2. **The calculator had no floor.** `calculateBalanceGeneral` valued each
   product as `costoUnit × cantidad` and summed, so a product with unrecorded
   entradas *subtracted* from the value of the products that were counted.
   That is not the seed's problem: any real operator who captures ventas
   faster than compras reaches the same state, and the phone shares this
   calculator through `use-balance-general.ts`.

Two candidates were ruled out. `stockACosto` (`queries/balance.ts`) is
correct: it keys on `tipo`, so every entrada counts regardless of motivo —
including the seed's `'Ajuste de inventario'` day-one rows, verified against
the live database. And it does **not** carry the driver-text defect ADR-094
records: the `::int` cast on the sum and Drizzle's own bigint column mapper
hand the domain a real `number` and a real `bigint`. ADR-094 fixed the
offender; what was missing here is that the stock query's immunity was true
by luck rather than by assertion.

**Decision**

1. **The domain floors each producto's valuation at zero.**
   `valuacionDeProducto` in `balance-general.ts` contributes
   `costoUnit × cantidad` when `cantidad > 0` and `ZERO` otherwise. It is
   applied per producto, not to the line total: a shelf that is empty is
   empty, and it must not consume the value of a shelf that is full. This
   mirrors the clamp `estadoDeCuenta` already applies per cliente to
   cuentasPorCobrar — the Balance already refuses a negative receivable, and
   now refuses a negative asset for the same reason.
2. **Negative stock still surfaces, elsewhere.** Productos · Stock and the
   stock-low notification are where a data-quality gap belongs. The Balance is
   not, because the only way it can report one is as a lie.
3. **The seed restocks.** `seed-finanzas-stock.ts` tallies each week's
   consumption per producto and writes one `Compra a proveedor` entrada on
   that week's first operating day, sized to that consumption rounded up to a
   10-unit lot. Every week brings in at least what it takes out.
4. **Both halves are asserted independently.** The floor is a domain rule
   (`domain/tests/financials/balance-general.test.ts`); the fixture's own
   arithmetic is a seed contract (`seed-contract.integration.test.ts` asserts
   no seeded producto nets negative, `seed-finanzas-stock.test.ts` asserts the
   lot arithmetic without a database). A clamp that hides a broken fixture is
   not a guard, so the fixture is held to the stricter standard: it must be
   possible on its own, floor or no floor.
5. **The data layer keeps stating the fact.** `stockACosto` returns the real
   signed net, unclamped, and `period-balance.integration.test.ts` asserts it
   does — so the two layers cannot end up clamping the same thing twice. That
   suite also pins the boundary types (`cantidad` a `number`,
   `costoUnitCentavos` a `bigint`), which is ADR-094's rule applied to the one
   money query that already satisfied it by accident.

**Consequences**

- Inventarios can no longer be negative, on either client, for any data.
- Activo may now read slightly higher than the raw movement arithmetic
  implies. That is the intended trade: the identity Activo = Pasivo + Capital
  was already approximate here (utilidad comes from the P&L, inventory from a
  current-stock snapshot — the phone's documented risk #3), and an inflated
  asset with a visible stock warning beats an impossible one with none.
- `calculateIndicadores` receives `balance.activo.inventarios` as
  `inventarioPromedio`, so rotation KPIs stop dividing by a negative.
- The seeded demo now carries roughly $12,430 of stock at cost against ~$9,445
  of monthly ventas — about five weeks on hand, which is what a taquería that
  buys weekly actually looks like.

## ADR-097

**Title:** One sidebar entry per destination; the duplicated pairs merge

**Date:** 2026-09-22

**Status:** Accepted — owner decision; the design files are to follow

**Context**

The portal's design files draw thirteen sidebar entries, two pairs of which
point at the same screen with a different tab preselected: Ventas and Gastos
both open `/movimientos`, Operadores and Dispositivos both open `/equipo`. The
code copied that verbatim (ADR-058: the files are the specification).

Two rows for one destination cannot answer "where am I". The sidebar's active
state is a path match, so opening `/movimientos` lit **both** Ventas and
Gastos, and the screen's own tabs showed the real answer underneath. The owner
saw the double highlight and asked for one entry (2026-09-22).

**Decision**

1. Each pair becomes a single entry: **«Ventas y gastos»** → `/movimientos` and
   **«Tu equipo»** → `/equipo`. Eleven destinations, not thirteen. The tabs
   inside each screen keep doing the switching, and the old
   `?tab=` links still work — the screens read the parameter.
2. `dividerAfter` moves to Empleados, so the "Configuración" divider keeps its
   place now that Dispositivos is gone as a row.
3. The design files are **behind** the code on this point until they are
   amended in Claude Design (the §4b process). Recorded in
   `docs/plan/10-operador-design-changes.md`.
4. Unrelated defect fixed with it: `tabList` is `inline-flex`, which shrink-wraps
   in normal flow but **stretches** inside a flex column — every tab bar in the
   portal ran the page's width, leaving the last tab short of the right border
   with a white sliver inside it. `alignSelf: flex-start` and `width: fit-content`
   on the component fix it everywhere; Cortes' local wrapper is gone.

**Consequences**

- One question for the design: the merged entry reads «Ventas y gastos» while
  the screen's own `<h1>` says «Movimientos» (the design file is named "Ventas y
  gastos" but titles the page "Movimientos"). One of the two should move; the
  owner decides which.
- `dueno-cortes.spec.ts` scopes its sidebar assertion to the navigation, since
  the Cortes breadcrumb now carries the same words.

## ADR-096

**Title:** The console measures the business and can look over a tenant's shoulder — two amendments to ADR-063 row 3

**Date:** 2026-09-22

**Status:** Accepted 2026-09-22 (owner decision, same day) — amends ADR-063 ("not built: MRR dashboard, impersonation"); tasks N-63 … N-74, plan `docs/plan/17-consola-crecimiento.md`. The owner also accepted the plan's §4 thresholds as the starting defaults for N-70.

**Context**

ADR-063 scoped the console to what launch needed and explicitly left out an
MRR dashboard ("Stripe covers it") and impersonation. Five days of building it
and a research pass (plan §6) show what the launch scope cannot answer: whether
the business is working (no MRR joined to activation, plan, state or campaign —
Stripe has the revenue but none of the joins), what happened to one tenant (the
events sit in seven tables), when a threshold will be crossed (ADR-068 names
S2/S3 but nothing projects the date), and what a support case looks like from
the tenant's side. The owner's question of 2026-09-22 — how the console helps
grow the app, review operations and infra, and see when decisions are due — is
those four gaps.

**Decision**

1. **Revenue and activation metrics live in the console, read from
   webhook-derived tables** (`billing_events`, `activated_at`), never from
   Stripe's API. Stripe stays the source of truth (ADR-063 unchanged); the
   console is where its numbers meet the platform's own. This reverses the
   "Stripe covers it" line of row 3.
2. **Impersonation is built, under four conditions:** read-only, ≤ 30 minutes,
   a required reason, a banner the tenant sees and a record they can review
   afterwards. It is a signed short-lived token minted by the console, never a
   shared session. Every page view during it writes two identities to the
   audit log. This reverses the "impersonation not built" line of row 3.
3. **Staff gets roles before either write surface exists:** lector, operador,
   admin, enforced per server action. ADR-063's binary allowlist stays the
   authentication rule; roles are authorization on top.
4. **Decision thresholds are data, not prose.** ADR-068's S2/S3 numbers and
   the new ones (infra share of MRR, support load, conversion) become rows the
   admin edits and the console projects. ADR-068's monthly review is kept; the
   page is what the review reads.
5. **Nothing here reaches the phone.** ADR-069 (zero upsell in the app) and
   ADR-053 (flags only through the signed entitlement) are untouched; the NPS
   survey and referral links are portal and email only.

**Alternatives considered**

- *Keep reading MRR in Stripe.* Rejected: it cannot join to activation,
  campaign or state, which is the whole question.
- *A third-party analytics or CS tool (Custify, Userpilot, PostHog).* Rejected
  for now: the data is already in Postgres, the numbers needed are a dozen
  queries, and every vendor adds a processor to the aviso de privacidad.
  Revisit at N-73's trigger if the health score outgrows SQL.
- *Impersonation as a full write session ("do it for them").* Rejected: the
  migration path (N-18) already covers acting on a tenant's behalf with their
  approval; anything else is an unbounded write surface.

**Consequences**

- Four new console routes (`/negocio`, `/decisiones`, `/auditoria`, `/cobros`);
  everything else lands on existing screens.
- `staff_members` gains a role column; every existing server action must
  declare a minimum role (N-66) before N-68 or N-71 merge.
- The portal gains a read-only mode and a banner (N-68), and a
  Seguridad entry listing support sessions.
- The aviso de privacidad gains one line: staff may view an account for
  support, logged and visible to the tenant.

---

## ADR-098

**Title:** The alta wizard asks how you work, not what your papers say — superseding the design's four steps

**Date:** 2026-09-23

**Status:** Accepted

**Context:**

The design's onboarding wizard is four steps of data capture: Negocio,
Datos fiscales, Sincronización, Dispositivo, then Listo. We ship eight
skippable questions instead — «Platícanos de ti» — and have since N-12.

The audit of 2026-09-22 flagged the gap as the one divergence it could not
classify: it looks like a product decision rather than drift, but no ADR
said so, and an undocumented deviation is indistinguishable from an
oversight to the next person holding the design file beside the app.

**Decision:**

The eight questions stand. The design's four steps are superseded, not
pending.

**Why:**

Two of the design's steps ask for things an emprendedor may not have on the
day they sign up. An RFC and a régimen are exactly what someone starting out
has not sorted yet, and putting them behind a wizard makes the product's
first impression a form they cannot fill. Both now live in Negocio, editable
whenever the papers arrive, and the wizard asks only whether they are to
hand — one question, skippable, and the answer routes the follow-up.

The pairing step moved to where a device is actually paired: Tu equipo, with
the code, the quota and the phones it has already linked. A code shown once
during signup is a code that expires before the second phone exists.

The deeper reason is that the eight answers are not stored and forgotten.
`answersToConfiguration` turns them into the business's payment types, its
inventory and caja toggles and a plan recommendation — ¿cómo te pagan? sets
the tipos de pago the register shows; ¿llevas inventario? decides whether
stock tracking is on; ¿cuántas personas cobran? picks the plan. The design's
wizard collects facts about a business. This one configures it.

Every step is skippable and skipping clears the step's keys, which the domain
reads as «no opinion» rather than as «no». Nothing the wizard learns is
unavailable later, and nothing it skips is asked twice.

**Consequences:**

- «Xangarro Portal - Acceso y onboarding.dc.html» stops being the spec for
  this flow. It remains the spec for everything else on those screens — the
  auth card, the doors, the brand panel — and the audit's §4 entry closes.
- The wizard's shape is now a domain decision: adding a question means adding
  an answer key and teaching `answersToConfiguration` what it changes, not
  drawing a step. A question that configures nothing does not belong.
- Answers live in the portal-only `business_onboarding` table, off the DOWN
  wire, as N-12's own deviation records.
- Three answers still have no write path — tipoNegocio, WhatsApp and logo —
  and are captured against the day they do. That is a gap in the plumbing,
  not in this decision.

---

## ADR-100

**Title:** The root contract is rewritten against the code it governs, and its table of contents is generated

**Date:** 2026-09-23

**Status:** Accepted — amends CLAUDE.md §1, §2.2, §3, §4, §5, §6, §7, §11 and §12; applies the CLAUDE.md edits ADR-053 and ADR-054 already called for

**Context:**

`CLAUDE.md` was last touched on 2026-07-09. In the ~400 commits since, the
product was renamed (ADR-054), the phone became a capture client with the
portal owning everything else (ADR-053), and three Next.js apps and seven
packages were built. The contract absorbed none of it, and it is the file
every session is told to read first — so its errors propagate into work.

What it actually said, against the tree of 2026-09-23:

- The project was "Cachink!" and §6 told agents to import `@cachink/domain`,
  a scope that has not resolved since the rebrand.
- §3 and §4 listed seven packages and **no `apps/` directory at all**, so
  `apps/web`, `apps/backoffice` and `apps/landing` — which received nearly
  every recent commit — were invisible in the map of the repository.
- `packages/data-pg`, where all portal data access lives, was never mentioned.
- §7 sent UI testing to "Playwright E2E for desktop (Tauri)"; `apps/desktop`
  does not exist. §11's New Entity Checklist routed a new route file to
  `apps/desktop/src/app/routes/`, and its UI steps named Tamagui for a portal
  that styles with vanilla-extract (ADR-057). Following the checklist produced
  files in a deleted app.
- §5's commands were `npm run`; the repo is pnpm, and four enforcement
  commands (`lint:design`, `design:contract`, `test:scripts`, `plan:board`)
  had no entry.
- §2.2 still read "local-first is the default, not an option", which ADR-053
  superseded on 2026-09-11 — that ADR's Status line says it amends CLAUDE.md
  §1 and §2.2, and the amendment was never applied.

Separately, `ARCHITECTURE.md`'s own Index listed 48 rows against 98 ADRs.
Half the decision log was unreachable from its own table of contents.

`AGENTS.md` was a byte-for-byte copy of `CLAUDE.md` (the only diffs: the
filename, one `.Codex/agents/` path, and trailing whitespace) — the contract
that states "code lives in exactly one place" existing in two places, where
the next correction would land in one of them.

**Decision**

1. **`CLAUDE.md` is rewritten against the code.** Every rule is kept — the ten
   principles, the conventions, the prohibitions, the error-handling contract
   and the coverage requirements all survive, several of them sharpened by what
   the last quarter cost us. Only facts changed: the monorepo map, the layer
   boundaries, the commands and the paths. §2.2 is restated as ADR-053 §5
   decided it: offline never blocks capture, and the worst case is read-only
   plus export.

   This is the "add an ADR first" path that §2.10 requires. A contract that
   describes a repository which no longer exists is not protected by the rule
   against shrinking it; it is the reason the rule needs an escape hatch, and
   this is that hatch used once, deliberately, with the diff recorded here.

2. **The New Entity Checklist moves to `docs/new-entity-checklist.md`** and is
   split by surface, because Postgres and SQLite entities are genuinely
   different lists and the single list was true for neither. CLAUDE.md §10
   links to it. The contract holds rules; a procedure that changes with the
   schema does not belong in a file that may only grow.

3. **`AGENTS.md` becomes a symlink to `CLAUDE.md`.** One contract, one file.
   §9 names both `.claude/agents/` and `.Codex/agents/` so nothing is lost.

4. **The `ARCHITECTURE.md` index is generated** by `scripts/adr-index.ts`
   (`pnpm adr:index`), between `<!-- ADR-INDEX -->` markers, with
   `adr-index.test.ts` failing when the committed index no longer matches the
   ADRs in the file. Same contract as `plan-board.ts` and `design-contract`.
   A hand-kept table of contents for an append-only file will always drift;
   this one drifted by fifty rows before anyone noticed.

5. **Dated snapshots leave the repository root** for `docs/archive/`, and the
   loose debugging screenshots are untracked and ignored.

**Alternatives considered**

- *Patch CLAUDE.md in place.* Rejected: a third of the file was wrong, and the
  wrong third was structural — the map, the stack and the checklist. Patching
  would have left the shape of a two-app SQLite project with corrections
  stapled on.
- *Keep the checklist in the contract, corrected.* Rejected: it is ~50 lines of
  procedure keyed to the schema, in a file whose own rule is that it never
  shrinks. It would be stale again at the next entity.
- *Make `AGENTS.md` a short pointer instead of a symlink.* Rejected: Codex
  would then read three lines of prose instead of the contract.
- *Delete the ADR index rather than generate it.* Tempting —
  `grep '^## ADR-'` cannot go stale. Rejected because the index carries the
  title, date and status of each decision, which is most of why anyone opens
  the log at all.

**Consequences**

- A session that reads CLAUDE.md now gets a map that matches the tree, and the
  `data-pg` → `withTenant` → `'use server'` path that nearly all current work
  follows is written down for the first time.
- ADR-086 has no `Status:` line at all, so the generated index renders an em
  dash for it. The generator does not invent one; the log is append-only and
  the gap is left visible.
- The index now regenerates on every ADR. Adding one without running
  `pnpm adr:index` fails `pnpm test:scripts`.
- `AGENTS.md` is a symlink, which a Windows checkout without symlink support
  would materialise as a text file containing a path. No contributor is on
  Windows today; if one arrives, this becomes a generated copy with a check,
  like the index.

---

## ADR-101

**Title:** Activation answers one generic error, and the QR carries a 15-minute token in the fragment

**Date:** 2026-09-23

**Status:** Accepted — owner decisions of 2026-09-23; tasks C-14, P-06; closes audit SEC-DEV-01's remaining half

**Context**

`POST /activate` is the one unauthenticated door that hands out a device
token, the catalog and every operator's NIP hash. Two findings of the
2026-09-17 security audit were still open against it. `EMAIL_MISMATCH` told a
caller that a code existed but belonged to someone else, which turns the
8-character code space into something an attacker can enumerate without the
email. And C-14 as first written put a 48-hour QR token in a query string,
where server and CDN logs and Referer headers keep it, and where WhatsApp's
link preview would fetch it.

**Decision**

1. **One public answer.** A wrong email and an unknown code both return
   `400 CODE_INVALID`. The server's log line keeps the real reason, and the
   throttle still counts both as guesses. `CODE_EXPIRED` and `CODE_USED` keep
   their own answers: they are only reachable with the right email.
   `EMAIL_MISMATCH` stays in the error catalog so an older server still maps
   to the same message.
2. **A separate scan token.** «Mostrar QR» mints 128 random bits on the live
   code, stores only the SHA-256, and shows it once. It lives 15 minutes, never
   past its code, and dies when «Generar otro» expires the code. Redeeming it
   consumes the code's row: one pairing, either path.
3. **In the fragment.** The link is `https://app.xangarro.mx/activar#c=<token>`.
   Browsers never send the fragment, so no log or Referer holds it, and
   `/activar` is a static page that redeems nothing.

**Alternatives considered**

- *Keep `EMAIL_MISMATCH`* for a friendlier mistyped-email message. Rejected:
  the phone and the register already say «revisa el correo y el código», so
  the loss is small, and the oracle was rated high.
- *48-hour token, or the query string.* Rejected: a screenshot of the QR or a
  logged URL would stay a live credential for two days.

**Consequences**

- The phone (N-25) must read the token from the fragment through a verified
  app link, and confirm the business before redeeming (SEC-MOB-04), which
  needs a small preview endpoint that does not exist yet.
- A shopkeeper who leaves the QR open longer than 15 minutes taps «Generar
  otro QR»; the typed code keeps its 48 hours as the fallback.


## ADR-102

**Title:** The portal's coverage is unit + E2E merged, and a floor that only rises holds it

**Date:** 2026-09-23

**Status:** Accepted — owner decision of 2026-09-23 ("unit + E2E combined"); task P-35

**Context**

Measured on 2026-09-23, `apps/web` had 20% line coverage — and nobody had
known, because nothing measured it. The app had no `test:coverage` script, so
`turbo run test:coverage` skipped it and the base config's 80% threshold never
applied. That 20% was also the wrong question: Vitest instrumented only `.ts`
files, while CLAUDE.md §7 sends UI behaviour to Playwright, whose ~480 specs
exercised the server actions, loaders and screens and counted for nothing. The
shared code the portal stands on was already where the owner expects the
portal to be: `domain` 92%, `application` 96.5%, `auth-core` 100%.

**Decision**

1. **Measure what both suites execute.** Vitest writes raw V8 data through
   `vitest-monocart-coverage`. The E2E run adds the browser's (Playwright page
   coverage, Chromium) and the server's (`next start` under
   `NODE_V8_COVERAGE`, flushed over the inspector in the global teardown).
   `monocart-coverage-reports` merges the three — one tool, so one converter
   and one idea of what a file is. The build under test changes only by source
   maps (`XG_COVERAGE=1`).
2. **What counts.** Every `apps/web/src/**/*.{ts,tsx}` that exists on disk,
   untested files at 0%. Not `*.css.ts` (compiled to CSS, never executed), not
   the shared packages (they keep their own gates).
3. **Istanbul's metrics, not V8's.** V8 "lines" credit every line of a module
   that merely loaded and read ~35 points above the statements beside them.
   Istanbul's are what Vitest reports for `domain`, so the numbers compare.
4. **A floor that only rises.** `apps/web/coverage-floor.json` holds a floor
   per metric and the target (85). The `portal-e2e` job fails when a metric
   falls below its floor; a change that raises one commits `--raise`. The
   first floor is the first full measurement: lines 72, statements 68,
   functions 67, branches 54.
5. **Specs take `test` from `e2e/test.ts`,** which records page coverage when
   `XG_COVERAGE=1` and is Playwright's own `test` otherwise. A unit test
   guards the import (an ESLint `files` rule cannot: `pnpm lint` runs from
   `apps/web`, and flat-config globs resolve against the working directory).

**Alternatives considered**

- *Unit and integration tests only, to 85%.* Rejected: roughly 2,500 more
  lines of tests, much of it re-proving in Vitest what a Playwright spec
  already drives through the real page.
- *Gate only the "logic" directories.* Rejected: the exclusion list becomes
  the place coverage goes to hide.
- *Instrument the Next build with Istanbul.* Rejected: it needs a Babel pass
  beside SWC and vanilla-extract's webpack plugin, and changes the artifact
  under test far more than source maps do.

**Consequences**

- The number moves with the E2E suite: a flaky spec that stops early lowers
  it. The floor step runs only when the E2E step passed.
- Web Workers are not measured — page coverage does not reach them — so
  `operador/runtime/db.worker.ts` reads 0% whatever the specs do. Capturing
  worker targets over CDP is part of P-35.
- `pnpm test:coverage` in `apps/web` writes raw data only; the report is
  `pnpm coverage:check`, after `pnpm test:e2e:coverage`.

**Update 2026-09-24 (P-35).** Web Workers are measured now: `e2e/worker-coverage.ts`
opens a second CDP session per page, auto-attaches to its workers paused, and
starts precise coverage before their first line. `operador/runtime` went from 19%
to 95%, and the floor rose to lines 77, statements 72, functions 69, branches 56.

**Calibration 2026-09-24.** The floor sits one point under the measurement
(76 / 70 / 68 / 54 against 77.3 / 71.4 / 69.8 / 55.9), not on it. The first
floors were set to a single local run and were already under water a day later —
not because a test was lost, but because P-30 and N-07 landed code with no
spec, and a retried flaky spec covers a little less than a clean one. CI had
not enforced them yet. From here the ratchet holds as written: `--raise` only.
The floor step also runs after a failed E2E step, with `--report-only`, so the
coverage artifact always carries a number.

## ADR-103

**Title:** The seeded portal tenant is read-only while the viewport projects run; a spec that writes it carries `@serial`

**Date:** 2026-09-24

**Status:** Accepted — follows the `portal-e2e` triage of 2026-09-23 (commit 16367e0f)

**Context**

`apps/web/playwright.config.ts` runs `fullyParallel` across three viewport
projects against one Postgres, and almost every interesting portal spec reads
Taquería Don Pedro's seeded rows. Four consecutive full runs on a freshly
reset database failed in four *different* files, and every one of those tests
passed when run alone:

- `write.spec.ts` found no unread aviso, because something else had marked them
  read;
- the same file's `/negocio` editor never opened, because the session was on
  «Negocio B 1764…» — a rename `chaos-3-sesion-muerta.spec.ts` performed and
  never undid;
- `hazlo-por-mi.spec.ts`, `saldos-iniciales.spec.ts`, `dueno-cortes.spec.ts`
  each lost a row to a sibling mid-assertion.

The convention in place was `test.skip(testInfo.project.name !== 'desktop')`.
It prevents the three *viewports* of one file from colliding and does nothing
about two files racing inside the same project — nor about the `operador`
project, which was running alongside all three. `chaos-2`'s docblock claimed
"each mutating test owns a distinct seeded product" and `operador-caja.spec.ts`
was quietly violating it two projects later.

**Decision**

1. **A test that writes the seeded tenant carries the `@serial` tag.** Project
   `grep`/`grepInvert` route it: the viewport projects exclude the tag, and a
   `serial` project (`workers: 1`) runs exactly those tests, once, at the
   desktop viewport. Read-only tests in the same file keep their three
   viewports — the unit is the test, not the file.
2. **The phases are ordered.** `setup` → the three viewports → `unlock` →
   `serial` → `operador` → `sync`. `operador` used to run beside the viewports
   while seeding and spending the same tenant's stock, turnos and caja; it is
   now behind them for the reason `sync` already was.
3. **Postgres enforces it, not a docblock.** The global setup installs an
   `AFTER INSERT OR UPDATE OR DELETE` trigger on every table carrying a
   `business_id` and locks the seeded tenant; any write to it raises, naming
   the table and the tag. The `unlock` project releases the lock between the
   phases, and the global teardown drops the triggers even after a failed run.
   Tables that move under a plain read — sessions, metering counters, the sync
   plumbing — are excluded by name in `e2e/shared-tenant.ts`. Other tenants are
   untouched, so the throwaway-tenant specs keep writing in parallel.
4. **Whoever wrecks a seeded row restores it**, in a hook that also runs on
   failure, and the restore is scoped to the `serial` project so the same hook
   cannot fire from a viewport run. Fixtures a test consumes are re-made by that
   test (`write.spec.ts` un-reads the avisos it marks), so a second run against
   the same database asserts the same thing as the first.

**Alternatives considered**

- *A throwaway tenant per mutating spec*, as `saldos-iniciales.spec.ts` and
  `informe-mensual.spec.ts` do. Kept for new specs where it fits, rejected as
  the general answer: the seeded figures **are** the assertion in specs like
  `dueno-cortes` (−$60.00, Ana's corte, Luis's), and seeding a full tenant per
  file costs more than it saves.
- *Renaming the files* (`*.serial.spec.ts`), the way `*.sync.spec.ts` selects
  the `sync` project. Rejected: several files are half read-only, and the
  filename would either split them or cost those tests their viewport coverage.
- *A lint rule instead of the trigger.* Rejected as the enforcement: a spec
  writes through the UI as often as through SQL, and no static rule sees a
  «Guardar» click. The trigger does.

**Consequences**

- The suite is strictly slower: ~29 tests that used to run inside the parallel
  phase now run one at a time behind it.
- `--project=serial` (or `operador`, or `sync`) alone does not drag the viewport
  phase in as a dependency: `unlock` waits for the viewports only when the run
  actually selects one. Selecting a viewport keeps the wait.
- A new spec that writes the seeded tenant without the tag fails immediately
  with the guard's message instead of poisoning a sibling four files away.
  `shared-tenant.spec.ts` is the guard's own canary: it runs in each viewport
  project and requires a write to the seeded tenant to be refused, so a run
  whose lock never armed fails rather than passing quietly.
- Playwright skips a project whose dependency failed, so a failing viewport test
  now also holds back `serial`, `operador` and `sync` — the price of ordering
  them. That was already true of `sync`, and it is how the `sync` project came
  to spend weeks dark with six broken specs nobody saw.
- Serialising the writes exposed the suite's other source of non-determinism,
  which is not about data at all: `goto` resolves on `load` and React attaches
  after it, so a click in that gap is dropped and a `fill` is undone by the
  re-render. Every navigation now waits for `next-route-announcer` — the App
  Router's own client-side element, absent from the server's HTML — inside the
  shared `e2e/test.ts` of ADR-102, and `e2e/interact.ts` retries the interaction
  where the gate cannot reach (a later Suspense, a spec's own page).
- The lock lives in a test-only `e2e` schema on the throwaway database. It is
  never a migration, and `pnpm dev` against that database is unencumbered once
  the run ends.

**Update 2026-09-24, first green CI (run 36026962224).** With every project
reaching the end, CI measured lines 84.1%, statements 77.5%, functions 76.8%,
branches 62.5% — the earlier local figures never got past the viewport phase.
Floor 83 / 76 / 75 / 61. `src/app/inventario/` (the primitives galleries) is
left out by name, the one exclusion besides style modules; another needs an ADR.

**Amendment 2026-09-24 — the coverage build is not minified.** Decision 1 said
the build under test changes only by source maps; it now also skips the
minifier (`optimization.minimize`, `serverMinification`). Coverage derives
statements and branches from the executed code's syntax tree and maps them back
to `src/`; minified code has a different structure (`if/else` becomes a
ternary, statements become sequences), so those mapped back as phantom branches
spanning real ones and could never merge with the unit suite's. `csv.ts` read
52 statements and 46 branches against its 38 and 25 — every file both suites
touch was under-reported. Lines were unaffected (merged by byte range), which is
why lines read 85% while statements and branches lagged. Behaviour is the same
unminified; bundle size is the only difference, and nothing in the suite
measures it.

**Amendment 2026-09-24 — one copy per entry.** Next compiles a module once per
webpack layer, so a page's server chunk can hold two copies of one file — the
render layer's and the server action's — and only one runs. MCR folds copies
inside one script into one state and keeps the first it meets, which was often
the dead one: `server/import/templates.ts` read 0% while the import specs drove
it. `e2e/coverage-split.ts` hands such a script to MCR as one entry per copy,
the other copies marked unexecuted, so MCR's cross-script merge (covered if any
copy ran) applies. 29 portal files were duplicated this way. Also: the
source-path rule is now structural (strip wrapper segments, expect `src/`) —
the unminified build renamed the server's sources and the old list of
spellings silently dropped ~500 of them.

**Correction 2026-09-24 — a patch, not a splitter.** The per-copy split above
did not work: every entry still carried the whole chunk's source, so MCR
parsed both copies again and again kept the first. The fault is one rule in
MCR — a repeated original range is dropped, first copy wins — and
`patches/monocart-coverage-reports@2.13.0.patch` changes it to add the
repeat's counts. `e2e/coverage-split.ts` is gone; `addFromDir` is back.
Replaying a full run's server data: `templates.ts` from 0 functions to
`templateOf` ×10 and its `apply` loop covered. `tests/coverage-duplicate-copies.test.ts`
runs the case through MCR itself, so an upgrade that loses the patch fails
there first.
