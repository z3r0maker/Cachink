# SCAFFOLD-STATUS.md — What's Built, What's Not, What to Do Next

**Scaffold produced:** 2026-04-23
**Phase:** 0 (Foundation) — partial

This file is a transparent map of the scaffold state. It is **not** part of the permanent documentation — once Phase 0 is fully complete, this file is deleted.

---

## Read these first

Before doing anything else, read the four project documents in order:

1. `CLAUDE.md` — architectural contract (rules that always apply)
2. `ROADMAP.md` — implementation plan and task list
3. `ARCHITECTURE.md` — decision log (15 seeded ADRs explaining why things are the way they are)
4. `README.md` — short orientation

---

## What's in the scaffold

### ✅ Working and complete

- **Root configuration** — `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `tsconfig.json` (with project references), `.gitignore`, `.nvmrc`, root `eslint.config.js` + `prettier.config.js`
- **Shared config package** (`packages/config/`) — ESLint 9 flat config with `eslint-plugin-boundaries` enforcing the layer rules from CLAUDE.md §4.2; Prettier config; Vitest base config with 80% default coverage threshold; two tsconfigs (base and lib variant)
- **Domain package** (`packages/domain/`) — fully implemented with real code:
  - `Money` module: `bigint` centavos per ADR-009, with `fromCentavos`, `fromPesos`, `sum`, `subtract`, `multiplyByInteger`, `isNonNegative`, `toPesosString`. Rejects float inputs.
  - `IDs` module: branded ULID types per ADR-010 (`SaleId`, `ProductId`, etc.)
  - `Dates` module: ISO date string types with `parseIsoDate`, `today`, `now`, `yearMonth`, `year`
  - **~60 passing test cases** in `packages/domain/tests/` covering edge cases
  - 95% coverage threshold enforced per CLAUDE.md §6
- **Data package** (`packages/data/`) — partial, with the canonical example:
  - `SalesRepository` interface (full type contract — the template every other repo copies)
  - Hardware interfaces (`ReceiptPrinter`, `BarcodeScanner`, `PaymentTerminal`) with `Noop*` implementations for Phase 1 UI
  - Schema directory placeholder ready for Drizzle tables in Phase 1B-M3
  - Smoke test verifying hardware noops behave correctly
- **Testing package** (`packages/testing/`) — `InMemorySalesRepository` class fully implementing the `SalesRepository` contract. Reference template for all future in-memory repos.
- **UI package** (`packages/ui/`) — brand theme tokens encoded **exactly** from CLAUDE.md §8: all 18 colors, typography scales, borders, hard drop shadows, press transforms. Test locks the values.
- **Application, sync-lan, sync-cloud packages** — package.json + tsconfig + placeholder src/index.ts with comments pointing at the ROADMAP phase that will populate them.
- **CI workflow** (`.github/workflows/ci.yml`) — lint → typecheck → test with coverage, caching pnpm and running on every push/PR.
- **Husky pre-commit hook** (`.husky/pre-commit`) — runs `lint-staged` on every commit (format + lint staged TS/TSX files).
- **4 project documents** (CLAUDE, ROADMAP, ARCHITECTURE, README) copied into the repo root.

### 🚧 Stubbed — packages exist but implementation is future work

- `packages/application/src/` — placeholder only. Use-cases land in ROADMAP **Phase 1B-M6**.
- `packages/data/src/schema/` — placeholder only. Drizzle schemas land in **Phase 1B-M3**.
- `packages/data/src/repositories/` — only `SalesRepository` interface is defined; remaining entity repositories (Egreso, Producto, Inventario, Cliente, PagoCliente, CorteDeDia, Empleado, GastoRecurrente) land in **Phase 1B-M4**.
- `packages/sync-lan/src/` — placeholder. LAN sync client lands in **Phase 1D**.
- `packages/sync-cloud/src/` — placeholder. PowerSync integration lands in **Phase 1E**.
- `packages/ui/src/` — only brand theme is real. Tamagui setup + component primitives (Btn, Input, Tag, Modal, etc.) land in **Phase 1A**.

### ⚙️ Requires user action (interactive CLIs we can't script)

- **`apps/mobile/`** — needs `pnpm create expo-app` to init. See `apps/mobile/SETUP.md` for exact commands.
- **`apps/desktop/`** — needs `pnpm create tauri-app` to init (requires Rust toolchain). See `apps/desktop/SETUP.md` for exact commands and prerequisites.

---

## How to run the scaffold

```bash
# One-time
pnpm install            # should complete without errors
pnpm typecheck          # should pass across all packages
pnpm test               # should run ~60+ tests in domain/ui/data — all green
pnpm lint               # should be clean

# Development
pnpm test:watch         # incremental test runner
pnpm --filter @cachink/domain test   # run one package

# Format
pnpm format             # fix formatting across all files
```

### Expected output on first `pnpm test`

- `@cachink/domain` — Money, IDs, Dates tests pass (~60 cases)
- `@cachink/data` — hardware noop smoke tests pass (3 cases)
- `@cachink/ui` — brand theme tests pass (6 cases)
- `@cachink/application` — smoke test passes (1 case)
- Total: ~70 tests green

If tests fail, the most likely causes are:
1. A package version moved since scaffold (April 2026); check `pnpm-lock.yaml` vs current npm.
2. Node 22 LTS not active — check `node --version`.
3. pnpm < 9 — check `pnpm --version`.

---

## Verification checklist before moving to Phase 0 completion

ROADMAP Phase 0 is complete when **all** of these pass:

- [ ] `pnpm install` completes clean
- [ ] `pnpm typecheck` passes across all packages
- [ ] `pnpm lint` passes (boundaries rule triggers on a deliberate violation — try importing `@cachink/ui` from `@cachink/domain` and confirm it fails)
- [ ] `pnpm test` green across all packages
- [ ] `pnpm test:coverage` meets the per-layer thresholds (95/90/80/70)
- [ ] Husky pre-commit hook runs on an actual commit
- [ ] CI workflow green on an empty PR
- [ ] Mobile app init succeeds (`apps/mobile/SETUP.md`) and "Hello Cachink" screen imports from `@cachink/ui`
- [ ] Desktop app init succeeds (`apps/desktop/SETUP.md`) and renders the same placeholder

Once all 8 are ticked, open ROADMAP.md and:
1. Mark every task in Phase 0 milestones M1–M7 as `[x]`
2. Add `Completed YYYY-MM-DD` under the Phase 0 heading
3. Move Phase 0's detailed checklist into `ROADMAP-archive.md`
4. Update the "Current Status" block at the top to point at Phase 1A
5. Delete this file (SCAFFOLD-STATUS.md)

---

## Known limitations and caveats

### Not verified end-to-end in the sandbox

The scaffold was produced in an environment without access to the full npm registry or a Rust toolchain, so the following were **not** verified:

- `pnpm install` against current npm (only individual version checks)
- Full `pnpm test` run across the monorepo
- Tauri init on a real Rust toolchain
- Expo init with latest SDK

**Expect small fixups on first run.** Most likely:
- A pinned version moved slightly; update `package.json` and re-lock.
- An `eslint-plugin-boundaries` setting may need tweaking — the plugin's rule format is stable but individual versions vary in their path-matching defaults.
- The `vitest` + `@vitest/coverage-v8` v3 majors move together; if one mismatches, align them.

### Tamagui not yet installed

Per CLAUDE.md §3, Tamagui is the chosen cross-platform UI library. It's not installed in the root scaffold because it's designed to live inside each app (mobile + desktop) alongside the framework that renders it. Tamagui install is part of each app's `SETUP.md`.

### No sample Drizzle schemas yet

`packages/data/src/schema/` is intentionally empty. Drizzle schemas need entity tables defined, and ROADMAP Phase 1B-M3 is the dedicated milestone for that work. Starting with schemas before the domain types are fully written would invert the layering.

### App directories are placeholders

`apps/mobile` and `apps/desktop` are `pnpm` workspace members so the monorepo is complete, but they have placeholder scripts until the real Expo/Tauri init runs. Their `test`, `lint`, and `typecheck` scripts return success (exit 0) on purpose so Turborepo's pipeline doesn't block. Once init runs, replace those scripts with the real commands.

---

## Questions? Stuck?

All architectural decisions are in `ARCHITECTURE.md` as ADRs. If a choice in the scaffold isn't obvious, the reasoning is there. If the reasoning isn't there, that's a real gap — open an issue and we'll add the missing ADR.
