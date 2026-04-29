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

## Flow inventory (grouped by feature area)

### Smoke + onboarding

| Flow                               | Closes         | What it proves                                                        |
| ---------------------------------- | -------------- | --------------------------------------------------------------------- |
| `smoke-launch.yaml`                | —              | App boots, wizard renders, no crash path.                             |
| `wizard-local-standalone.yaml`     | M1-M2 / WUX-M4 | Wizard (Step 1 → Step 2A → Local) → BusinessForm → RolePicker → Tabs. |
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

### Cloud mode

| Flow                        | Closes     | What it proves                                           |
| --------------------------- | ---------- | -------------------------------------------------------- |
| `cloud-signup-signin.yaml`  | P1E-M3 C13 | Wizard → Cloud → sign-up → sign-out → sign-in.           |
| `cloud-offline-replay.yaml` | P1E-M4 C16 | Two devices, offline writes on one, online sync replays. |

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
