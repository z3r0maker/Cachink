# Maestro E2E — Session Notes / Runbook (read before running flows)

Hard-won operational notes from running the MVP suite on an iPad Pro 13" (M5)
simulator. Read this before starting an E2E session — it front-loads the
gotchas that otherwise cost ~30 min of debugging.

## 0. Preflight (do these first, in order)

1. **Metro must be running.** This is an Expo **dev-client** build — without Metro
   on `:8081` the app red-screens. Start it and leave it:
   `cd apps/mobile && EXPO_PUBLIC_E2E=1 npx expo start --dev-client`
   Verify: `curl -s localhost:8081/status` → `packager-status:running`.
2. **Check the installed app isn't a stale native build.** If `package.json`
   added a native module since the last build, the app red-screens with
   `Cannot find native module 'X'`. Compare dates:
   `stat -f '%Sm' apps/mobile/ios/Podfile.lock apps/mobile/package.json`.
   If Podfile.lock is older, or `grep -i <module> ios/Podfile.lock` is empty:
   `cd apps/mobile/ios && pod install && cd .. && npx expo run:ios --device "<sim name>"`.
   (This is a 10–20 min native build. `expo run:ios` with no `--device` defaults
   to an iPhone sim, so name the target explicitly.)
3. **Always export `EXPO_PUBLIC_E2E=1`.** Disables the FloatingCoinsBackground
   animation; Maestro waits for animations to settle after each tap, so without
   this every tap costs ~14s extra. The runner scripts set it, but set it in the
   shell too.
4. **Pick the device deliberately.** The booted sim is an **iPad**; the flows were
   authored/tuned for **iPhone**. Running iPhone-first flows on iPad produces
   form-factor false-failures (see §4). For a clean regression signal, build+run
   on an iPhone sim.

## 1. Which runner to use

- **`run-flow.sh`** — entry-point-aware. Reads each flow's `# x-entrypoint:`
  (fresh/demo/wizard) and sets up the right state, caching it in
  `/tmp/maestro-entry-state` so consecutive same-entry flows skip re-setup.
  **Use this for anything involving `demo` flows.** Accepts many flows at once;
  pass them **sorted by entry-point** so each group is set up once.
- **`full-regression.sh`** — runs ONE wizard (Director-only) state then every flow
  in order via bare `maestro test`. **It ignores `x-entrypoint`, so it cannot run
  the 58 `demo` flows** (they never get demo seeding). See `PROPOSED-CHANGES`
  below / the findings doc. Good only for the wizard-entrypoint subset today.

## 2. State setup gotchas

- `fresh-install.sh --reset-only` deletes the DB but **exits before relaunching**,
  so the app keeps stale in-memory state; a following `launchApp` just foregrounds
  it. Force a cold start: `simctl terminate booted mx.cachink.mobile` +
  `simctl openurl booted "exp+cachink://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`
  - terminate again. (`run-flow.sh`'s demo setup now does this.)
- **Demo seeding takes 3–5 min** (bcrypt on Hermes, debug build). Seed-wait
  timeouts must be ≥360s. `demo-mode-setup.yaml` waits on "Selecciona tu usuario".
- **Maestro XCUITest driver** (`127.0.0.1:7001`) can disconnect under heavy seed
  CPU load. If you see `ConnectException: 127.0.0.1:7001`, do a clean restart:
  `pkill -9 -f maestro; sleep 3` then re-run. **Do not `pkill` mid-run** — it
  leaves the driver in a bad state for the next run.

## 3. Triage discipline (bug vs test issue)

- **Read the failure screenshot first** (`e2e-reports/runs/<id>/tests/<flow>/screenshot.png`).
  App rendering correctly = test issue. Red screen / crash / wrong data = app bug.
- **Flaky ≠ bug.** If a flow passes in one run and fails in another, it's test
  flakiness (timing/state), not a regression. Re-run before believing a red.
- **Retry wrappers hide the truth.** `fresh-install.sh` retries a flow up to 10×
  **without resetting state between attempts**, so attempts 2–10 fail on polluted
  state and mask attempt 1's real failure. Always read attempt 1 / run the flow
  once directly with `maestro test <flow>`.
- On failure, `run-flow.sh` writes `result.json` + `hierarchy.json` +
  `screenshot.png` + `report.md` per flow (see CLAUDE.md §12 for the read order).

## 4. App facts that explain most "failures"

- **Roles gate the tab bar.** Director sees home/ventas/estados/otros — **no
  `tab-productos` / `tab-gastos`** (those are Operativo-only capture tabs). Flows
  that tap those tabs must be logged in as **Operativo**.
- **Only demo mode seeds an Operativo user.** Wizard setup creates **Director
  Test only**; demo mode seeds **Ana Operativa (Operativo) + Juan Director** +
  ~50 records. So any productos/egresos capture flow needs the `demo` entrypoint.
- **Demo product is `"Tortilla maíz kg"`** — alphabetically near the end of the
  Stock list, so it's **below the fold** on iPad. Assert/tap it via the search box
  or `scrollUntilVisible`, not a bare `assertVisible`.
- **BusinessForm submits via keyboard** (nombre `Return`→focus ISR, ISR
  `Return`→submit) and has **no KeyboardAvoidingView**, so on iPad the submit
  button hides behind the keyboard — tap-by-coords misses it. Use the keyboard
  submit, or dismiss the keyboard first.
- **iPad layout differs**: `stock-fab` (FAB) is a `+ Nuevo Producto` button on
  iPad; productos sub-tabs (`productos-tab-movimientos`) are positioned
  differently. iPhone-authored selectors miss.

## 5. Fast path to run a slice cleanly

```bash
export EXPO_PUBLIC_E2E=1
# one demo flow, entrypoint-aware (seeds demo once, ~5 min first time):
./scripts/run-flow.sh flows/venta-efectivo.yaml
# many flows, sorted by entrypoint so each group seeds once:
./scripts/run-flow.sh $(grep -l 'x-entrypoint: demo' flows/*.yaml)   # all demo flows
```

See `docs/e2e-mvp-code-changes-2026-07-09.md` for the full findings + fixes from
the 2026-07-09 session.
