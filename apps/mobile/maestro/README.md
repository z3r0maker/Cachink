# Maestro E2E Suite — `apps/mobile`

This directory holds the Maestro flow library that exercises the mobile
app end-to-end on a running simulator (or physical device). Flows ship
alongside the feature work that needs them and re-run as a smoke pass
before any change that touches the wizard, tabs, or onboarding flows.

**Suite size:** 175 standalone flows + 11 shared subflows.

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
# Full phased regression (recommended):
./apps/mobile/maestro/scripts/full-regression.sh

# Dry-run (just print the flow list):
./apps/mobile/maestro/scripts/full-regression.sh --dry-run

# Specific phase only:
./apps/mobile/maestro/scripts/full-regression.sh --phase B

# Wizard flows (requires fresh install per flow):
./apps/mobile/maestro/scripts/full-regression.sh --phase W

# A single flow (auto-detects and runs the correct setup):
./apps/mobile/maestro/scripts/run-flow.sh apps/mobile/maestro/flows/venta-efectivo.yaml

# Multiple flows (state is cached between runs with the same entry point):
./apps/mobile/maestro/scripts/run-flow.sh apps/mobile/maestro/flows/venta-efectivo.yaml \
    apps/mobile/maestro/flows/venta-tarjeta.yaml

# Force a specific entry point:
./apps/mobile/maestro/scripts/run-flow.sh --entry demo apps/mobile/maestro/flows/smoke-launch.yaml

# Dry-run (show detected entry points without executing):
./apps/mobile/maestro/scripts/run-flow.sh --dry-run apps/mobile/maestro/flows/*.yaml

# Skip setup (assume the simulator is already in the right state):
./apps/mobile/maestro/scripts/run-flow.sh --skip-setup apps/mobile/maestro/flows/venta-efectivo.yaml

# Direct maestro test (no auto-setup — you manage state yourself):
maestro test apps/mobile/maestro/flows/venta-efectivo.yaml

# Tag-filtered run:
maestro test --includeTags smoke apps/mobile/maestro/flows/
maestro test --excludeTags wizard,cloud apps/mobile/maestro/flows/
```

### Entry points

Each flow has a `# x-entrypoint:` comment that declares the app state it
needs. `run-flow.sh` reads this and runs the correct setup automatically.

| Entry point | Setup action                            | State after                                    |
| ----------- | --------------------------------------- | ---------------------------------------------- |
| `fresh`     | DB reset only                           | Clean slate, wizard screen visible             |
| `demo`      | DB reset + demo-mode seeding (~2-3 min) | QuickSwitch login, demo data (PIN 000000)      |
| `wizard`    | DB reset + wizard-local-standalone      | Director Test user (PIN 123456), Director Home |

Run `run-flow.sh --dry-run <flow>` to see which entry point a flow uses.

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
> `wizard-help-modal.yaml`, `wizard-multi-branch.yaml`,
> `wizard-join-existing-link.yaml`, `wizard-business-full-form.yaml`.
> All other flows assume the wizard has already completed and can be run
> with plain `maestro test`.

---

## Auth Gate Boot Flow

Phase 13 introduced authentication gates that changed the app's boot flow:

1. **First run:** Wizard → BusinessForm → **DirectorSetupGate** (create user + password + PIN) → auto-login → Director Home
2. **Subsequent launch:** **QuickSwitchGate** (avatar + PIN) → tabs
3. **Auto-lock after 5min inactivity:** → QuickSwitch re-shown

This means ALL flows that expect tabs now require authentication.

### Two Authentication Paths

| Path          | User                          | PIN    | Created by                   | Use case                                   |
| ------------- | ----------------------------- | ------ | ---------------------------- | ------------------------------------------ |
| **Wizard**    | Director Test                 | 123456 | `shared/director-setup.yaml` | Regression runs (via `full-regression.sh`) |
| **Demo mode** | Ana Operativa / Juan Director | 000000 | `demo-mode-setup.yaml`       | Standalone demo flows                      |

The **regression script** starts from `wizard-local-standalone.yaml` which creates "Director Test" (PIN 123456). All subsequent flows in the regression chain use this state.

The **demo mode** path is for standalone flows that test demo-specific features.

### Shared subflows

| Subflow                                | Purpose                                                     | Auth path         |
| -------------------------------------- | ----------------------------------------------------------- | ----------------- |
| `shared/dismiss-modals.yaml`           | Dismisses consent modals on cold boot                       | —                 |
| `shared/authenticate.yaml`             | Logs in as Ana Operativa (demo PIN 000000)                  | Demo              |
| `shared/authenticate-operativo.yaml`   | Same as authenticate.yaml (alias)                           | Demo              |
| `shared/authenticate-director.yaml`    | Logs in as Juan Director (demo PIN 000000)                  | Demo              |
| `shared/authenticate-wizard.yaml`      | Logs in as Director Test (wizard PIN 123456)                | Wizard/Regression |
| `shared/director-setup.yaml`           | Completes DirectorSetup during wizard with test credentials | Wizard            |
| `shared/select-operativo.yaml`         | Switches to Operativo role from Director Home               | —                 |
| `shared/navigate-to-clientes.yaml`     | Navigates to Clientes screen                                | —                 |
| `shared/enable-conversion-flag.yaml`   | Enables the conversion feature flag                         | —                 |
| `shared/enable-auditoria-flag.yaml`    | Enables the auditoria feature flag                          | —                 |
| `shared/create-product-operativo.yaml` | Creates a test product as Operativo                         | —                 |

### Test credentials

**Wizard path** (created by `shared/director-setup.yaml`):

| Field             | Value             |
| ----------------- | ----------------- |
| Name              | Director Test     |
| Email             | test@cachink.test |
| Recovery Password | Test1234          |
| PIN               | 123456            |

**Demo path** (created by `demo-mode-setup.yaml`):

| Field             | Value  |
| ----------------- | ------ |
| Ana Operativa PIN | 000000 |
| Juan Director PIN | 000000 |

### Flow authoring pattern

Every flow MUST follow this pattern:

```yaml
appId: mx.cachink.mobile
---
- launchApp
- runFlow: shared/dismiss-modals.yaml
- runFlow: shared/authenticate.yaml # or authenticate-wizard.yaml
# ... flow-specific steps
```

The `authenticate*.yaml` steps are all `optional: true` — they are a no-op
when the app is already past auth (e.g., warm launch in the same session).

---

## Testing the Barcode Scanner

The Scanner component uses `expo-camera`'s `onBarcodeScanned`. There are
three ways to exercise it depending on your environment:

| Environment      | How to test                                                                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iOS Simulator** | No camera available — use the **manual entry path**. The `inventario-barcode.yaml` Maestro flow covers this: taps "Escanear código", types a barcode in the manual input, and asserts the SKU populates. |
| **Android Emulator** | Use the **VirtualScene camera**: AVD settings → Camera → Back = VirtualScene. Place a barcode PNG on the virtual poster wall (edit `~/.android/avd/<name>.avd/Toren1BD.posters` or drag an image into the scene), then "walk" to it with WASD keys. This exercises the real `onBarcodeScanned` pipeline end-to-end. |
| **Real device**  | Run the Expo dev build and point the camera at any EAN-13 barcode on a product. A haptic confirms the read and the SKU auto-fills on the form.                         |

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

`full-regression.sh` runs flows in dependency order. Use `--phase X` to
run a specific phase or `--dry-run` to see the full flow list.

| Phase | Gate   | Description                                | Flow count |
| ----- | ------ | ------------------------------------------ | ---------- |
| 0     | always | Fresh install + wizard                     | 1          |
| 1     | C      | Empty states (before data)                 | 5          |
| 2     | always | Create baseline data                       | 3          |
| 3     | B/A/C  | Product management                         | ~12        |
| 4     | B/C/A  | Sales + checkout                           | ~10        |
| 5     | C/A    | Egresos                                    | ~14        |
| 6     | A      | Employee management                        | 2          |
| 7     | always | Clientes + CxC                             | 8          |
| 8     | always | Corte de día                               | 4          |
| 9     | B/D    | Director features + estados                | ~17        |
| 9.5   | B/C    | Auth + Feature Flags                       | ~12        |
| 9.7   | D      | Notifications + Otros deep nav             | 4          |
| 13    | A      | Flag cascades + user lifecycle             | 9          |
| 13.5  | A/D    | User management lifecycle                  | 5          |
| 13.6  | C      | Caja edge cases                            | 3          |
| 13.7  | D      | Error paths                                | 2          |
| 10    | B      | Settings                                   | 7          |
| 10.5  | E      | Settings deep flows                        | 6          |
| 11    | C      | Validation                                 | 2          |
| 16    | E      | E2E coverage gap — wizard                  | 1          |
| 12    | A      | Deletions (state-destroying, last!)        | 4          |
| W     | W      | Wizard edge cases (fresh install per flow) | ~10        |

---

## Flow Inventory (grouped by feature area)

### Smoke + Onboarding (Phase W)

| Flow                               | What it proves                                       |
| ---------------------------------- | ---------------------------------------------------- |
| `smoke-launch.yaml`                | App boots, wizard renders, no crash path             |
| `wizard-local-standalone.yaml`     | Wizard → Local → BusinessForm → DirectorSetup → tabs |
| `wizard-cloud-solo.yaml`           | Solo + Cloud-as-backup path                          |
| `wizard-mobile-disabled-host.yaml` | LAN server card disabled for mobile                  |
| `wizard-help-modal.yaml`           | Help modal opens, scenario picks                     |
| `wizard-rerun-with-data.yaml`      | Re-run with data shows green callout                 |
| `wizard-multi-branch.yaml`         | Multi-branch wizard path                             |
| `wizard-join-existing-link.yaml`   | Join existing via link                               |
| `wizard-business-full-form.yaml`   | Business form with all fields                        |
| `wizard-business-back.yaml`        | Back navigation in wizard                            |
| `wizard-confirm-mode-change.yaml`  | Confirm mode change dialog                           |
| `crash-screen.yaml`                | Error boundary renders friendly fallback             |
| `a11y-smoke.yaml`                  | All tab targets have a11y labels; ≥ 44×44            |

### Ventas + Checkout

| Flow                                | What it proves                            |
| ----------------------------------- | ----------------------------------------- |
| `venta-efectivo.yaml`               | Inline POS → Efectivo → sale appears      |
| `venta-manual.yaml`                 | Manual venta entry form                   |
| `venta-otros-metodos.yaml`          | Non-cash payment methods                  |
| `venta-credito.yaml`                | Crédito + client → Director CxC           |
| `venta-comprobante.yaml`            | Comprobante generation + share            |
| `venta-cantidad-multiple.yaml`      | Multiple quantity selection               |
| `venta-search-product.yaml`         | POS product search                        |
| `venta-detail-popover-inspect.yaml` | Sale detail popover                       |
| `checkout-method-picker.yaml`       | **NEW** Multi-step checkout method picker |
| `editar-venta.yaml`                 | Edit existing sale                        |
| `editar-venta-full-form.yaml`       | Edit sale with all fields                 |
| `ventas-total-y-fecha.yaml`         | Sales total + date filter                 |
| `ventas-caja-gate.yaml`             | Caja gate blocks venta                    |
| `validation-venta.yaml`             | Venta form validation errors              |

### Egresos (Gasto / Nómina / Inventario / Recurrente)

| Flow                                  | What it proves                   |
| ------------------------------------- | -------------------------------- |
| `egreso-gasto.yaml`                   | Simple gasto creation            |
| `egreso-gasto-via-fab.yaml`           | Gasto via FAB button             |
| `egreso-gasto-full-form.yaml`         | Gasto with all fields            |
| `egreso-nomina.yaml`                  | Nómina sub-tab + employee picker |
| `egreso-nomina-periodo.yaml`          | Nómina period selection          |
| `egreso-nomina-field-assertions.yaml` | Nómina field validations         |
| `egreso-inventario.yaml`              | Egreso + inventory dual-write    |
| `egreso-inventario-empty-state.yaml`  | Inventario egreso empty state    |
| `egreso-recurrente.yaml`              | Mark gasto as recurrente         |
| `egreso-recurrente-mensual.yaml`      | Monthly recurrence               |
| `egreso-recurrente-semanal.yaml`      | Weekly recurrence                |
| `egreso-recurrente-descartar.yaml`    | Discard recurring entry          |
| `egresos-total-y-fecha.yaml`          | Egresos total + date filter      |
| `egresos-por-categoria-donut.yaml`    | Category donut chart             |
| `editar-egreso.yaml`                  | Edit existing egreso             |
| `editar-egreso-full-form.yaml`        | Edit egreso with all fields      |
| `nuevo-egreso-cancel.yaml`            | Cancel new egreso creation       |
| `validation-egreso.yaml`              | Egreso form validation errors    |

### Productos (Catálogo / Stock / Movimientos)

| Flow                                | What it proves                |
| ----------------------------------- | ----------------------------- |
| `inventario-producto.yaml`          | NuevoProductoModal happy path |
| `producto-entrada-stock.yaml`       | Stock entry                   |
| `producto-movimientos.yaml`         | Movement history              |
| `producto-full-form.yaml`           | Product with all fields       |
| `producto-via-fab.yaml`             | Product creation via FAB      |
| `producto-uso-selector.yaml`        | Product uso selector          |
| `nuevo-producto-icon-picker.yaml`   | Icon picker for new product   |
| `stock-kpi-strip.yaml`              | Stock KPI strip               |
| `stock-buscar.yaml`                 | Stock search                  |
| `stock-bajo-ver-link.yaml`          | Low stock → detail link       |
| `editar-producto.yaml`              | Edit product                  |
| `editar-producto-full-form.yaml`    | Edit product all fields       |
| `movimiento-salida-con-motivo.yaml` | Salida with reason            |
| `movimiento-entrada-con-nota.yaml`  | Entrada with note             |
| `validation-producto.yaml`          | Product form validation       |
| `inventario-salida.yaml`            | Salida via Movimientos        |
| `inventario-barcode.yaml`           | Barcode scanner wired in      |

### Clientes + Cuentas por Cobrar

| Flow                              | What it proves            |
| --------------------------------- | ------------------------- |
| `cliente-crear.yaml`              | New cliente creation      |
| `cliente-crear-via-fab.yaml`      | Cliente via FAB           |
| `cliente-crear-full-form.yaml`    | Cliente with all fields   |
| `cliente-buscar.yaml`             | Client search             |
| `cliente-detail-screen.yaml`      | Client detail             |
| `cliente-detail-empty-state.yaml` | Client detail empty state |
| `cliente-editar.yaml`             | Edit client               |
| `cliente-pago-completo.yaml`      | Full payment              |
| `cliente-pago-parcial.yaml`       | Partial payment           |
| `registrar-pago-full-form.yaml`   | Payment form all fields   |

### Corte de Día

| Flow                             | What it proves                             |
| -------------------------------- | ------------------------------------------ |
| `corte-de-dia.yaml`              | Operativo home → corte card → modal → save |
| `corte-de-dia-detail-cards.yaml` | Corte detail cards                         |
| `corte-con-diferencia.yaml`      | Diferencia explanation field               |
| `corte-historial-director.yaml`  | Director views corte history               |

### Director Home + Reports

| Flow                              | What it proves                      |
| --------------------------------- | ----------------------------------- |
| `director-home.yaml`              | UtilidadHero + HoyKpi + CxC + cards |
| `director-home-structure.yaml`    | Full dashboard structure            |
| `director-home-ver-ventas.yaml`   | Ver ventas navigation               |
| `director-home-cxc-nav.yaml`      | CxC navigation from home            |
| `director-home-cxc-strip.yaml`    | CxC strip widget                    |
| `director-home-utilidad-nav.yaml` | Utilidad navigation                 |
| `director-home-stock-bajo.yaml`   | Low stock card                      |
| `director-home-actividad.yaml`    | Activity feed                       |
| `director-to-ventas.yaml`         | Director → venta detail             |
| `informe-mensual.yaml`            | Estados → Informe PDF               |
| `exportar-datos.yaml`             | Settings → Export Excel + PDF       |

### Estados Financieros + Indicadores

| Flow                               | What it proves            |
| ---------------------------------- | ------------------------- |
| `estados-subtabs.yaml`             | Sub-tab navigation        |
| `estados-resultados-data.yaml`     | Estado de Resultados data |
| `estados-resultados-all-rows.yaml` | All result rows           |
| `estados-period-picker.yaml`       | Period picker             |
| `estados-balance-data.yaml`        | Balance General data      |
| `balance-general-all-rows.yaml`    | All balance rows          |
| `balance-general-pasivo.yaml`      | Pasivo section            |
| `estados-flujo-efectivo.yaml`      | Flujo de Efectivo         |
| `flujo-efectivo-all-rows.yaml`     | All cash flow rows        |
| `indicadores-screen.yaml`          | KPIs screen               |

### Caja (Cash Drawer)

| Flow                            | What it proves                |
| ------------------------------- | ----------------------------- |
| `caja-abrir-cerrar.yaml`        | Open → status → close         |
| `caja-con-adicional.yaml`       | Additional deposits           |
| `caja-cierre-discrepancia.yaml` | Cierre with discrepancy       |
| `caja-handoff.yaml`             | Caja handoff between shifts   |
| `caja-movimientos-nav.yaml`     | **NEW** Caja movements screen |

### Cancelaciones

| Flow                     | What it proves                        |
| ------------------------ | ------------------------------------- |
| `cancelaciones-nav.yaml` | **NEW** Navigate + verify empty state |

### Otros Tab Navigation

| Flow                            | What it proves                     |
| ------------------------------- | ---------------------------------- |
| `otros-nav.yaml`                | Otros grid renders, items navigate |
| `otros-empleados-empty.yaml`    | Empleados empty state              |
| `otros-conversion-nav.yaml`     | Conversion navigation              |
| `otros-auditoria-nav.yaml`      | Auditoria navigation               |
| `otros-caja-reportes-nav.yaml`  | Caja reportes navigation           |
| `otros-ventas-credito-nav.yaml` | Ventas crédito navigation          |
| `otros-merma-reportes-nav.yaml` | Merma reportes navigation          |

### Auth + Feature Flags

| Flow                                   | What it proves                     |
| -------------------------------------- | ---------------------------------- |
| `quick-switch-login.yaml`              | QuickSwitch correct/wrong password |
| `role-switch.yaml`                     | Director ↔ Operativo switch        |
| `change-password.yaml`                 | Forced password change             |
| `change-pin.yaml`                      | PIN change flow                    |
| `change-pin-wrong-current.yaml`        | Wrong current PIN error            |
| `recovery-password.yaml`               | Forgot password recovery           |
| `recovery-back-and-factory-reset.yaml` | Recovery + factory reset           |
| `recovery-pin.yaml`                    | PIN recovery                       |
| `funciones-toggle.yaml`                | Toggle feature flags               |
| `funciones-stock-disabled.yaml`        | Stock OFF → no stock UI            |
| `funciones-cascade-disable.yaml`       | Flag cascade disable               |
| `funciones-cant-enable-child.yaml`     | Child flag requires parent         |
| `funciones-conversion-auto-chain.yaml` | Conversion auto-chain              |
| `funciones-ventas-credito-toggle.yaml` | Ventas crédito toggle              |
| `auto-lock-smoke.yaml`                 | Inactivity → QuickSwitch           |

### User Management

| Flow                                  | What it proves              |
| ------------------------------------- | --------------------------- |
| `usuario-crear.yaml`                  | Create new user             |
| `usuario-crear-cancel.yaml`           | Cancel user creation        |
| `usuario-multi-switch.yaml`           | Switch between users        |
| `usuario-last-director-guard.yaml`    | Cannot delete last Director |
| `usuario-eliminar.yaml`               | Delete user                 |
| `usuario-wrong-password-lockout.yaml` | Wrong password lockout      |
| `empleado-editar.yaml`                | Edit employee               |
| `empleado-eliminar.yaml`              | Delete employee             |

### Settings

| Flow                              | What it proves                 |
| --------------------------------- | ------------------------------ |
| `settings-hub-nav.yaml`           | Settings hub renders cards     |
| `settings-negocio-editar.yaml`    | Edit business info             |
| `settings-edit-business-isr.yaml` | ISR business settings          |
| `settings-tasas-isr.yaml`         | ISR rate tables                |
| `settings-sistema-cards.yaml`     | Sistema screen cards           |
| `settings-export-datos.yaml`      | Export data action             |
| `settings-funciones-nav.yaml`     | Funciones navigation           |
| `settings-check-updates.yaml`     | Check for updates              |
| `settings-tipos-de-pago.yaml`     | **NEW** Payment method toggles |
| `advanced-backend-screen.yaml`    | Advanced backend settings      |

### Observability + Bug Reporting

| Flow                           | What it proves                  |
| ------------------------------ | ------------------------------- |
| `telemetria-dev-nav.yaml`      | **NEW** Dev telemetry dashboard |
| `bug-report-sheet.yaml`        | **NEW** Bug report sheet opens  |
| `crash-screen.yaml`            | Error boundary renders          |
| `otros-auditoria-nav.yaml`     | Audit log navigation            |
| `director-notificaciones.yaml` | Notification inbox + config     |

### Notifications

| Flow                             | What it proves                |
| -------------------------------- | ----------------------------- |
| `notificaciones-stock-bajo.yaml` | Stock-low push (mocked clock) |
| `director-notificaciones.yaml`   | Notification inbox            |

### Merma (Shrinkage)

| Flow                       | What it proves     |
| -------------------------- | ------------------ |
| `merma-registro.yaml`      | Register shrinkage |
| `merma-cancel-y-nota.yaml` | Cancel + note      |

### Conversión (Materia Prima)

| Flow                              | What it proves           |
| --------------------------------- | ------------------------ |
| `conversion-crear-receta.yaml`    | Create conversion recipe |
| `conversion-ejecutar.yaml`        | Execute conversion       |
| `conversion-eliminar-receta.yaml` | Delete recipe            |

### Checkout

| Flow                          | What it proves                       |
| ----------------------------- | ------------------------------------ |
| `checkout-method-picker.yaml` | **NEW** Payment method picker screen |

### Deletions (State-Destroying)

| Flow                               | What it proves            |
| ---------------------------------- | ------------------------- |
| `eliminar-venta.yaml`              | Delete sale               |
| `eliminar-egreso.yaml`             | Delete egreso             |
| `eliminar-egreso-via-popover.yaml` | Delete egreso via popover |
| `eliminar-producto.yaml`           | Delete product            |

### Empty States

| Flow                   | What it proves        |
| ---------------------- | --------------------- |
| `empty-ventas.yaml`    | Ventas empty state    |
| `empty-productos.yaml` | Productos empty state |
| `empty-estados.yaml`   | Estados empty state   |
| `empty-egresos.yaml`   | Egresos empty state   |
| `empty-clientes.yaml`  | Clientes empty state  |

### LAN Mode

| Flow            | What it proves                         |
| --------------- | -------------------------------------- |
| `lan-pair.yaml` | Wizard → LAN client → scan QR → paired |

### Cloud Mode

| Flow                          | What it proves                     |
| ----------------------------- | ---------------------------------- |
| `cloud-signup-signin.yaml`    | Wizard → Cloud → sign-up → sign-in |
| `cloud-signin-bootstrap.yaml` | Reusable sub-flow: cloud sign-in   |
| `cloud-offline-replay.yaml`   | Two devices, offline replay        |
| `cloud-signup-error.yaml`     | Cloud signup error handling        |

### iPad Form-Factor

| Flow                          | What it proves                   |
| ----------------------------- | -------------------------------- |
| `ipad-smoke.yaml`             | Launch + auth + all tabs on iPad |
| `ipad-form-factor-audit.yaml` | Responsive testID accessibility  |

### Debug / Development

| Flow                         | What it proves          |
| ---------------------------- | ----------------------- |
| `debug-speed.yaml`           | Speed test assertions   |
| `debug-operativo-auth.yaml`  | Operativo auth debug    |
| `debug-auth.yaml`            | Auth debug flow         |
| `demo-mode-setup.yaml`       | Demo mode initial setup |
| `consent-modal-dismiss.yaml` | Consent modal dismiss   |

---

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
   pnpm --filter @cachink/mobile ios -- --device "iPad (10th generation)"
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
| `smoke`         | Quick sanity check (< 2 min total) |
| `regression`    | Full regression set                |
| `wizard`        | Needs fresh install                |
| `cloud`         | Needs Supabase credentials         |
| `lan`           | Needs LAN server running           |
| `ipad`          | iPad-specific                      |
| `debug`         | Developer-only                     |
| `observability` | Telemetry, audit, bug-report flows |
| `ventas`        | Sales-related                      |
| `egresos`       | Expense-related                    |
| `settings`      | Settings flows                     |
| `otros`         | Otros tab navigation               |
| `caja`          | Cash drawer                        |
| `auth`          | Authentication/PIN                 |

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
