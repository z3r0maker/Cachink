<p align="center">
  <img src="assets/brand/icon-padded.png" alt="Cachink!" width="120" height="120" />
</p>

<h1 align="center">Cachink! 💰</h1>

<p align="center">
  <em>Finanzas para emprendedores.</em>
</p>

<p align="center">
  A simple, mobile-first financial control and micro-POS app for Mexican emprendedores and small businesses.<br/>
  Captures sales, expenses, and inventory; produces NIF-compliant financial statements;<br/>
  works fully offline on a single device or syncs across a LAN or the cloud.
</p>

---

## Status

🟡 **Pre-release — core features built, UI polish in progress.**

> **MVP release targets iOS (iPhone + iPad) only.** Android + desktop
> (macOS/Windows) distributions are deferred post-MVP — the codebase
> remains fully cross-platform.

### ✅ Done

- **Point-of-sale (Ventas)** — product catalog, inline quick-sell, barcode scanner, payment methods (Efectivo, Transferencia, Tarjeta, QR/CoDi, Crédito), sale editing/cancellation
- **Expenses (Egresos)** — Gasto / Nómina / Inventario-purchase sub-tabs, recurring expense templates with auto-reminders
- **Inventory (Productos)** — stock tracking, movements log, low-stock alerts, merma (shrinkage), materia prima conversions, inventory audits
- **Clients + Accounts Receivable** — lightweight client directory, crédito tracking, payment registration, overdue alerts
- **NIF Financial Statements** — Estado de Resultados (B-3), Balance General (B-6), Flujo de Efectivo (B-2)
- **KPI Dashboard (Indicadores)** — margins, liquidity, rotation, financial health gauges
- **Director Home** — daily summary, recent activity, stock alerts, CxC, notification inbox
- **Cash register (Caja)** — open/close shifts, discrepancy tracking, auto-egreso on difference, daily cash reconciliation (Corte de Día)
- **User management** — Director + Operativo roles with PIN auth, quick-switch, employee management
- **Export** — Excel workbook + PDF summary of all data; monthly accountant report (Informe para el Contador)
- **Simple receipts (Comprobantes)** — shareable PNG/PDF per sale (not CFDI)
- **Director Notification Inbox** — 13 alert sources, per-source preferences, severity indicators, deduplication
- **Feature flags** — per-business toggles for stock, crédito, merma, auditoría, conversión
- **Setup wizard** — intent-first onboarding with Local / LAN / Cloud mode selection
- **Local standalone mode** — fully offline, no account required
- **LAN sync** — SQLite-to-SQLite sync over local Wi-Fi (desktop server + up to 3 tablets)
- **Cloud sync** — PowerSync + Supabase backend for multi-location
- **Observability** — local audit logging, error telemetry, and health checks (`@cachink/observability`)
- **Cross-platform UI** — shared Tamagui component library rendering on iOS, Android, macOS, and Windows

### 🟡 In Progress

- **Mobile UI/UX audit** — refining tap targets, keyboard flows, list virtualization, tablet landscape layouts, and visual density to match design mocks
- **Route-stack refactor** — converting modal-based flows to proper page navigation (5 screens remaining)
- **Split-pane layouts** — list/detail side-by-side on tablet landscape and desktop (6 screens remaining)

### 📋 Not Started (Phase 2 candidates)

- Operativo "Más…" tab (additional bottom-tab affordances)
- CoDi QR payment flow
- Clip / Mercado Pago Point integration
- WhatsApp as a first-class share target
- Payment reminders for Crédito ventas
- ESC/POS receipt printer support
- Cash drawer integration
- Multi-business support

### Numbers

| Metric                        | Count                                |
| ----------------------------- | ------------------------------------ |
| Unit + integration tests      | ~2,100 across 365 test files         |
| Maestro E2E flows             | 187 (174 flows + 13 shared subflows) |
| Architecture Decision Records | 50                                   |
| Monorepo packages             | 9                                    |

Store submission is a human-gated action — see [`docs/launch-checklist.md`](./docs/launch-checklist.md).
Current task tracking in [`ROADMAP.md`](./ROADMAP.md); phase history in [`ROADMAP-archive.md`](./ROADMAP-archive.md).

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
pnpm test                              # full monorepo tests (~2,100 tests)
pnpm lint                              # enforce layer boundaries + style
pnpm typecheck                         # strict TS across all packages
pnpm --filter @cachink/mobile ios      # dev build (needs Metro running)
pnpm --filter @cachink/mobile ios:clean    # nuke Pods + full clean rebuild
pnpm --filter @cachink/mobile ios:preview  # preview build (tap icon, no Metro)
pnpm --filter @cachink/desktop tauri dev   # launch Tauri desktop app
```

### iOS Build — encoding note

The workspace path contains `!` which requires UTF-8 encoding for CocoaPods.
If you see `Encoding::CompatibilityError` or `ASCII-8BIT` errors, ensure your
shell has these exports (added to `~/.zshrc` during setup):

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

Clean rebuild after encoding or Pods issues:

```bash
pnpm --filter @cachink/mobile ios:clean
```

**Xcode 26+ note:** Build for an iOS 26.4 simulator (not 18.x). The
`SwiftUICore` framework split in Xcode 26 causes linker errors when
targeting older simulator runtimes.

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
- **@cachink/observability** for local audit logging + error telemetry
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
│   ├── observability/    Audit logging, error telemetry, health checks
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
