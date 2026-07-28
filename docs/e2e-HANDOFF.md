# E2E Maestro — Handoff (start here)

> **Next LLM: read this first, then the two detail docs it points to.** This is the
> single entry point for continuing the Maestro E2E debug/fix work.

## The goal (governs everything)

Run the Maestro E2E suite for the **MVP scope**. If a flow fails, fix the _real_ cause.
**Do NOT force a flow to pass over a genuine code bug or an unexpected/superseded
scenario** — instead fix the code (and write the change up in an md) or document the
finding. Ask before big/ambiguous decisions.

## Where we are (branch `claude/e2e-maestro-harness`, PR #6)

**Productos item flows: 10/10 green on iPad** — `producto-entrada-stock`,
`eliminar-producto`, `editar-producto`, `producto-movimientos`,
`movimiento-entrada-con-nota`, `editar-producto-full-form`, `inventario-salida`,
`movimiento-salida-con-motivo`, `producto-via-fab`, `stock-bajo-ver-link`.

**Two app fixes shipped (verified, typecheck+lint clean):**

1. `packages/ui/src/screens/Productos/producto-detail-screen.tsx` — the `detail-save`
   GUARDAR button was a Tamagui `<Btn>` (merged a11y element) that never received
   Maestro taps in that header; rendered it as a raw `<Pressable>` (`DetailSaveButton`).
2. `packages/ui/src/screens/Login/quick-switch-screen.tsx` — login top-aligns on phones
   (`media.gtMd ? 'center' : 'flex-start'`) so the PIN numpad is reachable on iPhone.

**iPhone E2E is enabled** — built iPhone 17 dev-client, seeded demo, and auth +
`ensure-caja-open` + `create-venta` all run green on iPhone (a sale registers).

## What's left / the ONE open decision

**The 5 ventas item flows target a UI that no longer exists.** `total-bar.tsx` says
_"TotalBar … replaces SessionStrip"_; `ventas-screen.tsx` (`PhoneLayout` +
`TabletLayout`) renders `ProductPane` + `CartSection` + `TotalBar` — **neither renders
`ventas-list`/`VentaCard`/`venta-detail-popover`**. The popover (`VentaDetailPopover`,
still wired in `apps/mobile/src/shell/ventas-slots.tsx`) now only surfaces from
**Director Home → `actividad-reciente`** (`DirectorHome/actividad-reciente.tsx`,
`onVentaPress`).

Flows affected: `venta-detail-popover-inspect`, `venta-comprobante`, `eliminar-venta`,
`editar-venta`, `editar-venta-full-form`.

**→ PRODUCT DECISION NEEDED (ask the user):** were the venta share/delete/edit
affordances intentionally removed, or should these flows be re-scoped to the
Director-Home recent-activity → popover path? Do NOT force-pass them.

Also deferred (lower priority, plan phases 4/5/6): empty-state entrypoints
(`operativo-empty`), full device-class matrix runs, testID stability audit.

## How to resume (environment + commands)

Repo: `~/Downloads/Cachink` (built in place). pnpm monorepo, Tamagui, RN 0.83.9 New
Arch (Fabric). Sims usually booted: **iPad Pro 13-inch (M5)**
`CC1DFB58-11A0-43BD-9CAA-64B7431EEF2E`, **iPhone 17**
`4C5FA73E-F0D9-41A4-A058-511EE3F807AE`.

```bash
# Metro (needs EXPO_PUBLIC_E2E=1; serves both sims on :8081)
cd apps/mobile && EXPO_PUBLIC_E2E=1 npx expo start --dev-client
# iPhone build (if the app isn't installed on iPhone): ~75s (pods cached)
cd apps/mobile && EXPO_PUBLIC_E2E=1 npx expo run:ios --device "iPhone 17"

# Seed demo on a fresh sim (empty DB): ~5 min
maestro --udid=<UDID> test apps/mobile/maestro/flows/demo-mode-setup.yaml

# Run one flow (terminate first = cold start = fresh Metro bundle for app edits):
xcrun simctl terminate <UDID> mx.cachink.mobile
maestro --udid=<UDID> test apps/mobile/maestro/flows/<flow>.yaml
```

## Gotchas that cost hours (avoid repeating)

- **Expo dev-menu confound:** the floating "Tools button" opens a modal that covers
  elements → `assertNotVisible` passes for the wrong reason. **Disable "Tools button" +
  "Fast refresh"** in the dev menu; verify ambiguous pass/fail with an actual screenshot
  (`xcrun simctl io <UDID> screenshot /tmp/x.png` then Read it).
- **Selectors (iOS Fabric):** `text:` is an ANCHORED regex → use `text: "<label>.*"`.
  Tamagui onPress cards/buttons expose merged `accessibilityText`, NOT `testID`, so
  match rows/detail-buttons/modal-submit by `text: "<label>.*"`; containers/tabs/inputs
  by `id:`. A `<Btn>` in an overlap context may not receive taps → use a raw Pressable.
- **`macOS has no `timeout`** — use a bash `while pgrep -f <flow>; do sleep 4; done` loop.
- **Driver:** `pkill -9 -f maestro` kills Maestro's XCUITest driver → next run
  `Connection refused :7001`; recover with `pkill -9 -f maestro; pkill -9 -f XCTRunner;
pkill -9 -f xctest; sleep 3` then re-run.
- **Demo mutations:** `editar-*` flows rename the demo product; `create`/`salida` flows
  mutate stock. Order late or reset demo if a later flow asserts original values.

## Detailed docs (read these next)

- `docs/e2e-productos-row-accessibility-scope.md` — the full investigation log: the
  detail-save fix, dev-menu confound, salida wheel/motivo ordering, stock-bajo location,
  iPhone login layout, and the ventas superseded-UI finding (with evidence).
- `docs/e2e-mvp-code-changes-2026-07-09.md` — every app-code change with problem + why.
- `apps/mobile/maestro/E2E-SESSION-NOTES.md` — operator runbook.
- Claude auto-memory `cachink-e2e-maestro.md` — condensed rules + all findings (loads
  automatically for the next Claude Code session in this project).
