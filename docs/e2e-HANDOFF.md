# E2E Maestro — Handoff (start here)

> **Next LLM: read this first.** Single entry point for running and fixing the
> Xangarro! mobile Maestro suite (task A-16 in `docs/plan/05-app.md`).

## The goal (governs everything)

The app is capture-only: an operator signs in on an **activated** device and records
ventas, caja, gastos and productos. If a flow fails, fix the _real_ cause. **Do not
force a flow to pass over a genuine code bug.** A flow for a surface that left the app
(it moved to the web portal, or was retired) is archived under
`archive/maestro-flows/`, never deleted.

## How the suite is organised

- **`flows/suite.txt`** is the ordered manifest `full-regression.sh` runs. Flows not
  listed there do not run. Order matters where a flow needs, or leaves behind, device
  or mock state: `empty-egresos` before any expense is captured; mock-scenario flows
  (`entitlement-*`, `settings-desvincular`) and `login-lockout` last.
- **Entry points** (`# x-entrypoint:` in each flow header, `scripts/lib/entry-setup.sh`):
  - `activated` (default): mock reset → DB deleted → cold start → `activation.yaml`.
    It runs once per suite; every activated flow then starts from a cold launch on the
    operator list.
  - `fresh`: mock reset + DB deleted, never cached (`activation*.yaml` only).
- **Shared subflows** (`flows/shared/`): `authenticate` → `login-operator` (Toni, PIN
  123456, one retry for a double-registered keypad tap), `login-ana` (PIN 567890),
  `ensure-caja-open`, `ensure-caja-closed`, `create-venta`, `navigate-to-settings`,
  and the mock control scripts `mock-reset.js`, `mock-scenario.js`, `mock-row.js`.
- **Mock business** (`packages/contracts` mock): Tacos La Esquina, operators Toni and
  Ana, 28 products at stock 0, 3 clients, one employee "Ana — Cajera". Employees and
  operators are created in the portal only; the device just pulls them.

## Running

```bash
# 1. Mock API (IPv4 only; Docker holds :3000 on the dev machine)
PORT=3100 pnpm mock:api
# 2. Metro with the app pointed at the mock
cd apps/mobile && EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_API_BASE=http://127.0.0.1:3100 npx expo start --dev-client
# 3. Whole suite (always pass the device — see gotchas)
MAESTRO_DEVICE_UDID=<UDID> apps/mobile/maestro/scripts/full-regression.sh --no-open   # or: --dry-run
# One flow (does its own entry setup + cold start)
MAESTRO_DEVICE_UDID=<UDID> apps/mobile/maestro/scripts/run-flow.sh flows/<flow>.yaml
```

Simulators: **iPad Pro 13-inch (M5)** `CC1DFB58-11A0-43BD-9CAA-64B7431EEF2E`,
**iPhone 17** `4C5FA73E-F0D9-41A4-A058-511EE3F807AE` (its dev client predates
expo-secure-store and must be rebuilt before it can activate).

Failure reports: `e2e-reports/latest.json` → run manifest → per-test `result.json`,
`screenshot.png`, `hierarchy.json` (CLAUDE.md §12).

## Gotchas that cost hours

- **One Maestro run per simulator.** Two concurrent runs fail with "only one gesture can
  be performed at a time" and corrupt each other's state.
- **Always pass the device.** With 2+ booted sims and no `--device`, Maestro loops on
  its device prompt and writes gigabytes of output. Prefer `MAESTRO_DEVICE_UDID` over
  `--device-class ipad`, which may pick (and boot) an iPad without the dev build.
- **Dev menu "Tools button"** must be off on the iPad sim: it covers the top-bar cog.
  Verify ambiguous results with a screenshot (`xcrun simctl io <UDID> screenshot`).
- **Mock scenario leaks.** A flow that fails after switching `/__mock/scenario` leaves
  the plan changed (Freelancer hides stock UI), which fails unrelated later flows.
  Reset with `curl -X POST http://127.0.0.1:3100/__mock/reset`.
- **iPad keyboard** covers lower form fields: hide it after `inputText` on full screens
  (`hideKeyboard`); inside sheets see the next-but-one item.
- **Selectors (iOS Fabric):** `text:` is an anchored regex → `'.*label.*'`. Tamagui
  pressables expose merged accessibility text; match containers/inputs by `id:`.
- **Card text is one element.** A Tamagui card exposes its texts as one merged label:
  `'Renta del local'` never matches, `'.*Renta del local.*'` does. The same merge makes a
  text match on a POS product also hit the search box that shows the typed name — tap
  tiles by `id: 'producto-tile-.*'` after searching.
- **Pickers:** `Combobox` options are `id: 'combobox-option-<key>'`; never `tapOn: index`.
  `WheelQuantityPicker` (quantities, weekday) can't be typed into — leave its default.
- **Keyboard in sheets:** `hideKeyboard` taps outside and closes a `Modal` sheet. Use
  `shared/hide-keyboard-in-sheet.yaml` (taps the sheet title).
- **Shared-device state:** every activated flow sees what earlier flows left: open or
  half-counted caja turnos (`ensure-caja-open`/`ensure-caja-closed` resume both),
  pendientes, duplicate payment names (create uniquely named rows), the POS search text.
- **Swipe rows:** swipe RIGHT reveals Editar, LEFT reveals Borrar; swipe `from:` the row.
- **Single-quoted YAML regex:** one backslash (`'.*\$600\.00.*'`); `\\$` never matches.
- **Metro must not run with `CI=1`**: file watching is off and it serves a stale bundle.
- Driver wedged (`Connection refused :7001`): `pkill -9 -f maestro; pkill -9 -f XCTRunner`.

## App bugs the A-16 triage found (fixed, with unit tests)

- Caja close skipped the blind count for a new turno (stale cached query) — `cerrar-caja-modal`.
- Discrepancy reasons showed raw keys; `Combobox` never rendered `label`/`note`.
- Editing a payment dropped keystrokes (form state re-rendered the whole sheet).
- On iPad the keyboard covered bottom sheets entirely (KeyboardAvoidingView inside the
  portal sheet); sheets now lift by `useKeyboardHeight`, and a tap on the sheet body
  hides the keyboard without closing the sheet.

## Open questions (not changed)

- Cancelaciones renders a "Cancelada" badge, but `CancelarVentaUseCase` deletes the sale,
  so the badge is unreachable.
- The POS search keeps its text after a sale; the next sale starts on a filtered grid.
- With Quincenal selected the recurrente form shows both the day-of-month and
  day-of-week wheels.
