# Maestro E2E Suite — `apps/mobile`

This directory holds the Maestro flow library that exercises the mobile
app end-to-end on a running simulator (or physical device). Flows ship
alongside the feature work that needs them and re-run as a smoke pass
before any change that touches the wizard, tabs, or onboarding flows.

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev) ≥ 1.40 installed locally
  (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- An iOS simulator (Xcode-provided) OR an Android emulator running,
  with the Cachink dev client installed:
  ```sh
  pnpm --filter @cachink/mobile ios   # or `android`
  ```

### Required env vars (set before running cloud / LAN flows)

| Variable                   | Used by                                                 | Notes                                                                       |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `MAESTRO_LAN_URL`          | `lan-pair.yaml`                                         | LAN URL the desktop host is broadcasting (e.g. `http://192.168.1.5:43812`). |
| `MAESTRO_CLOUD_EMAIL_A`    | `cloud-signup-signin.yaml`, `cloud-offline-replay.yaml` | First test account email — sign-up creates this one.                        |
| `MAESTRO_CLOUD_PASSWORD_A` | same                                                    | Password for `*_EMAIL_A`.                                                   |
| `MAESTRO_CLOUD_EMAIL_B`    | `cloud-offline-replay.yaml`                             | Second test account (signs in on a 2nd device for sync replay).             |
| `MAESTRO_CLOUD_PASSWORD_B` | same                                                    | Password for `*_EMAIL_B`.                                                   |

The cloud-mode tests need a live Supabase project — point them at the
hosted Cachink dev instance documented in `supabase/README.md`.

## Running the suite

```sh
# Whole suite (every flow under maestro/flows/):
pnpm --filter @cachink/mobile test:e2e

# A single flow:
maestro test apps/mobile/maestro/flows/venta-efectivo.yaml

# A grouped set (Maestro does not support glob, so list explicitly):
maestro test apps/mobile/maestro/flows/cliente-{crear,pago-completo,pago-parcial}.yaml
```

### Fresh-install flows (wizard, smoke)

Flows that need a clean database (no prior wizard completion) **must not**
use Maestro's `clearState: true`. On iOS 18+ with Expo SDK 55 dev-clients,
`clearState` wipes the stored Metro bundler URL and the app fails to
reconnect ("No script URL provided").

Instead, use the wrapper script which does an `xcrun simctl uninstall` +
`xcrun simctl install` — this gives a fresh SQLite database while
preserving Metro connectivity:

```sh
# Single fresh-install flow:
./apps/mobile/maestro/scripts/fresh-install.sh \
    apps/mobile/maestro/flows/smoke-launch.yaml

# Chain: wizard sets up state, then venta flow runs on it:
./apps/mobile/maestro/scripts/fresh-install.sh \
    apps/mobile/maestro/flows/wizard-local-standalone.yaml
maestro test apps/mobile/maestro/flows/venta-efectivo.yaml

# Just reinstall (no test):
./apps/mobile/maestro/scripts/fresh-install.sh --install-only
```

> **Affected flows:** `smoke-launch.yaml`, `wizard-local-standalone.yaml`,
> `wizard-cloud-solo.yaml`, `wizard-mobile-disabled-host.yaml`,
> `wizard-help-modal.yaml`. All other flows assume the wizard has already
> completed and can be run with plain `maestro test`.

The suite is **not** wired into CI yet (CLAUDE.md §3: CI deferred until a
second contributor joins). Run it locally before landing anything that
touches the wizard, tabs, Ventas, Cuentas por Cobrar, Inventario, or
Settings screens.

## Auth Gate Boot Flow (Phase 13)

Phase 13 introduced authentication gates that changed the app's boot flow:

1. **First run:** Wizard → BusinessForm → **DirectorSetupGate** (create user + password + PIN) → auto-login → Director Home
2. **Subsequent launch:** **QuickSwitchGate** (avatar + password) → tabs
3. **Auto-lock after 5min inactivity:** → QuickSwitch re-shown

This means ALL flows that expect tabs now require authentication. The
shared subflow `authenticate.yaml` handles this transparently.

### Shared subflows

| Subflow | Purpose |
|---|---|
| `shared/dismiss-modals.yaml` | Dismisses consent modals on cold boot |
| `shared/authenticate.yaml` | Logs in via QuickSwitch (no-op if already past auth) |
| `shared/director-setup.yaml` | Completes DirectorSetup during wizard with test credentials |
| `shared/select-operativo.yaml` | Switches to Operativo role from Director Home |

### Test credentials

All E2E flows use these deterministic credentials created by
`shared/director-setup.yaml`:

| Field | Value |
|---|---|
| Name | Director Test |
| Email | test@cachink.test |
| Password | Test1234 |
| PIN | 123456 |

### Flow authoring pattern (post–Phase 13)

Every flow MUST follow this pattern:

```yaml
- launchApp
- runFlow: shared/dismiss-modals.yaml
- runFlow: shared/authenticate.yaml
# ... flow-specific steps
```

The `authenticate.yaml` steps are all `optional: true` — they are a no-op
when the app is already past auth (e.g., warm launch in the same session).

---

## Flow inventory (grouped by feature area)

### iPad form-factor

| Flow | Closes | What it proves |
|---|---|---|
| `ipad-smoke.yaml` | — | Launch + auth + all tab targets + Director Home + Estados subtabs on iPad |
| `ipad-form-factor-audit.yaml` | — | Tripwire: every testID used by iPhone flows is still accessible at `$gtMd` breakpoint |

### Smoke + onboarding

| Flow                               | Closes         | What it proves                                                        |
| ---------------------------------- | -------------- | --------------------------------------------------------------------- |
| `smoke-launch.yaml`                | —              | App boots, wizard renders, no crash path.                             |
| `wizard-local-standalone.yaml`     | M1-M2 / WUX-M4 | Wizard (Step 1 → Step 2A → Local) → BusinessForm → DirectorSetup → Director Home. |
| `wizard-cloud-solo.yaml`           | WUX-M4-T02     | Solo + Cloud-as-backup path (Step 1 → Step 2A → Cloud signup).        |
| `wizard-mobile-disabled-host.yaml` | WUX-M4-T03     | Mobile users see lan-server card disabled with explanation visible.   |
| `wizard-help-modal.yaml`           | WUX-M4-T04     | Help modal opens, scenario picks pre-select cards on Step 1.          |
| `wizard-rerun-with-data.yaml`      | WUX-M4-T05     | Re-run with data shows the green "Tus datos se conservan" callout.    |
| `crash-screen.yaml`                | P1C-M12-T01    | Error boundary renders the friendly fallback after a forced crash.    |
| `a11y-smoke.yaml`                  | P1C-M12-T04    | All tab targets have a11y labels; tap targets are ≥ 44×44.            |

### Ventas + comprobantes

| Flow                  | Closes         | What it proves                                                          |
| --------------------- | -------------- | ----------------------------------------------------------------------- |
| `venta-efectivo.yaml` | M3-T01/T02/T05 | Inline POS: tap product → VentaConfirmSheet → Efectivo → sale appears.  |
| `venta-credito.yaml`  | M3-T03/T06     | Inline POS: tap product → Crédito + client → Director → CxC.           |

### Egresos (Gasto / Nómina / Inventario / Recurrente)

| Flow                     | Closes        | What it proves                                                |
| ------------------------ | ------------- | ------------------------------------------------------------- |
| `egreso-gasto.yaml`      | M4-T02 gasto  | Simple gasto creation flows through `useRegistrarEgreso`.     |
| `egreso-nomina.yaml`     | M4-T02 nómina | Nómina sub-tab + employee picker.                             |
| `egreso-inventario.yaml` | M4-T02 inv    | Egreso + inventory entry dual-write per ADR-020.              |
| `egreso-recurrente.yaml` | M4-T03/T04    | Marking gasto as recurrente shows on Operativo home next day. |

### Inventario (Stock / Movimientos / Barcode)

| Flow                       | Closes | What it proves                                         |
| -------------------------- | ------ | ------------------------------------------------------ |
| `inventario-producto.yaml` | M5-T03 | NuevoProductoModal happy path.                         |
| `inventario-salida.yaml`   | M5-T04 | Entrada/Salida unified modal — salida via Movimientos. |
| `inventario-barcode.yaml`  | M5-T05 | BarcodeScanner.native.tsx wired into producto entrada. |

### Clientes + Cuentas por Cobrar

| Flow                         | Closes | What it proves                                            |
| ---------------------------- | ------ | --------------------------------------------------------- |
| `cliente-crear.yaml`         | M6-T01 | New cliente from Settings → Clientes.                     |
| `cliente-pago-completo.yaml` | M6-T04 | RegistrarPagoModal with full payment.                     |
| `cliente-pago-parcial.yaml`  | M6-T04 | Partial payment — venta stays in CxC card with new total. |

### Corte de Día

| Flow                        | Closes | What it proves                                        |
| --------------------------- | ------ | ----------------------------------------------------- |
| `corte-de-dia.yaml`         | M7-T01 | Operativo home corte card → modal → save.             |
| `corte-con-diferencia.yaml` | M7-T02 | Diferencia explanation field + reflects in historial. |

### Director Home + reports

| Flow                      | Closes     | What it proves                                                            |
| ------------------------- | ---------- | ------------------------------------------------------------------------- |
| `director-home.yaml`      | S4-C2..C7  | UtilidadHero + HoyKpi + CxC + ActividadReciente + StockBajo + Pendientes. |
| `director-to-ventas.yaml` | S4-C1      | Director taps a venta in ActividadReciente → opens detail.                |
| `informe-mensual.yaml`    | M9-C24/C25 | Estados → Informe mensual → PDF share.                                    |
| `exportar-datos.yaml`     | M9-C22/C26 | Settings → Exportar datos → Excel + PDF artifacts.                        |

### Notifications

| Flow                             | Closes     | What it proves                                             |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `notificaciones-stock-bajo.yaml` | S4-C9..C13 | Stock-low push fires for Director at 19:00 (mocked clock). |

### LAN mode

| Flow            | Closes              | What it proves                                                                               |
| --------------- | ------------------- | -------------------------------------------------------------------------------------------- |
| `lan-pair.yaml` | P1D-M4 C20 / WUX-M4 | Wizard → Step 3 (Join existing) → LAN client → scan QR → paired. Requires `MAESTRO_LAN_URL`. |

### Auth + Feature Flags (Phase 13)

| Flow                            | Closes    | What it proves                                                         |
| ------------------------------- | --------- | ---------------------------------------------------------------------- |
| `director-setup.yaml`           | P13-T01   | DirectorSetup gate during wizard: fill all fields → auto-login.        |
| `quick-switch-login.yaml`       | P13-T02   | QuickSwitch: correct password → tabs; wrong password → error.          |
| `change-password.yaml`          | P13-T03   | Forced password change for mustChangePassword users.                   |
| `funciones-toggle.yaml`         | P13-T04   | Toggle stock/caja/merma flags → verify UI mutation.                    |
| `funciones-stock-disabled.yaml` | P13-T05   | Stock OFF → no stock tab, no stock movements on venta.                 |
| `caja-abrir-cerrar.yaml`        | P13-T06   | Cash drawer: apertura → status card → cierre → closed state.           |
| `usuario-crear.yaml`            | P13-T07   | Director creates new user → appears in user list.                      |
| `otros-nav.yaml`                | P13-T08   | Otros tab grid renders → each item navigates correctly.                |
| `merma-registro.yaml`           | P13-T09   | Register shrinkage: select product → qty + reason → confirm.           |
| `recovery-password.yaml`        | P13-T10   | Forgot password: wrong PIN → error; correct PIN → reset success.       |
| `auto-lock-smoke.yaml`          | P13-T11   | Inactivity timer fires → QuickSwitch re-appears (low priority).        |
| `role-switch.yaml`              | P13-T12   | Director → Operativo → Director via top-bar chip (rewritten).          |

### Cloud mode

| Flow                           | Closes     | What it proves                                           |
| ------------------------------ | ---------- | -------------------------------------------------------- |
| `cloud-signup-signin.yaml`     | P1E-M3 C13 | Wizard → Cloud → sign-up → sign-out → sign-in.           |
| `cloud-signin-bootstrap.yaml`  | —          | Reusable sub-flow: wizard → cloud sign-in → role select. Called via `runFlow`. |
| `cloud-offline-replay.yaml`    | P1E-M4 C16 | Two devices, offline writes on one, online sync replays. |

## Running via MCP (Claude / Cursor)

The repo root `.mcp.json` registers Maestro as an MCP server so any MCP
host (Claude Code, Cursor, etc.) can call `maestro test`, inspect the view
hierarchy, and read reports without leaving the chat.

**Requirements:**

- Maestro CLI ≥ 1.40 on your `PATH` (`maestro --version`).
- `maestro mcp` starts the stdio server automatically via `.mcp.json`; no
  manual startup needed.

**What the MCP surface exposes (as of Maestro 1.40):**

| Tool | What it does |
|---|---|
| `run_flow` | Execute a `.yaml` flow file against the booted (or specified) device |
| `inspect_view_hierarchy` | Dump the accessibility tree of the current screen |
| `list_devices` | List available iOS simulators / Android emulators |
| `take_screenshot` | Capture the current screen |

**MCP usage example (in Claude Code):**

```
Run the ipad-smoke flow against the iPad simulator.
```

Claude resolves this to `run_flow(path: "apps/mobile/maestro/flows/ipad-smoke.yaml")`.

> **Note:** Flows that require a clean database (wizard flows) still need
> `fresh-install.sh` or `run-ipad.sh` to be run first — those reset the DB
> outside Maestro's protocol surface.

---

## Running on iPad

`app.json` declares `ios.supportsTablet: true`, so the existing dev client
runs as a native iPad app when launched on an iPad simulator.

### Prerequisites

1. **iPad simulator present:** Open Xcode → Devices and Simulators and
   verify at least one iPad model is installed.  Default target:
   `iPad (10th generation)`.  Override with the `MAESTRO_IPAD_DEVICE` env
   var.
2. **Dev client installed on the iPad simulator (one-time per device):**
   ```sh
   pnpm --filter @cachink/mobile ios -- --device "iPad (10th generation)"
   ```
   Once installed, the binary stays on the simulator — you do not need to
   rebuild unless you upgrade the Expo SDK.
3. **Metro bundler running** (same as for iPhone flows):
   ```sh
   cd apps/mobile && npx expo run:ios
   ```

### iPad runner script

`scripts/run-ipad.sh` mirrors `fresh-install.sh` but targets a named iPad
simulator, boots it automatically, and passes `--device <udid>` to every
`maestro test` call so runs are deterministic even when both iPhone and iPad
simulators are booted simultaneously.

```sh
# Boot iPad + reset DB + run a single flow:
./apps/mobile/maestro/scripts/run-ipad.sh \
    apps/mobile/maestro/flows/ipad-smoke.yaml

# Boot + reset only (no test):
./apps/mobile/maestro/scripts/run-ipad.sh --install-only

# Override the default device model:
MAESTRO_IPAD_DEVICE="iPad Pro 13-inch (M4)" \
    ./apps/mobile/maestro/scripts/run-ipad.sh \
    apps/mobile/maestro/flows/ipad-smoke.yaml
```

### Full regression on iPad

```sh
./apps/mobile/maestro/scripts/full-regression.sh --device-class ipad
```

This boots the target iPad, threads the UDID through to every `maestro test`
call, and produces the same `reports/` output as the iPhone run.

### iPad-specific env vars

| Variable | Default | Purpose |
|---|---|---|
| `MAESTRO_IPAD_DEVICE` | `iPad (10th generation)` | Display name of the iPad simulator to target |
| `MAESTRO_DEVICE_UDID` | _(auto-resolved)_ | UDID override — set by scripts, or manually to pin an exact device |
| `MAESTRO_EXCLUSIVE` | `0` | Set to `1` to shut down conflicting iPhone simulators before booting the iPad |

### iPad form-factor notes

Tamagui breakpoints activate at `$gtMd` (min-width 768 px) on iPad.
Known layout differences versus iPhone:

| Area | iPhone | iPad |
|---|---|---|
| Tab bar height | 49 pt | 49 pt (same — bottom tabs) |
| Modal / sheet | bottom sheet, partial | centered modal, larger snap points |
| POS grid | 2-column | 3-column at `$gtMd` |
| KPI strip | horizontal scroll | all KPIs visible without scroll |
| Side drawer | none | may render inline at `$gtLg` |

**Flow tagging convention:**

- Flows confirmed clean on iPad: no special tag.
- Flows with a layout-divergent iPad companion: named `<flow-name>.ipad.yaml`.
- Flows that rely on iPhone-only gestures/coordinates: tagged `iphone-only`
  with a comment linking the tracking issue.

### iPad-specific flows

| Flow | Purpose |
|---|---|
| `ipad-smoke.yaml` | Launch + auth + assert all tabs + Director Home + Estados on iPad |
| `ipad-form-factor-audit.yaml` | Walk every responsive surface; trips on hidden testIDs at `$gtMd` breakpoints |

---

## Re-running between flows

Some flows depend on state the previous one set up (e.g. a product exists
before `venta-efectivo.yaml` can render the POS grid, or a venta exists
before `informe-mensual` can render its PDF). The cleanest way to rehearse
is to run the fresh-install wrapper + wizard flow first, then chain the
remaining flows:

```sh
./apps/mobile/maestro/scripts/fresh-install.sh \
    apps/mobile/maestro/flows/wizard-local-standalone.yaml
maestro test apps/mobile/maestro/flows/inventario-producto.yaml
maestro test apps/mobile/maestro/flows/venta-efectivo.yaml
```
