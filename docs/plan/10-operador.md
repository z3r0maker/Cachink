# Track O — Operator view (the browser register) and its owner-side close

> **Origin:** the second design handoff (`design_handoff_operador/` in Claude Design project
> `5dd266f3-42e7-403f-b941-95c8e6551dc6`): fifteen screens, thirteen for the Operativo role and two
> for the owner, plus `Operador Estado` (the shared four-state component). The implementation plan
> in that project (`Xangarro Portal - Plan de implementacion.dc.html`, v3) numbers them **fases 10
> to 13**; this track keeps that numbering.
>
> **Read first:** ADR-071 (the browser register is a device), ADR-072 (NIP and activation code),
> ADR-073 (ticket entity), ADR-074 (receivables and expected cash), ADR-075 (operator messages).
> Each was settled one question at a time in the operator-plan interview of 2026-09-17.
>
> Status rules, Done lines and "never renumber" are those of `00-README.md` §3. Contract changes are
> `C-` tasks in `02-contracts.md` (C-16 … C-19 were added for this track) and land on `main` first.

---

## 1. Decision summary

| #   | Topic             | Decision                                                                                                                                                                   | ADR |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | Web capture       | The linked browser is a **device**: activates like a phone, own outbox, writes only via `/sync/push`. ADR-058 §2 stands. Supersedes Track N row 20.                        | 071 |
| 2   | NIP length        | **Four digits** everywhere (domain, contract, phone, portal).                                                                                                              | 072 |
| 3   | Activation code   | **Eight characters, unchanged.** Access design amended upstream: 8 boxes, text input instead of the numeric keypad, a valid example code.                                  | 072 |
| 4   | Who changes a NIP | **Only the owner**, from the portal. Phone recovery and change-PIN flows removed (they never synced: `users` is DOWN). `recoveryPasswordHash` deprecated in place.         | 072 |
| 5   | Register ↔ device | **One to one.** «Caja 1» is `devices.nombre`. One open turno per device, enforced locally.                                                                                 | 071 |
| 6   | Sale shape        | **Ticket header entity** (folio, method, client, tendered, change, cancellation, turno); `sales` become lines. Folio = per-device counter. Atomic register/cancel.         | 073 |
| 7   | Browser storage   | **SQLite-WASM in OPFS** in a Worker, reusing `@xangarro/data`, use cases and the outbox. Spike first; stop and ask if it fails.                                            | 071 |
| 8   | Operator notices  | `mensajes_operador` (DOWN) + `respuestas_operador` (UP); read state device-only; «De tu caja» derived locally; `notices` untouched.                                        | 075 |
| —   | Receivables       | Abonos belong to the client; FIFO application, balance and saldo a favor are derived in `packages/domain`. Clients gain limit + plazo; review status for «creado en caja». | 074 |
| —   | Expected cash     | One per-turno calculator (`fondo + efectivo + abonos en efectivo − gastos de caja`), used by `CerrarCajaUseCase`. Expenses gain `cajaTurnoId`. Denominations as JSON.      | 074 |

**Deferred to the phase that needs them (ask before starting that phase):** the five close-out
reasons vs the existing six-value `caja_turnos` enum (fase 12); expense receipt photo storage
(fase 12); what «marcar como aclarado» writes (fase 13).

---

## 2. Working rules (from the handoff; binding on every task here)

- `design-reference/` is the specification and is never edited. One screen per task; the next
  screen does not start until the previous one is closed.
- Open the design file in the browser, walk it top to bottom, and reproduce it taking every value
  from the file. The control panel (top right) forces the states to implement.
- Before reporting a screen: capture ours and the design's at the same width, compare, fix.
- If a README rule collides with existing code: stop and ask.
- Screens are presentational (`{ state, data }`); containers fetch (ADR-058 §9).
- Every new entity passes the CLAUDE.md §11 checklist; every migration has an old → new test.

---

## 3. Fase 10 — Groundwork (10a)

### O-01 Mirror the design into `/design-reference/` with `pnpm design:pull`

- [x] Status · **Blocked by:** — · **Blocks:** every screen task · **Overlaps:** P-18 steps 3–5
  - Done: 2026-09-17 · uncommitted · the 21 files of `design_handoff_operador/` + `_ds/` + `doc-page.js`
    mirrored byte-for-byte into `design-reference/operador/` via the Claude Design MCP; all 17 `.dc.html`
    render at 1440 px (`.claude/launch.json` → `design-operador`, port 4300). ESLint now ignores
    `design-reference/**` (Prettier already did; `design-lint` never scanned it). **Deviation:** no
    `pnpm design:pull` script — the design API needs the MCP's authorization, which a repo script
    lacks; refreshing is a manual MCP pull, recorded in `design-reference/README.md`. P-18's script stays open.
- **Steps:** `scripts/design-pull.ts` + `pnpm design:pull` pulling both handoffs, `_ds/`, and the
  runtime (`support.js`, `doc-page.js`, `image-slot.js`, `_ds_bundle.js`) into `/design-reference/`
  (owner screens at the root per P-18, operator screens under `operador/`). Exclusions in
  `.prettierignore`, ESLint ignores and `design-lint`'s `ROOTS`. `/design-reference/README.md`
  states read-only.
- **Acceptance:** every operator `.dc.html` opens and renders locally; lint, format and
  `lint:design` unaffected.

### O-02 Recover `packages/sync/src`; SQLite-WASM spike

> **Reordered 2026-09-17 (owner, question 9):** O-10 and O-11 run first on fixtures; O-02 waits for
> `track/app` to land on `main`, because `packages/sync/src` exists only on that unmerged track.

- [ ] Status · **Blocked by:** — · **Blocks:** O-05, O-06
- **Steps:** restore `packages/sync/src` from the branch that has it (see `git log --all -- packages/sync/src`), make
  it build and pass its tests on this checkout. Spike: a Worker running
  SQLite-WASM on OPFS, the `@xangarro/data` migrations applied, one repository round-trip and one
  change-log row, in Chromium and WebKit via Playwright.
- **Acceptance:** spike green in both engines, bundle cost measured and recorded here. **If the
  Drizzle driver does not run on WASM, stop and ask the owner** (ADR-071 §4).

### O-03 Expected-cash calculator, one per turno

- [ ] Status · **Blocked by:** C-18 · **Blocks:** O-15, fase 12 Cierre
- **Steps:** TDD in `packages/domain`: `fondo + ventas en efectivo + abonos en efectivo −
gastos de caja`, scoped by `cajaTurnoId`, fiado excluded. `CerrarCajaUseCase` uses it instead of its
  date-range sum. Happy path + 3 unhappy.
- **Acceptance:** the handoff's figures reproduce exactly: fondo $800.00 + $2,140.00 + $550.00 −
  $620.00 = **$2,870.00**.

### O-04 Owner creates operators and resets NIPs (completes P-05)

- [ ] Status · **Blocked by:** C-16 · **Blocks:** O-12
- **Steps:** «Nuevo operador» (nombre, NIP 4 masked + confirm) and «Reiniciar NIP» in `/equipo`,
  writing `users` through the application use case with its `sync_log` append (ADR-062). Remove the
  phone's recovery screen and change-PIN flow (ADR-072).
- **Acceptance:** server-action tests; the new hash appears in `/sync/pull`.

### O-05 Real `/sync/push` and `/sync/pull` (B-08, B-09)

- [ ] Status · **Blocked by:** O-02, C-16 … C-19 · **Blocks:** O-06
- **Steps:** as specified in B-08/B-09, now also serving `plataforma = web` devices.
- **Acceptance:** B-08/B-09 acceptance, plus a browser device round-trip in Playwright.

### O-06 Register runtime: device token, Worker, outbox flusher

- [ ] Status · **Blocked by:** O-02, O-05 · **Blocks:** O-12 … O-16
- **Steps:** register route group in `apps/portal` (device-token auth, no owner cookie), the SQLite
  Worker, `navigator.storage.persist()`, push/pull loop with retry, connection state for the header.
- **Acceptance:** a sale captured offline is pushed on reconnect exactly once.

---

## 4. Fase 10 — Screens (10b), one at a time

Each task: design file, all states from its control panel, side-by-side capture at the same width
before reporting, Maestro/Playwright flow for the happy path.

### O-10 `Operador Estado` — the four shared states

- [x] Status · **Blocked by:** O-01 · **Blocks:** O-11 … O-16
  - Done: 2026-09-17 · uncommitted · `apps/portal/src/operador/estado.tsx` + `.css.ts`, previewed at
    `/inventario/operador?mode=loading|empty|error[&cta=1]`. Compared at 640 px against the design
    forced through the runtime's `__dcSetProps` (the editor's control panel is not in the standalone
    runtime): every box, font, colour, radius and shadow matches in all four variants. Deviations:
    tile radius 16 (file: 17, ADR-076). Finding for every later screen: the design sizes fixed
    boxes **content-box** (62 px + 2.5 px borders renders 67 px) except native `<button>`s, which
    are border-box; the portal's reset is border-box, so fixed-size non-button boxes restore
    `content-box`. Playwright coverage lands with the first screen that uses it (O-14).
- **States:** happy · cargando (pulsing yellow dot + five `--gray-100` skeleton rows, no shimmer) ·
  vacío (62 px icon box, title, body, optional action) · error («Lo que capturaste no se pierde…»,
  Reintentar).

### O-11 Operator shell

- [x] Status · **Blocked by:** O-10 · **Blocks:** O-12 … O-16
  - Done: 2026-09-17 · `apps/portal/src/operador/shell/*`, `/operador` layout + catch-all for screens not
    built yet (empty content area; unknown path → 404). Measured against Turno at 1440 px and Inicio at
    375 px: sidebar, header and phone bar match element by element (content-box, see O-10). Gate
    verified in the browser and pinned by `e2e/operador-shell.spec.ts` (sidebar is the same node and
    rect across the seven destinations; active item follows the route). Decisions and deviations:
    the design files disagree on the shell, so the README's version is built everywhere — bell
    always shown, per-screen yellow action through `HeaderAction`, footer with lock + «Cerrar turno»
    (the lock button is hidden until O-13 gives it a screen: no dead buttons); tab bar order is the
    README's (Inicio · Caja · Ventas · Turno). `portalFontSizes.tag = 11` added (the design system's
    `.t-tag`). Dev-only `?connection=sin-conexion` forces the offline header.
- **Scope:** 248 px sidebar (Inicio · Caja · Turno · Ventas · Gastos · Inventario · Cobranza), turno
  block with lock and «Cerrar turno», 76 px header with sync indicator and bell, phone bar
  (< 760 px: Inicio · Caja · Ventas · Turno), `connection: sin-conexion` indicator.

### O-12 Operador · Acceso (vincular → NIP → fondo)

- [!] Status · **Blocked by:** O-04, O-06, **the ADR-072 design amendment landing upstream**
- **Gate contribution:** the turno does not open without a captured fondo.

### O-13 Register lock and operator switch

- [ ] Status · **Blocked by:** O-12
- **Gate:** two operators alternate on one register without losing the ticket in progress.

### O-14 Operador · Inicio

- [x] Status · **Blocked by:** O-11, O-03
  - Done: 2026-09-17 · presentational `InicioScreen` over the design fixture (`src/operador/inicio/`),
    shared pieces in `src/operador/ui/` (OpMain, KpiRow, ListCard, TintBox). Compared with the
    same-origin harness (dev symlink `public/__design` + `public/__cmp.js`, both gitignored) in every
    control-panel state — four situaciones, sin-conexion, loading, empty, error — at 1440 and
    375 px: 96/96 elements, 0 differences except the agreed 16-vs-17 radius (ADR-076). Playwright:
    `e2e/operador-inicio.spec.ts`. **For the design project:** (a) the README says each «Para hoy»
    row has «Hoy no», the file has none — built as the file; (b) undesigned copy is left blank
    rather than invented: no cancellation / several cancellations in the first KPI, and a last
    turno that did not balance (shows the signed amount). Live data waits for O-03/O-06.
- **States:** vendiendo · turno-cerrado · hora-de-cerrar · corte-por-aclarar · sin-conexion · four
  data states.

### O-15 Operador · Turno

- [x] Status · **Blocked by:** O-11, O-03
  - Done: 2026-09-17 · `src/operador/turno/`, `/operador/turno`. Harness comparison at 1440 (happy,
    loading, empty, error) and 375 px: 115/115 elements, 0 differences but the agreed 16-vs-17
    radius. The hero's translucent row rule became the solid `colors.yellowRule` (ADR-077,
    question 11 — recommended option taken on «continue»). «Hoy no» is device-local state.
    «Nueva venta» renders through the shell's `HeaderAction`. Invented copy flagged for the design
    project: «Vence en N días» for dues beyond tomorrow. Playwright: `e2e/operador-turno.spec.ts`.
- **States:** con datos · pendientes recurrentes · sin conexión.

### O-16 Operador · Avisos

- [x] Status · **Blocked by:** O-11, C-19
  - Done: 2026-09-17 · `src/operador/avisos/`, `/operador/avisos`. Harness comparison — both tabs,
    loading, empty, error, 375 px and the header — 0 differences but the agreed radius. The shell
    header now takes its per-route variant from `headerFor()` (back link on detail screens; sync
    pill static on Pendientes/Cierre; no status on Avisos and the details), server-rendered.
    Read marks and replies are device-local until C-19. Shared `Toast` in `src/operador/ui`.
    Playwright: `e2e/operador-avisos.spec.ts`.
- **States:** De Pedro · De tu caja · respuesta al corte · leído · four data states.

**Fase 10 gate:** two operators alternate on the same register without losing the ticket, and the
turno does not open without a fondo.

---

## 4b. Upstream design amendments (Claude Design first, then pull — ADR-058)

Collected while building fase 10; none is edited in `design-reference/`.

1. **Acceso** (ADR-072): 8 code boxes instead of 6; a text input (uppercased, spaces/hyphens
   ignored) instead of the numeric keypad; an example code from the contract alphabet
   (`K7M3 DQ9P`), not `TD4 91K`. Blocks O-12.
2. **Radii 15 and 17 → 16** (ADR-076): `Operador Estado` (62 px tile), Inicio and Detalle de
   cliente (52 px tiles), Revisión de caja.
3. **Turno / Cierre** divider: document `yellowRule` (#DBB80A) instead of `rgba(13,13,13,0.15)`
   (ADR-077).
4. **Shell consistency:** the files disagree on the sidebar footer (lock + «Cerrar turno» only in
   Caja) and on the bell (only Inicio). Code follows the README on main screens; the files should
   match it.
5. **Inicio «Para hoy»:** the README promises «Hoy no» on each row; the file has none.
6. **Turno «Pendientes de registrar» at 760–1000 px:** the row squeezes the expense name to zero
   width (same in the file). Needs a wrap rule.
7. **Undesigned copy** (left blank in code, never invented): Inicio/Turno first KPI with zero or
   several cancellations; Inicio «Cerró» for a last turno that did not balance; Turno «Gastos» hint
   with zero or several receipts. Invented and awaiting wording: «Vence en N días» (dues beyond
   tomorrow).
8. **Detalle de venta:** V-0412 is $160.00 (3 pastor, 1 gringa, 1 horchata) here and $320.00
   («8 pastor · 2 gringa · 2 horchata») in Ventas; the header's state pill stays on in the empty
   and error states. «Enviada al portal» has no offline wording (a sale still in the queue).
9. **Gastos:** the list totals $1,530.00 while Turno's breakdown shows «gastos −$620.00»; the
   category filters omit «Otros» although the form offers it; at 760–1000 px the row squeezes
   the concept to zero width (as in Turno, item 6).
10. **Inventario at phone width:** the stock row keeps every element on one line, so at 375 px the
    name and «Umbral · unidad» wrap word by word and the «Registrar merma» button is cut off at the
    right edge (same in the file). The row needs a phone layout.

## 5. Fase 11 — Caja y captura

> **Started before the fase 10 gate closed (owner, «continue», 2026-09-17).** O-12/O-13 wait on the
> Acceso amendment and the runtime; fase 11 proceeds on fixtures so the screens are not idle.

### O-20 Operador · Caja

- [x] Status · **Blocked by:** O-11 · **Blocks:** fase 11 gate
  - Done: 2026-09-17 · `src/operador/caja/` (catalogue, ticket column / bottom sheet, Cobrar modal
    in three steps, post-sale card with its 8 s bar, Compartir comprobante, Producto nuevo en caja),
    `/operador/caja`; pure ticket maths in `caja/ticket.ts` with unit tests
    (`tests/operador/ticket.test.ts`); shared `OpModal` (Radix) and `Note`. Harness comparison at
    1440, 1024 and 375 px, empty ticket, loading/empty/error, each Cobrar step, the post-sale card
    and both modals: box-for-box except the agreed radius, a design button left in browser-default
    black (#000; code keeps the token), and harness noise where the runtime splits mixed text.
    **Gate met** by `e2e/operador-caja.spec.ts` at 1440/1024/768: cash sale with change, credit sale
    that needs a client, a long ticket whose total and COBRAR stay in view, Deshacer.
  - Deviations: the lock overlay in this file is O-13's (NIP verification) and not built here;
    «Guardar imagen» / «Copiar texto» / WhatsApp do real things on the device (PNG, clipboard,
    `wa.me` text per Track N row 13) instead of the prototype's canned confirmations; «Agregar al
    ticket» requires a name and a price. `portalFontSizes.total = 38` added.
  - For the design project (§4b): the WhatsApp confirmation says «enviado» but the app can only open
    WhatsApp; the owner must know the message still needs sending.

**Open question found while building O-20:** `portalFontSizes` documents «the floor of 12 holds for
both» surfaces, but the operator design uses 11 px (tab labels, chips, «Sin leer», «Quedan N»), and
O-11 added `portalFontSizes.tag = 11`. Needs the owner's call: keep 11 (amend the floor) or raise
those texts to 12 upstream.

## 6. Fase 12 — Turno completo, detalles y cola sin conexión

> **Open for fase 12 (asked when wiring, not blocking the fixture screens):** the five close-out
> reasons vs the six-value `caja_turnos` enum (Cierre), and where expense receipt photos live
> (Gastos). The screens are built on fixtures; the questions come back with O-06.

### O-21 Operador · Ventas

- [x] Status · **Blocked by:** O-11
  - Done: 2026-09-17 · `src/operador/ventas/`, `/operador/ventas`; figures derived and unit-tested
    (`tests/operador/ventas.test.ts`: 12 active, $3,280.00, $2,140.00 cash, V-0405 out of every
    total). Shared `SearchBox`, `FilterChips`, `SinResultados`, `ChoiceChips`, field styles and a
    `Toast` width. Harness: default, loading, empty, error, 375 px and the cancel modal match
    (agreed radius aside). The design's `startFilter` control is not wired in the file itself.
    Cancellations are device-local until O-06. Playwright: `e2e/operador-ventas.spec.ts`.

### O-22 Operador · Detalle de venta

- [x] Status · **Blocked by:** O-21
  - Done: 2026-09-17 · `src/operador/ventas/detalle/`, `/operador/ventas/[folio]` (Ventas rows now
    link here; the catch-all no longer 404s them). The ticket card, «Quién y cuándo», «Qué puedes
    hacer» and the fiado card; the header carries the sale's state pill. Cancel reuses Ventas'
    modal (`CancelarVenta`, now generic; the list opens `CancelarDeLista`), and sharing reuses
    Caja's (`Share variant="detalle"`: 420 px, titled with the folio, no preview); the category
    tints moved to `caja/categorias.ts`. Dev forcing: `dataState`, `venta=efectivo|fiado`,
    `estado=cancelada`. Harness at 1440, 1000 and 375 px, cancelled, fiado, loading/empty/error,
    both cancel modals and the share modal: match, the agreed radius and the runtime's split text
    aside. Playwright: `e2e/operador-detalle-venta.spec.ts`.
  - Deviations: the state pill shows only when a ticket is on screen (the file keeps «Venta
    registrada y enviada» above «Esta venta ya no existe»); a folio the fixture does not hold renders
    the empty state (only V-0412 and V-0409 have designed lines).

### O-23 Operador · Gastos

- [x] Status · **Blocked by:** O-11
  - Done: 2026-09-18 · `src/operador/gastos/`, `/operador/gastos` (out of the catch-all, with
    Ventas); figures and filters unit-tested (`tests/operador/gastos.test.ts`: 6 expenses,
    $1,530.00, 2 without a receipt). «Registrar gasto» is a header button that opens the form; a new
    expense goes on top of the list, device-local until O-06. Shared pieces: `MontoInput` (now also
    Cobrar · efectivo), `ModalBotones` (now also Ventas' cancel). The receipt card opens the camera
    (`capture="environment"`, the file picker on desktop) and shows the file's name; tapping it
    again removes it. Harness at 1440, 768 and 375 px, loading/empty/error, the form empty, filled
    and with a receipt, and the toast: match, the agreed radius, the README's bell and a design
    button in browser-default black aside. Playwright: `e2e/operador-gastos.spec.ts`.
  - Open with O-06 (already listed above): where the receipt photo is stored, and how these five
    categories map to the domain's expense categories.

### O-24 Operador · Inventario

- [x] Status · **Blocked by:** O-11
  - Done: 2026-09-18 · `src/operador/inventario/`, `/operador/inventario`; figures, KPI hints
    («Pastor, tortilla y agua»), stock moves and search unit-tested
    (`tests/operador/inventario.test.ts`). Existencias / Movimientos de mi turno tabs (now the shared
    `SegTabs`, also used by Avisos), search, «Entrada de mercancía» and «Merma» from the bar or from
    each row with the product preselected; a write-off needs one of four reasons, an entry may name
    the supplier. A movement moves the stock and joins the list, device-local until O-06. The
    owner-only rule sits under the stock. Dev forcing: `dataState`, `startTab`. Harness at 1440,
    1024 and 375 px, both tabs, loading/empty/error, both forms and the toast: match, the agreed
    radius, the runtime's split text and the design's default-black buttons aside.
    Playwright: `e2e/operador-inventario.spec.ts`.

## 7. Fase 13 (tasks written when fase 12 closes)

- **Fase 12 — Turno completo:** Ventas + Detalle de venta, Gastos, Inventario, Cobranza + Detalle
  de cliente, Registros por enviar, then Cierre de turno last.
- **Fase 13 — Dueño:** Revisión de caja, Cortes de turno.
