# Maestro E2E Suite — `apps/mobile`

This directory holds the Maestro flow library that exercises the mobile
app end-to-end on a running simulator (or physical device). Flows ship
alongside the feature work that needs them and re-run as a smoke pass
before any change that touches the wizard, tabs, or onboarding flows.

**Suite size:** 48 flows + 17 shared subflows and scripts; `full-regression.sh` runs the curated 25 (see «Regression Script Phases»). Every flow runs against `pnpm mock:api`, never a real backend.

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev) ≥ 1.40 installed locally
  (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- An iOS simulator (Xcode-provided) OR an Android emulator running,
  with the Xangarro dev client installed:
  ```sh
  pnpm --filter @xangarro/mobile ios   # or `android`
  ```

### What must be running

| Thing                                              | How                                                                                                          | Check                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| The contracts mock on `:3000`                      | `PORT=3000 pnpm mock:api`                                                                                    | `curl -X POST 127.0.0.1:3000/__mock/up` → `{"down":false}` |
| Metro for the dev client                           | `cd apps/mobile && EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE=http://127.0.0.1:3000 npx expo start --dev-client` | `curl localhost:8081/status` → `packager-status:running`   |
| One booted simulator with the dev client installed | `pnpm --filter @xangarro/mobile ios`                                                                         | `xcrun simctl list devices booted`                         |

The mock's control routes (`packages/contracts/src/mock/control-routes.ts`) put the
server in the state a flow needs: `/__mock/reset`, `/code`, `/qr`, `/forget`,
`/restore`, `/scenario` (`xangarro` · `xangarrito` · `over-limit` · `grace` ·
`lapsed` · `revoked` · `flaky`), `/snapshot-budget`, and `/down` · `/up` (the server
vanishes: every contract route drops the socket, which the phone reads as no
network). The `shared/mock-*.js` scripts call them from a flow.

## Running the suite

```sh
# Full phased regression (recommended):
./apps/mobile/maestro/scripts/full-regression.sh

# Dry-run (just print the flow list):
./apps/mobile/maestro/scripts/full-regression.sh --dry-run

# On a specific device class (26.5 runtime pinned — the dev client
# crashes at launch on iOS 27.0):
./apps/mobile/maestro/scripts/full-regression.sh --device-class iphone
./apps/mobile/maestro/scripts/full-regression.sh --device-class ipad

# A single flow (auto-detects and runs the correct setup):
./apps/mobile/maestro/scripts/run-flow.sh apps/mobile/maestro/flows/ventas-lista.yaml

# Multiple flows (state is cached between runs with the same entry point):
./apps/mobile/maestro/scripts/run-flow.sh apps/mobile/maestro/flows/ventas-lista.yaml \
    apps/mobile/maestro/flows/cierre-cuadra.yaml

# Dry-run (show detected entry points without executing):
./apps/mobile/maestro/scripts/run-flow.sh --dry-run apps/mobile/maestro/flows/*.yaml

# Skip setup (assume the simulator is already in the right state):
./apps/mobile/maestro/scripts/run-flow.sh --skip-setup apps/mobile/maestro/flows/ventas-lista.yaml

# Direct maestro test (no auto-setup — you manage state yourself):
maestro test apps/mobile/maestro/flows/ventas-lista.yaml

# Tag-filtered run:
maestro test --includeTags smoke apps/mobile/maestro/flows/
maestro test --excludeTags offline apps/mobile/maestro/flows/
```

### Entry points

Each flow declares `# x-entrypoint:` in its header; `run-flow.sh` and
`full-regression.sh` read it and put the app in that state first
(`scripts/lib/entry-setup.sh`), caching the current state in
`/tmp/maestro-entry-state` so consecutive same-entry flows skip the setup.
**Delete that file after restarting the mock**: the cache says «activated» while
the fresh mock no longer knows the device's token, so the app is back on Vincular.

| Entry point | Setup action                                                           | State after                                   |
| ----------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| `fresh`     | local database reset, mock reset                                       | Vincular (the activation screen)              |
| `activated` | the above + `shared/setup-activated.yaml` (activation, Toni, one sync) | Inicio, Toni signed in, reference data pulled |

Run `run-flow.sh --dry-run <flow>` to see which entry point a flow uses.

### Fresh-install flows

Flows that need a clean database **must not** use Maestro's `clearState: true`.
On iOS 18+ with Expo SDK 55 dev-clients, `clearState` wipes the stored Metro
bundler URL and the app fails to reconnect ("No script URL provided").
`fresh-install.sh --reset-only` wipes the database and keychain while keeping
Metro connectivity; the entry setup calls it.

---

## Auth model

The device has no accounts (ADR-053): a fresh install shows **Vincular**, the
owner's code links it to the business, and every launch after that shows
**Acceso** — the operators the portal created, each with a four-digit NIP. The
mock's business is Tacos La Esquina with operators Toni (NIP 1234) and Ana.

### Shared subflows and scripts

| File                               | Purpose                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `shared/dismiss-modals.yaml`       | Dismisses the dev-client sheets on cold boot                              |
| `shared/prime-dev-client.yaml`     | Points the dev client at Metro and waits for the bundle                   |
| `shared/setup-activated.yaml`      | The `activated` entry: mock reset, activation, Toni, one sync cycle       |
| `shared/login-operator.yaml`       | Picks Toni on Acceso and types 1234; no-op when already signed in         |
| `shared/ensure-caja-open.yaml`     | Opens a turno with the $500 fondo when none is open                       |
| `shared/lock-caja.yaml`            | «Bloquear la caja» from Mi turno                                          |
| `shared/create-venta.yaml`         | One cash sale of the first catalogue tile                                 |
| `shared/cobrar-ticket.yaml`        | Charges the ticket on Cobrar with `${METODO}` (phone and tablet branches) |
| `shared/find-producto-stock.yaml`  | Finds a product in Inventario by search                                   |
| `shared/open-turno-row.yaml`       | Opens one of Mi turno's rows (`otros-<key>`)                              |
| `shared/navigate-to-settings.yaml` | Deep-links to Ajustes                                                     |
| `shared/mock-reset.js`             | `POST /__mock/reset`                                                      |
| `shared/mock-row.js`               | `POST /__mock/forget` or `/restore` for one row                           |
| `shared/mock-scenario.js`          | `POST /__mock/scenario` with an optional records-per-month override       |
| `shared/mock-down.js`              | `POST /__mock/down` or `/up`                                              |
| `shared/mock-snapshot-budget.js`   | `POST /__mock/snapshot-budget`                                            |

### Test credentials (the contracts mock)

| Field            | Value                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Owner email      | `dueno@tacoslaesquina.mx`                                                                      |
| Activation codes | `VALDK7M3` valid (single-use) · `USEDK7M3` redeemed · `EXPRK7M3` expired · `NSLTK7M3` no slots |
| Operator         | Toni, NIP `1234` (`acceso-operador-01JPRS00000000000000000001`)                                |

### Flow authoring pattern

Every flow MUST follow this pattern:

```yaml
appId: mx.xangarro.mobile
---
- launchApp
- runFlow: shared/dismiss-modals.yaml
- runFlow: shared/login-operator.yaml
# ... flow-specific steps
```

`login-operator.yaml` is a no-op when someone is already signed in (a warm
launch in the same session), so a flow never assumes the gate's state. A flow
that changes the mock (a scenario, a forgotten row, `down`) restores it before
it ends, and says so in its header when it leaves the device in another state.

---

## Testing the Barcode Scanner

The Scanner component uses `expo-camera`'s `onBarcodeScanned`. There are
three ways to exercise it depending on your environment:

| Environment          | How to test                                                                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iOS Simulator**    | No camera available — use the **manual entry path**. The `inventario-barcode.yaml` Maestro flow covers this: taps "Escanear código", types a barcode in the manual input, and asserts the SKU populates.                                                                                                            |
| **Android Emulator** | Use the **VirtualScene camera**: AVD settings → Camera → Back = VirtualScene. Place a barcode PNG on the virtual poster wall (edit `~/.android/avd/<name>.avd/Toren1BD.posters` or drag an image into the scene), then "walk" to it with WASD keys. This exercises the real `onBarcodeScanned` pipeline end-to-end. |
| **Real device**      | Run the Expo dev build and point the camera at any EAN-13 barcode on a product. A haptic confirms the read and the SKU auto-fills on the form.                                                                                                                                                                      |

---

## Performance

### E2E mode (`EXPO_PUBLIC_E2E=1`)

The gate screens (Wizard, BusinessForm, RolePicker, Login) render a
`FloatingCoinsBackground` with 36 continuously animated particles.
Maestro's iOS driver waits for animations to settle after each tap
(2x 3-second timeout). With particles running, this adds **~14 seconds
per tap**.

Setting `EXPO_PUBLIC_E2E=1` disables these particles. The regression
scripts (`full-regression.sh`, `run-flow.sh`) export this automatically.

When running Metro manually for Maestro testing, start it with:

```sh
EXPO_PUBLIC_E2E=1 npx expo start
```

### Tap timing (with E2E mode)

| Action                 | Duration            |
| ---------------------- | ------------------- |
| First tap after launch | ~5-8s (cold render) |
| Subsequent taps        | ~1-2s               |
| `assertVisible`        | ~0.2s               |
| `launchApp`            | ~2s                 |

### CLI vs MCP

| Task                         | Use                                              | Why                                            |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| Run a known flow             | `run-flow.sh` or `maestro test` via Bash         | Fast, no LLM round-trip overhead               |
| Explore the UI interactively | `maestro mcp` tools (tap, screenshot, hierarchy) | MCP gives Claude direct control                |
| Debug a failing step         | MCP `inspect_view_hierarchy` + `take_screenshot` | Inspect state without re-running the full flow |

---

## Regression Script Phases

The demo/wizard phase ladder retired with its flows (A-16). `full-regression.sh`
now runs the M-11 curated suite — 25 per-screen flows — in dependency
order, each on a FRESH entry state (the conditions every flow's contract was
verified under: exact stock counts, exact cierre math, sin-turno screens; a
turno that accumulated other flows' ventas cannot «cuadrar»). The suite:

| Order | Flows                                                                             |
| ----- | --------------------------------------------------------------------------------- |
| 1–3   | smoke-launch, login-lockout, bloqueo                                              |
| 4–7   | caja-abrir-cerrar, ventas-lista, venta-detalle-cancelar, fiado-abono-recordar     |
| 8–9   | gastos-registrar, gastos-pagar-recurrente                                         |
| 10–14 | mi-turno, por-enviar, cancelaciones-nav, avisos-responder, inventario-llego-merma |
| 15–17 | cierre-cuadra, caja-cierre-discrepancia, cierre-faltante                          |
| 18–19 | sin-internet-cobrar, sin-internet-cierre (the mock down and up)                   |
| 20–22 | plan-pago-pendiente, plan-vencido, dispositivo-revocado (mock scenarios)          |
| 23    | settings-desvincular (leaves the device unlinked)                                 |
| 24–25 | activation, login-operator-pin (fresh entry)                                      |

Use `--dry-run` to print the list, `--device-class se|iphone|ipad` to pick
the simulator (lib/device-resolve.sh pins the 26.5 twins).

---

## Flow Inventory (grouped by feature area)

Generated from each flow's header on 2026-11-03; «Suite» marks the twenty-five `full-regression.sh` runs. The catalogue in `docs/testing/e2e-test-catalog.md` names the scenario each flow proves.

### Vincular y acceso

| Flow                       | Entry     | Suite | What it proves                                                                                                           |
| -------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `activation.yaml`          | fresh     | ✓     | Vincular — happy path (A-04; MvVincular, M-06): a fresh install opens on the camera; the typed path («Escribe el código» |
| `activation-errors.yaml`   | fresh     |       | Activation — error path (A-04).                                                                                          |
| `activation-descarga.yaml` | fresh     |       | Activation of a big business (DS-10, EsMvDescarga): the snapshot comes in pages, the activation screen says «Descargando |
| `login-operator-pin.yaml`  | fresh     | ✓     | Operator NIP sign-in (A-16; Acceso, MvAcceso M-06): on a freshly linked device «¿Quién va a cobrar?» asks for the operat |
| `login-lockout.yaml`       | activated | ✓     | Operator sign-in guard (A-05): no PIN recovery on the device, and five wrong PINs lock PIN entry for 30 s.               |
| `bloqueo.yaml`             | activated | ✓     | Bloqueo (MvBloqueo, M-06): «Bloquear la caja» on Mi turno locks the caja without closing the turno — the lock screen nam |
| `inicio-entrar.yaml`       | activated |       | Entrar y empezar (Track M, M-06): the caja lands on Inicio, «Abrir turno» opens the fondo sheet, the card turns to «La c |
| `auto-lock-smoke.yaml`     | activated |       | Auto-lock smoke test — verifies Bloqueo (MvBloqueo) appears after timeout.                                               |
| `smoke-launch.yaml`        | activated | ✓     | Smoke: the activated caja opens on Inicio and the phone's four tabs — Inicio, Cobrar, Ventas, Mi turno — sit on the bar  |
| `ipad-smoke.yaml`          | activated |       | iPad smoke test — launch, authenticate, assert all major layout regions are accessible on an iPad simulator.             |

### Cobrar y ventas

| Flow                           | Entry     | Suite | What it proves                                                                                                            |
| ------------------------------ | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| `ventas-lista.yaml`            | activated | ✓     | Ventas del turno (Track M-11, M-08; board MvVentas): the Ventas tab lists the turno's sales — the three-figure KPI row,   |
| `venta-cantidad-multiple.yaml` | activated |       | Sell multiple units by tapping the same product 3 times.                                                                  |
| `venta-detalle-cancelar.yaml`  | activated | ✓     | A sale's sheet on the Ventas tab (Track M-11, M-08; board MvVentas «detalle»/«cancelar-venta»): the lines and tiles, «Ma  |
| `cancelaciones-nav.yaml`       | activated | ✓     | The Ventas tab (Track M-11): /cancelaciones became /ventas (M-05; the old route redirects, apps/mobile/src/app/cancelaci  |
| `ventas-caja-gate.yaml`        | activated |       | Verify the Caja gate blocks venta when caja is not open.                                                                  |
| `cobrar-escaner.yaml`          | activated |       | The escáner (Track M, M-07; MvEscaner): typing an unknown code offers «Darlo de alta», which opens Producto nuevo with t  |
| `empty-ventas.yaml`            | activated |       | Cobrar with no products (Track M, M-07): the catalogue says there is nothing yet and offers «Producto nuevo» right there  |
| `fiado-abono-recordar.yaml`    | activated | ✓     | Fiado y abonos (Track M-11, M-08; boards MvFiado/MvCobranza\*): Inicio's atajo opens /fiado; a client's account opens its |

### Gastos

| Flow                           | Entry     | Suite | What it proves                                                                                                           |
| ------------------------------ | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `gastos-registrar.yaml`        | activated | ✓     | Gastos del turno (Track M-11, M-08; board MvGastos): Inicio's atajo opens /gastos, «Registrar gasto» records what left t |
| `gastos-pagar-recurrente.yaml` | activated | ✓     | Pagar un gasto recurrente vencido (Track M-11, M-08; board MvGastos «pagar»): the seeded «Renta local» (mensual, vence e |
| `nuevo-egreso-cancel.yaml`     | activated |       | Closing «Registrar gasto» without saving records nothing (Track M, M-08).                                                |
| `empty-egresos.yaml`           | activated |       | Gastos with nothing recorded yet (Track M, M-08; MvGastos): Don and the empty state, and «Registrar gasto» still in the  |

### Inventario y productos

| Flow                             | Entry     | Suite | What it proves                                                                                                          |
| -------------------------------- | --------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| `inventario-llego-merma.yaml`    | activated | ✓     | Inventario (Track M, M-09; board MvInventario): /productos lists the existencias; a row's entrada square opens «Entrada |
| `inventario-barcode.yaml`        | activated |       | Create a producto using the manual barcode entry path.                                                                  |
| `stock-buscar.yaml`              | activated |       | Inventario's search (Track M, M-09; MvInventario): typing filters the Existencias list, and a name with no product says |
| `producto-quick-add.yaml`        | activated |       | Products are create-only on the device (A-09): quick-add asks nombre, código, categoría, precio and stock tracking; the |
| `validation-producto.yaml`       | activated |       | Test form validation on the NuevoProducto modal.                                                                        |
| `notificaciones-stock-bajo.yaml` | activated |       | Verify the Director can toggle stock-low notifications in Settings (P1C-M11-T01..T03, S4-C13).                          |

### Mi turno y cierre

| Flow                            | Entry     | Suite | What it proves                                                                                                           |
| ------------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `mi-turno.yaml`                 | activated | ✓     | Mi turno (Track M, M-09; board MvTurno): the /turno tab says the turno — the hero with the cash that must be in the draw |
| `caja-abrir-cerrar.yaml`        | activated | ✓     | Open→close lifecycle on the new Mi turno/Cierre screens (M-06/M-09; the old CajaContent flow — caja-status-card, blind-c |
| `cierre-cuadra.yaml`            | activated | ✓     | Cierre que cuadra (Track M, M-09; boards MvCierre/MvCierreHecho): from Mi turno's «Cerrar mi turno», count the drawer by |
| `cierre-faltante.yaml`          | activated | ✓     | Cierre con faltante (Track M, M-09): count short of the expected, the diferencia turns red, asks its motivo and names th |
| `caja-cierre-discrepancia.yaml` | activated | ✓     | Cierre with a diferencia explained by its own note (M-09; the old flow's CountResultStep dropdown + explicación is gone) |
| `caja-movimientos-nav.yaml`     | activated |       | Navigate to Caja Movimientos screen and verify empty state.                                                              |
| `avisos-responder.yaml`         | activated | ✓     | Avisos (Track M, M-09; board MvAvisos): the header bell shows the unread count, /avisos lists the owner's messages, and  |

### Sincronización y sin internet

| Flow                        | Entry     | Suite | What it proves                                                                                                             |
| --------------------------- | --------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `sync-actualizar.yaml`      | activated |       | Cloud sync (A-07): a local write is pushed within seconds and the pill reports it; tapping the pill ("Actualizar") runs    |
| `por-enviar.yaml`           | activated | ✓     | Registros por enviar (Track M, M-09; board MvPorEnviar): the queue's whole face, not only its rejections.                  |
| `pendientes-reintento.yaml` | activated |       | Registros por enviar while rows retry (DS-07, EsMvReintentando): a sale the server refuses for a moment (the mock's `fla   |
| `sin-internet-cobrar.yaml`  | activated | ✓     | Sin internet, sigue cobrando (CLAUDE.md §2.2; catalogue J10-07 phone half, J4-26): the server vanishes mid-shift (`/\_\_mo |
| `sin-internet-cierre.yaml`  | activated | ✓     | The close goes ahead with records still to send (ADR-123; catalogue J4-26, the phone half of cierre.sync.spec): with the   |

### Plan y dispositivo

| Flow                             | Entry     | Suite | What it proves                                                                                                           |
| -------------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `entitlement-feature-gates.yaml` | activated |       | Feature flags from the verified plan (A-14; catalogue J8-04): on Xangarrito stock is off — Productos is a plain catalog  |
| `plan-pago-pendiente.yaml`       | activated | ✓     | Payment grace (ADR-053 §5, A-10; catalogue J8-05): the server says the plan's validUntil passed three days ago and grace |
| `plan-vencido.yaml`              | activated | ✓     | Lapsed payment (ADR-053 §5, A-10; catalogue J8-06): both the plan's validUntil and its graceUntil are past (mock scenari |
| `dispositivo-revocado.yaml`      | activated | ✓     | The owner revokes this caja mid-shift (B-12, catalogue J3-15 / J10-14 phone half): the next sync answers DEVICE_REVOKED, |
| `settings-desvincular.yaml`      | activated | ✓     | Device-only Ajustes (A-12, MvAjustes): Esta caja / Sincronización / En este teléfono / Privacidad y términos, and «Desvi |

### Ajustes y observabilidad

| Flow                                   | Entry     | Suite | What it proves                                                                                                           |
| -------------------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `settings-check-updates.yaml`          | activated |       | Settings → Sistema → assert settings-check-for-updates visible.                                                          |
| `settings-crash-reporting-toggle.yaml` | activated |       | Settings → Sistema → Crash Reporting Toggle Verifies: - CrashReportingToggle is visible on the Sistema sub-screen - Togg |
| `bug-report-sheet.yaml`                | activated |       | Open the Bug Report sheet from Settings → Sistema → "Reportar un problema".                                              |

## Running via MCP (Claude / Cursor)

The repo root `.mcp.json` registers Maestro as an MCP server so any MCP
host (Claude Code, Cursor, etc.) can call `maestro test`, inspect the view
hierarchy, and read reports without leaving the chat.

**Requirements:**

- Maestro CLI ≥ 1.40 on your `PATH` (`maestro --version`).
- `maestro mcp` starts the stdio server automatically via `.mcp.json`; no
  manual startup needed.

**What the MCP surface exposes (as of Maestro 1.40):**

| Tool                     | What it does                                                         |
| ------------------------ | -------------------------------------------------------------------- |
| `run_flow`               | Execute a `.yaml` flow file against the booted (or specified) device |
| `inspect_view_hierarchy` | Dump the accessibility tree of the current screen                    |
| `list_devices`           | List available iOS simulators / Android emulators                    |
| `take_screenshot`        | Capture the current screen                                           |

---

## Running on iPad

`app.json` declares `ios.supportsTablet: true`, so the existing dev client
runs as a native iPad app when launched on an iPad simulator.

### Prerequisites

1. **iPad simulator present:** Open Xcode → Devices and Simulators and
   verify at least one iPad model is installed. Default target:
   `iPad (10th generation)`. Override with the `MAESTRO_IPAD_DEVICE` env
   var.
2. **Dev client installed on the iPad simulator (one-time per device):**
   ```sh
   pnpm --filter @xangarro/mobile ios -- --device "iPad (10th generation)"
   ```
3. **Metro bundler running** (same as for iPhone flows):
   ```sh
   cd apps/mobile && npx expo run:ios
   ```

### iPad runner script

```sh
# Boot iPad + reset DB + run a single flow:
./apps/mobile/maestro/scripts/run-ipad.sh \
    apps/mobile/maestro/flows/ipad-smoke.yaml

# Boot + reset only (no test):
./apps/mobile/maestro/scripts/run-ipad.sh --install-only
```

### Full regression on iPad

```sh
./apps/mobile/maestro/scripts/full-regression.sh --device-class ipad
```

### iPad-specific env vars

| Variable              | Default                  | Purpose                                                              |
| --------------------- | ------------------------ | -------------------------------------------------------------------- |
| `MAESTRO_IPAD_DEVICE` | `iPad (10th generation)` | Display name of the iPad simulator to target                         |
| `MAESTRO_DEVICE_UDID` | _(auto-resolved)_        | UDID override — set by scripts, or manually to pin an exact device   |
| `MAESTRO_EXCLUSIVE`   | `0`                      | Set to `1` to shut down conflicting iPhone simulators before booting |

---

## Tag Infrastructure

Tags are declared in flow YAML headers and usable with `--includeTags` /
`--excludeTags`. See `.maestro-config.yaml` for the full tag reference.

| Tag             | Purpose                            |
| --------------- | ---------------------------------- |
| `regression`    | The curated set                    |
| `offline`       | Takes the mock down and up         |
| `sync`          | The queue and the pill             |
| `entitlement`   | Plan scenarios on the mock         |
| `devices`       | Linking and revocation             |
| `observability` | Telemetry, audit, bug-report flows |
| `ventas`        | Sales-related                      |
| `cancelaciones` | Cancel with a reason               |
| `gastos`        | Expense-related                    |
| `fiado`         | Credit sales and abonos            |
| `settings`      | Settings flows                     |
| `caja`          | Cash drawer                        |
| `cierre`        | The close                          |
| `escaner`       | The barcode scanner                |

Only some flows carry tags today; tag a flow when you touch it.

---

## HTML Report System

Every test run (via `full-regression.sh`, `run-flow.sh`, or `run-ipad.sh`)
automatically generates a structured HTML report at `e2e-reports/`.

### Viewing the report

```sh
# Open the report in a browser:
pnpm e2e:report
# or:
open e2e-reports/index.html
```

The report opens automatically when tests fail.

### Report features

- **Dashboard:** summary cards, donut chart, per-area stacked bar, 30-run trend line, flaky test list
- **Test list:** grouped by feature area, filterable by status/area/flaky, text search
- **Detail view:** full step trace, expected-vs-actual comparison, failure screenshot with zoom, view hierarchy, probable cause analysis

### Directory structure

```
e2e-reports/                          # Repo root
├── index.html                        # Viewer entry (checked in)
├── viewer/                           # Checked in
│   ├── app.js                        # Dashboard + list + detail views
│   ├── styles.css                    # Dark theme
│   └── vendor/chart.umd.min.js       # Vendored Chart.js 4.x
├── runs-index.js                     # Generated (gitignored)
├── latest.json                       # Generated (gitignored)
└── runs/                             # Generated (gitignored)
    └── <run-id>/
        ├── manifest.json             # Run totals + per-test summary
        ├── results.ndjson            # Crash-safe incremental log
        ├── data.js                   # Viewer data payload
        └── tests/<flow-name>/
            ├── result.json           # Status, duration, failure details
            ├── commands.json         # Step trace (all tests)
            ├── screenshot.png        # Failures only
            ├── hierarchy.json        # Failures only
            └── report.md             # Failures only
```

### Run history

- Last **30 runs** are kept; older runs are pruned automatically.
- Run IDs are auto-generated: `<date>_<time>_<suite>_<phase>` (e.g. `2026-07-09_1430_full-regression_all`).
- Override with `--run-name <name>`.

### Feature area mapping

Tests are grouped by feature area using regex rules in
`apps/mobile/maestro/scripts/feature-areas.json`. First match wins;
unmatched tests show as "Sin categoría".

### LLM debugging

See CLAUDE.md §12 for the reading order agents should follow when
diagnosing failures: `latest.json` → `manifest.json` → `result.json` →
`screenshot.png` + `hierarchy.json` + `report.md`.

---

## Re-running between flows

Some flows depend on state the previous one set up. The cleanest way is:

```sh
./apps/mobile/maestro/scripts/fresh-install.sh \
    apps/mobile/maestro/flows/wizard-local-standalone.yaml
maestro test apps/mobile/maestro/flows/inventario-producto.yaml
maestro test apps/mobile/maestro/flows/venta-efectivo.yaml
```
