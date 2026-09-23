<p align="center">
  <img src="assets/brand/icon-padded.png" alt="Xangarro!" width="120" height="120" />
</p>

<h1 align="center">Xangarro! 💰</h1>

<p align="center">
  <em>Finanzas para emprendedores.</em>
</p>

<p align="center">
  Financial control and micro-POS for Mexican emprendedores and small businesses.<br/>
  A phone captures the day on the shop floor; a web portal owns the books.
</p>

---

## What this is

Two surfaces over one shared domain (ADR-053):

- **The app** is the **capture** surface — ventas, egresos, caja y turnos, stock and
  barcode scanning. Single-role, offline-tolerant, built for a busy counter.
- **The portal** owns everything else — identity and roles, business configuration,
  catalogue, dashboards, NIF financial statements, comprobantes and billing.

The NIF (B-2 / B-3 / B-6) and KPI calculations live in `packages/domain` and both
surfaces import them. That shared domain is what keeps the two halves honest.

**Not an ERP. Not facturación. Not a CRM.** Spanish (es-MX) only at launch.

**Status:** 🟡 pre-release. The portal is in design-conformance and launch hardening;
the app is in UI/UX polish. Open work is on `docs/plan/PENDIENTES.md`
(`pnpm plan:board`); the launch gate is `docs/launch-checklist.md`.

|                                        |                                |
| -------------------------------------- | ------------------------------ |
| Apps / packages                        | 4 / 14                         |
| Test files                             | ~665                           |
| Playwright specs (portal + backoffice) | 72                             |
| Maestro flows                          | 132 (116 + 16 shared subflows) |
| ADRs                                   | 98                             |

---

## Project documents

Read these before touching code:

1. **[CLAUDE.md](./CLAUDE.md)** — the architectural contract: rules, layer boundaries,
   monorepo map, conventions. Required reading for every contributor and agent.
   (`AGENTS.md` is a symlink to it — one contract, one file.)
2. **[docs/plan/](./docs/plan/)** — the live plan, per track. `PENDIENTES.md` is the
   generated board of everything still open. `ROADMAP.md` covers the phone.
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the decision log, append-only. Consult it
   before any decision that would be painful to reverse.
4. **[DESIGN_CONTRACT.md](./DESIGN_CONTRACT.md)** — the portal's visual specification.
   Generated from `@xangarro/tokens`; never edited by hand.

---

## Repository layout

```
xangarro/
├── apps/
│   ├── web/              The portal (Next.js App Router) — app.xangarro.mx
│   ├── backoffice/       Internal staff console — admin.xangarro.mx
│   ├── landing/          Marketing site (Vite, prerendered) — xangarro.mx
│   └── mobile/           The capture app (Expo / React Native)
├── packages/
│   ├── domain/           Pure business logic — NIF, KPIs, money, entities
│   ├── application/      Use cases
│   ├── data-pg/          Postgres — cloud schema, RLS, queries, migrations
│   ├── data/             SQLite — repositories for the device
│   ├── contracts/        Wire contracts shared by phone and cloud (zod)
│   ├── auth-core/        Passwords, sessions, throttles, TOTP
│   ├── tokens/           Design tokens — the source of truth for the portal's pixels
│   ├── ui/               Shared Tamagui components (mobile)
│   ├── email/            Transactional email templates + senders
│   ├── observability/    Audit logging, error telemetry, health checks
│   ├── sync/             Capture sync: outbox push, reference-data pull
│   ├── sync-lan/         Parked (ADR-053 §6)
│   ├── testing/          Fixtures, in-memory repositories
│   └── config/           Shared ESLint / TS / Prettier / Vitest configs
└── scripts/              Repo tooling: design-lint, plan board, ADR index, releases
```

`archive/` holds retired code, kept out of the workspace on purpose.

---

## Getting started

```bash
pnpm install
pnpm test          # unit + integration across the monorepo
pnpm lint          # layer boundaries, file/function budgets, style
pnpm typecheck     # strict TS everywhere
```

### Running a surface

```bash
pnpm --filter @xangarro/web dev          # portal        → localhost:3100
pnpm --filter @xangarro/backoffice dev   # staff console → localhost:3200
pnpm --filter @xangarro/landing dev      # marketing site
pnpm --filter @xangarro/mobile ios       # dev build (needs Metro running)
```

The portal and backoffice need Postgres. It runs in Docker:

```bash
pnpm --filter @xangarro/data-pg db:reset   # apply migrations + seed
```

### Tests that need a database

```bash
pnpm --filter @xangarro/data-pg test:db    # integration tests; fails rather than skips
pnpm --filter @xangarro/web test:e2e:db    # Playwright against a freshly seeded DB
```

Both refuse to run without a `DATABASE_URL` rather than passing vacuously — a suite
that cannot tell you whether it ran against anything is worse than no suite.

### iOS build notes

The workspace path contains `!`, which CocoaPods needs UTF-8 to handle. If you hit
`Encoding::CompatibilityError` or `ASCII-8BIT`, export these (setup adds them to
`~/.zshrc`):

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

Then `pnpm --filter @xangarro/mobile ios:clean` for a full rebuild. Build against an
iOS 26.4 simulator — the Xcode 26 `SwiftUICore` split breaks older runtimes.

---

## Release

```bash
./scripts/build-all.sh --dry-run   # validate configs + tests
./scripts/build-all.sh             # signed builds + dist/CHECKSUMS.txt + dist/sbom.json
pnpm store:screenshots             # regenerate store screenshots
```

Store submission is human-gated — see [`docs/launch-checklist.md`](./docs/launch-checklist.md).

Requirements: Node ≥ 22 LTS, pnpm ≥ 9, Docker (for Postgres), Xcode (iOS), Android
Studio (Android).

---

## Tech stack

- **TypeScript** throughout, strict, `noUncheckedIndexedAccess`
- **Next.js App Router** + Radix primitives + **vanilla-extract** over `@xangarro/tokens`
  for the portal and console (ADR-057) — no Tailwind, no styled component library
- **Expo / React Native** + **Tamagui** for the app
- **Postgres** (Drizzle, RLS-enforced multi-tenancy) in the cloud; **SQLite** (Drizzle)
  on the device
- **Vitest** + **Playwright** (web) + **Maestro** (phone) for testing
- **Turborepo** + **pnpm workspaces**

---

## Key principles

1. **UX simplicity is a feature.** The less clicks, the most value.
2. **Offline never blocks capture, and data is never held hostage.** Worst case is
   read-only plus export — never deleted, never locked.
3. **Code lives in exactly one place.** Duplication is a bug.
4. **TDD is mandatory** for domain and application layers.
5. **Money is integer centavos, parsed and never asserted** across a driver boundary.
6. **The design is the specification.** If the code and the design disagree, the code
   is wrong.

Full contract in [CLAUDE.md](./CLAUDE.md).

---

## License

TBD.

---

_Built with care for Mexican emprendedores._
