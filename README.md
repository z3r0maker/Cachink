# Cachink! 💰

> Finanzas para emprendedores.

A simple, mobile-first financial control and micro-POS app for Mexican emprendedores and small businesses. Captures sales, expenses, and inventory; produces NIF-compliant financial statements; works fully offline on a single device or syncs across a LAN or the cloud.

---

## Status

⚠️ **Phase 1 — Incomplete (post-audit reframe, 2026-04-24).** Phase 1's
six sub-phases (0, 1A, 1B, 1C, 1D, 1E, 1F) all shipped their backend +
screen work, but a Round 2 wiring audit found that several
shipped-but-inert features broke at the route-adapter / shell-bridge
boundary. Phase 1 is now closed via Slice 9 — Phases A, B1, 9.5, 9.6
landed 2026-04-24 — and a Round 3 verification pass added the F1/F2
correctness fixes plus matching boundary tests. Local + LAN + Cloud
modes have working end-to-end UI for every shipped feature.
v0.1.0 public-beta tag-ready once Round 3's F4 coverage tests land.
~1,085+ unit tests, 5 ADRs (029 LAN protocol, 030 change-log triggers,
035 hybrid cloud backend, 036 launch artifacts, 037 mobile
@supabase/supabase-js direct dep). Store submission is a human-gated
action — see [`docs/launch-checklist.md`](./docs/launch-checklist.md).
Current phase + remaining work tracked in
[`ROADMAP.md`](./ROADMAP.md); detailed phase history lives in
[`ROADMAP-archive.md`](./ROADMAP-archive.md).

---

## Project Documents

Before touching any code, read these in order:

1. **[CLAUDE.md](./CLAUDE.md)** — the architectural contract. Rules, principles, tech stack, layer boundaries, brand tokens. **Required reading** for every contributor and AI agent.
2. **[ROADMAP.md](./ROADMAP.md)** — the implementation plan. Phases, milestones, tasks with checkboxes. Check here to see what's next.
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — the decision log. Every significant architectural decision as an ADR. Consult this when making a decision that would be painful to reverse.

Each file has a specific role and lifecycle (see CLAUDE.md §0).

---

## Quick Reference

**What is this?**
A bilingual-Spanish-first tablet app for tracking a small Mexican business's finances. Simple sales capture, expense tracking, inventory with barcode scanning, NIF-compliant financial statements, all working offline-first.

**Who is it for?**
Emprendedores and small-business owners in Mexico. Not an ERP. Not facturación. Not a CRM.

**What platforms?**

- **Mobile (tablets):** iOS and Android via Expo + React Native
- **Desktop:** Windows and macOS via Tauri 2

**What deployment modes?**

1. **Local standalone** — one device, no network, no account (default).
2. **Tablet-only** — one tablet holds everything.
3. **LAN distributed** — one PC + up to 3 tablets on the same Wi-Fi, syncing via a first-party SQLite-to-SQLite protocol bundled in the desktop app.
4. **Cloud** — PowerSync + Supabase (or another Postgres backend) for multi-location.

**Language:** Spanish (es-MX) only at launch.

---

## Getting Started (Contributors)

```bash
pnpm install
pnpm test                              # full monorepo tests (>500 passing)
pnpm lint                              # enforce layer boundaries + style
pnpm typecheck                         # strict TS across all packages
pnpm --filter @cachink/mobile start    # launch Expo dev client
pnpm --filter @cachink/desktop tauri dev   # launch Tauri desktop app
```

## Release workflow

```bash
./scripts/build-all.sh --dry-run   # validate configs + tests
./scripts/build-all.sh             # signed iOS / Android / macOS / Windows builds
                                    # + dist/CHECKSUMS.txt + dist/sbom.json
pnpm store:screenshots              # regenerate 24 store screenshots
```

## Quickstart (Spanish, for end users)

1. Descarga la app desde [cachink.mx](https://cachink.mx).
2. Abre y elige **📱 Solo este dispositivo** — no necesitas cuenta.
3. Captura una primera venta y un primer egreso desde el tab inferior.
4. El **Director** puede ver los estados financieros en **Estados**.

Si tienes un equipo, más tarde activas el **servidor local** o la
sincronización **en la nube** desde Ajustes.

Requirements:

- Node.js ≥ 22 LTS
- pnpm ≥ 9
- Xcode (for iOS Simulator on Mac)
- Android Studio (for Android emulator)
- Rust toolchain (for Tauri desktop builds)

---

## Tech Stack (Summary)

- **TypeScript** throughout, strict mode
- **Expo SDK 55+** (mobile), **Tauri 2.10+** (desktop)
- **Tamagui** for shared cross-platform components
- **SQLite** on every device, via **Drizzle ORM**
- **PowerSync** (Cloud mode), first-party LAN sync (LAN mode)
- **Zustand** + **TanStack Query** for state
- **Vitest** + **React Native Testing Library** + **Maestro** + **Playwright** for testing
- **Turborepo** + **pnpm workspaces** monorepo

See CLAUDE.md §3 for pinned version floors and full list.

---

## Key Principles

1. **UX simplicity is a feature.** The less clicks, the most value.
2. **Local-first is the default.** Cloud/LAN sync are additive, never required.
3. **Code lives in exactly one place.** Components are shared between mobile and desktop via `packages/ui`.
4. **TDD is mandatory** for domain and use-case layers.
5. **Money is always centavos (bigint), never floats.**
6. **Spanish es-MX only** at launch (internationalization-ready from day one).

Full principles in CLAUDE.md §2.

---

## Repository Layout

```
cachink/
├── apps/
│   ├── mobile/           Expo app (iOS / Android tablets)
│   └── desktop/          Tauri app (Windows / macOS)
├── packages/
│   ├── domain/           Pure business logic
│   ├── application/      Use-cases
│   ├── data/             Repositories + Drizzle + SQLite
│   ├── ui/               Shared Tamagui components
│   ├── sync-lan/         First-party LAN sync (LAN mode only)
│   ├── sync-cloud/       PowerSync integration (Cloud mode only)
│   ├── config/           Shared ESLint, TS, Prettier configs
│   └── testing/          Shared test utilities, in-memory repos
├── CLAUDE.md
├── ROADMAP.md
├── ARCHITECTURE.md
└── README.md
```

See CLAUDE.md §4.1 for full details and layer boundary rules.

---

## License

TBD.

---

_Built with care for Mexican emprendedores._
