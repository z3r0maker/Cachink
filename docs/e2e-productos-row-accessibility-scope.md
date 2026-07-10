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
- **`movimiento-salida-con-motivo.yaml`** — selectors updated (find + `text: "Salida.*"`
  - motivo dropdown select + `text: "REGISTRAR.*"`); **not yet green** — blocked on
    the CANTIDAD wheel-picker (below).

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
