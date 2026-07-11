# RESOLVED — productos/ventas item interaction under Maestro

The original "FlatList accessibility" framing was wrong on every count. After a
full diagnostic (drive the app + `maestro hierarchy` + a `console.log` in the
press handler), the productos interaction **works end-to-end with the right
selectors — no app change needed.** Verified green:

```
tap product (text regex) → detail route opens → tap "Entrada" (text regex)
→ movimiento modal (CANTIDAD / MOTIVO / NOTA / "Registrar entrada")   EXIT 0
```

## What was actually wrong (three flow-side issues, zero app bugs)

1. **Maestro `text:` is an anchored regex.** The row/button is one accessibility
   element whose `accessibilityText` is a merged string
   (`"Tortilla maíz kg, Materia Prima, kg, 25, $22.00"`). `text: "Tortilla"` fails;
   **`text: "Tortilla maíz kg.*"` matches.**
2. **Flows used wrong / non-exposed testIDs.** The live row is
   `Inventario/ProductoCard` (testID `producto-card-<id>`), not the **dead**
   `Productos/ProductoListRow` (`producto-row-<id>`). And Tamagui `onPress` cards
   with rich children expose the merged `accessibilityText` but **not** their
   `testID` as a resourceId — so `producto-detail-popover`, `producto-detail-entrada`,
   etc. never match. Match by `text: "<label>.*"` instead.
3. **Tap + navigation were never broken.** `onPress` fires (confirmed via a
   `console.log`), `router.push('/productos/[id]')` navigates (stock list
   disappears), and the detail + movimiento modal render. My earlier "tap doesn't
   fire" conclusion was an artifact of asserting the wrong post-nav testID.

## The fix — flows only (no app change)

Update the ~15 productos/ventas item flows to select by **`accessibilityText`
regex** instead of testIDs, for both the product row and the detail/modal buttons:

```yaml
# find + open a product
- tapOn: { id: 'tab-productos' }
- tapOn: { id: 'stock-buscar' }
- inputText: 'Tortilla'
- hideKeyboard # keyboard-up first tap only dismisses it
- tapOn: { text: 'Tortilla maíz kg.*' } # or: { id: "producto-card-.*" }
# on the detail screen
- assertVisible: { text: 'Entrada.*' }
- tapOn: { text: 'Entrada.*' }
# movimiento modal: CANTIDAD / MOTIVO / NOTA / "Registrar entrada" — all text-regex
```

Rules of thumb for this app under Maestro/iOS Fabric:

- **Containers/inputs/tabs/numpad**: match by `id:` (their testIDs _are_ exposed).
- **`onPress` cards & buttons with child text** (rows, detail actions, list items):
  match by **`text: "<label>.*"`** (their testID is NOT exposed; the merged
  accessibilityText is). Use `childOf:` to disambiguate from search-box text.

## Optional app improvements (not required for E2E)

- If testID-based selectors are wanted for these cards, expose the `testID` as the
  merged element's identifier (Tamagui/Fabric-specific) — nontrivial, low value now.
- **Delete the dead `screens/Productos/` duplicate** (`stock-screen.tsx` +
  `producto-list-row.tsx`); `@cachink/ui` ships the `Inventario/` one. This
  duplication cost real time here (edited dead code). CLAUDE.md §2.3. Add to ROADMAP.

## Effort

Flow updates only: ~0.5 day for the ~15 productos/ventas item flows, zero app
risk. Verify on iPhone + iPad. (Dead-code cleanup: separate ~0.5 day.)

---

## Applied & verified (2026-07-10)

**Done:**

- **Dead code deleted:** `screens/Productos/{stock-screen,producto-list-row}.tsx` +
  their exports (`screens/index.ts`, `Productos/index.ts`). Typecheck 0,
  `stock-screen` tests 15/15 pass.
- **`shared/find-producto-stock.yaml`** (new): tab-productos → `stock-buscar` →
  `inputText "Tortilla"` → assert `id: producto-card-.*` → `hideKeyboard`. Caller
  opens the detail with `tapOn { id: "producto-card-.*" }`.
- **`producto-entrada-stock.yaml`** — ✅ verified green end-to-end.
- **`eliminar-producto.yaml`** — ✅ verified green (detail → `text: "Eliminar producto.*"`
  → `confirm-dialog` / `confirm-dialog-confirm` by id).
- **`movimiento-salida-con-motivo.yaml`** — ✅ green. Pick the MOTIVO dropdown FIRST,
  then commit CANTIDAD last: changing the motivo re-renders the form and drops an
  uncommitted wheel value. (The earlier "wheel not committed" was this ordering plus
  the Expo dev-menu confound, not an app bug.)
- **`inventario-salida.yaml`** — ✅ green (salida, default cantidad, text-regex Salida/REGISTRAR).

**Verified selector rules for this app (Maestro / iOS Fabric):**

- **By `id:`** — containers, tabs, numpad, text inputs (`stock-buscar`,
  `movimiento-cantidad`, `movimiento-motivo` for _entrada_), the row testID via the
  `producto-card-.*` regex, modal containers, and _some_ buttons
  (`confirm-dialog-confirm`).
- **By `text: "<label>.*"` (anchored regex!)** — Tamagui `onPress` cards/buttons with
  child text: product rows, the detail actions (`Entrada`/`Salida`/`Eliminar producto`),
  and the modal submit (`REGISTRAR`). Their `testID` is NOT exposed as a resourceId;
  the merged `accessibilityText` is. Use `childOf:` to disambiguate from the search box.

**Per-flow gotchas discovered (apply when updating the rest):**

- **CANTIDAD** in the MovimientoModal is a **scroll-wheel picker**, not a plain input.
  `inputText` sets it for _entrada_ but the wheel can stay at its default for
  _salida_; needs a wheel-scroll/select, or a value that commits. (Open item on
  movimiento-salida.)
- **MOTIVO** is a **text input for entrada** but a **dropdown for salida** (options:
  Venta / Uso en producción / Merma-daño / Muestra / Ajuste de inventario / Otro) —
  open it (`tapOn id: movimiento-motivo`) then `tapOn text: "Merma.*"`.
- After typing into a text input, the **keyboard covers the bottom submit button** —
  `hideKeyboard` (flaky) or dismiss before tapping `REGISTRAR`.
- Submit button is **"REGISTRAR"** (uppercase); the modal **title** is
  "Registrar entrada/salida" — `text: "REGISTRAR.*"` hits the button, not the title.

**Remaining (~12 flows):** apply `find-producto-stock` + the selector rules above,
handling each flow's modal quirks (picker/dropdown/keyboard). The ventas/egresos
item flows follow the same principles but via their own panes.

---

## CONFIRMED APP-INTERACTION DEFECT (2026-07-10): `detail-save` (GUARDAR) Btn not tappable by Maestro

While converting `editar-producto` to the modern detail-route edit path (tap product
card → `ProductoDetailScreen` form → GUARDAR), the save step could not be driven.
After a rigorous isolation (hot-reload verified working by changing the button label
to "GUARDARX" and seeing it render), the cause is **not** a selector or validation
issue — it is a genuine interaction defect:

- **`detail-save` (a Tamagui `Btn` in `DetailTopBar`, top-right of the detail header)
  does not fire its `onPress` under Maestro/XCUITest** — for BOTH `id: detail-save`
  and `text` taps. Maestro reports "Tap … COMPLETED" but nothing happens.
- **Proven it is the tap, not downstream logic:** temporarily wiring the button's
  `onPress` directly to `router.back()` (no mutation, no validate) STILL did nothing.
- **`router.back()` works and raw `<Pressable>` taps work:** the ADJACENT
  `detail-back` chevron (a raw RN `<Pressable>` in the same header row, same
  `router.back()`) fires correctly and returns to the stock list (verified green in a
  throwaway `_detail-back-test` flow).
- **`validate()` is not the cause:** bypassing it did not change the outcome.
- **The same `Btn` primitive works elsewhere:** the MovimientoModal `REGISTRAR`
  (entrada, green) is a `Btn` and fires fine. The discriminator is the **header
  layout context** (`DetailTopBar`: raw-Pressable sibling on the left works, `Btn` on
  the right does not), NOT the `Btn` component in general.

**Why this matters (suite-wide risk):** any `Btn` placed in this kind of header row
(a `flexDirection:"row"` with a `flex:1` centered title `<Text>` between a left action
and a right `Btn`) may be untappable by Maestro. Other screens using the same header
shape should be audited (e.g. any detail/edit screen with a top-right save action).

### ✅ RESOLVED — the fix (2026-07-10)

Rendered `detail-save` as a **raw `<Pressable>`** instead of the shared `<Btn>` in
`DetailTopBar` (`producto-detail-screen.tsx`). `<Btn>` sets `accessibilityRole="button"`

- `accessibilityLabel`, so RN collapses it into one **merged a11y element**; in this
  header that merged element was not reliably tappable by Maestro/XCUITest (onPress never
  fired). A raw `<Pressable>` takes the native coordinate touch directly and fires
  reliably. **`editar-producto` now runs green end-to-end** (find → detail form → edit
  NOMBRE → GUARDAR → re-search asserts the rename "Tortilla de maíz"; verified by
  screenshot). Typecheck clean; the same `<Btn>` is unchanged everywhere else.

Things that did NOT fix it (tried and reverted — the overlap theory was a red herring,
since the adjacent raw-Pressable `detail-back` shares the exact same overlap yet works):
`pointerEvents="none"` on the title, `zIndex`+bg on the header, `minHeight` on the
header, `contentInsetAdjustmentBehavior="never"` / `automaticallyAdjustContentInsets`
on the ScrollView.

### ⚠️ Test-harness confound discovered: the Expo dev menu (cost hours)

Mid-investigation, many runs gave **false results** because the Expo dev-client **Tools
menu** (the floating "Tools button" bubble → Reload / Fast refresh / …) kept opening as
a modal over the screen. It covered `detail-save`, so `assertNotVisible id: detail-save`
passed for the WRONG reason (obscured, not navigated). **Disable "Tools button" AND
"Fast refresh" in the dev menu before running** (or build a non-dev client for E2E).
Verify ambiguous pass/fail with an actual screenshot (`xcrun simctl io <udid> screenshot`),
not just the assertion. Fast Refresh can also reload mid-run and disrupt state.

**Still a suite-wide note:** any `<Btn>` used as the sole action in a similar
header/overlap context may be untappable by Maestro; prefer a raw `<Pressable>` (or audit
per screen) for such buttons. The `<Btn>` works fine in modals and normal layouts.

---

## Ventas item flows — iPhone-only on the current app (2026-07-10)

The ventas item flows (`venta-detail-popover-inspect`, `venta-comprobante`,
`eliminar-venta`, `editar-venta`, `editar-venta-full-form`) interact with a sale via
the **sales-history pane** (`ventas-list` → `venta-detail-popover` with Compartir /
Eliminar, and swipe-left to edit). Two structural facts block them on the iPad sim:

1. **Ventas is gated behind an open caja turn.** Demo seeds sales but no open turn, so
   the tab shows "Abre tu caja para empezar a vender". Prepend
   `shared/ensure-caja-open.yaml`.
2. **Seeded sales are past-dated and the sales pane shows today's sales**, so you must
   first create a sale via the POS. Added `shared/create-venta.yaml` (product → cart →
   checkout → Efectivo $50 → submit).
3. **The sales-history pane renders ONLY on the narrow (iPhone) layout.** On iPad
   (`gtMd`) `VentasScreen` is a SplitPane: products on the left, **cart** on the right —
   there is no `ventas-list`/popover. So even after creating a sale, the popover is
   unreachable on iPad.

**Status:** `venta-detail-popover-inspect` and `eliminar-venta` are rewired to the
correct pattern (demo → ensure-caja-open → create-venta → tap the sale → popover) and
carry an iPhone-only `TODO(e2e)`. They reach checkout green on iPad but stop at
`ventas-list` (absent in the iPad layout). **To finish/verify the ventas item flows,
run `--device-class iphone` (needs the iPhone dev-client build — plan Phase 0), or add
the sales pane to the iPad layout (Phase 4).** `venta-comprobante`, `editar-venta`,
`editar-venta-full-form` follow the same pattern (comprobante via `venta-detail-share`;
edit via swipe-left → `editar-venta-modal`) and are pending the same iPhone run.

---

## iPhone build + ventas verification — 2026-07-10 (Phase 0 progress)

Built the iPhone dev-client (`expo run:ios --device "iPhone 17"`, ~75s, pods cached) and
seeded demo on it (`demo-mode-setup.yaml`, ~5min). Two device-layout issues surfaced,
one fixed, one still open:

1. **Login numpad off-screen on iPhone 17 (blocks ALL iPhone auth).** The
   QuickSwitchScreen ScrollView used `justifyContent: 'center'`; on a 874pt-tall screen
   the greeting + avatars + PIN numpad total ~974pt, so `center` clipped the numpad's
   bottom row (`numpad-0`, delete) below the fold AND out of the scrollable range
   (`numpad-0` isn't even in the hierarchy — bounds ~902–974 vs screen 874).
   - **Partial fix applied:** `quick-switch-screen.tsx` now top-aligns on phones
     (`justifyContent: media.gtMd ? 'center' : 'flex-start'`) so the content is
     scrollable rather than clipped (iPad unchanged — verified `producto-entrada-stock`
     still green). `shared/authenticate.yaml` waits for `numpad-0` before the PIN taps.
   - **STILL OPEN:** the content is ~100pt too tall for iPhone 17, so `numpad-0`
     remains below the fold and Maestro's scroll can't reliably bring it into view
     (the numpad captures the swipe). Needs phone-specific login layout tuning (smaller
     header/avatars/numpad or a fixed numpad footer) OR a reliable scroll gesture.

2. **Ventas sales pane is iPhone-only (confirmed earlier).** Once iPhone auth is
   unblocked, the 5 ventas flows should run: `ensure-caja-open` + `create-venta` +
   the popover pattern are all built and the narrow layout DOES render `ventas-list`.

**Net:** iPad = 10/10 productos item flows green. iPhone ventas verification is one
bounded login-layout fix away.
