# Maestro E2E Suite — `apps/mobile`

Phase 1C-M3 closes with four Maestro flows that exercise the full
first-launch → venta-efectivo → venta-crédito path on a running
simulator.

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev) ≥ 1.40 installed locally
  (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- An iOS simulator (Xcode-provided) OR an Android emulator running,
  with the Cachink dev client installed:
  ```sh
  pnpm --filter @cachink/mobile ios   # or `android`
  ```

## Running the suite

```sh
pnpm --filter @cachink/mobile test:e2e
```

This runs every flow under `maestro/flows/` against the first
connected simulator. The suite is **not** wired into CI yet
(CLAUDE.md §3: CI deferred until a second contributor joins); run it
locally before landing anything that touches the wizard, tabs,
Ventas, or Cuentas por Cobrar screens.

## Flow inventory

| Flow                           | Closes                 | What it proves                                            |
| ------------------------------ | ---------------------- | --------------------------------------------------------- |
| `smoke-launch.yaml`            | —                      | App boots, wizard renders, no crash path.                 |
| `wizard-local-standalone.yaml` | M1-T01, M2-T03-T05     | Wizard → BusinessForm → RolePicker → Tabs happy path.     |
| `venta-efectivo.yaml`          | M3-T01, M3-T02, M3-T05 | Cash venta create, Total del día updates.                 |
| `venta-credito.yaml`           | M3-T03, M3-T06         | Crédito → inline cliente → Director → Cuentas por Cobrar. |

## Re-running between flows

Some flows depend on state the previous one set up. The cleanest way
to rehearse is `maestro test maestro/flows/smoke-launch.yaml` (which
`clearState: true`) and then run the remaining flows in order.
