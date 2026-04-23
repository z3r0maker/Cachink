# Cachink! 💰

> Finanzas para emprendedores.

A simple, mobile-first financial control and micro-POS app for Mexican emprendedores and small businesses. Captures sales, expenses, and inventory; produces NIF-compliant financial statements; works fully offline on a single device or syncs across a LAN or the cloud.

---

## Status

🚧 **Phase 0 — Foundation.** Not yet buildable; scaffolding in progress. See [`ROADMAP.md`](./ROADMAP.md) for the implementation plan.

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

> Phase 0 scaffold is not yet committed. Once it lands, the standard flow will be:

```bash
pnpm install
pnpm test       # run all unit tests
pnpm lint       # enforce layer boundaries and style
pnpm --filter mobile start    # launch Expo dev client
pnpm --filter desktop tauri dev   # launch Tauri desktop app
```

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

*Built with care for Mexican emprendedores.*
