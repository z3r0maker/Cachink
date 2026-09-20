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

- [x] Status · **Blocked by:** — · **Blocks:** O-05, O-06
  - Done: 2026-09-19 · `packages/sync/src` returned with the merge of `rename/xangarro-stored-ids`
    (52824588): api-client, sync-engine, outbox drain, retention purge, entitlement verify,
    reference applier, legacy tracker — extended for tickets + per-client abonos (see the merge
    commit). **Spike green in both engines:** `apps/web/e2e/spike-sqlite-wasm.spec.ts` +
    `e2e/spikes/sqlite-wasm-opfs/` bundle the real stack (sql.js WASM inlined, esbuild) and
    drive it through Playwright — the merged journal (0000–0009) applies on WASM, a
    `DrizzleTicketsRepository`+`DrizzleSalesRepository` round-trip writes and reads back, the
    change-log triggers fire (`__xangarro_change_log` rows), and OPFS persists across a reload —
    **Chromium ✓ and WebKit ✓** (WebKit needs a persistent context: headless WebKit's OPFS
    storage process refuses an ephemeral profile — the spec launches
    `webkit.launchPersistentContext`). **The Drizzle driver runs on WASM** — the hard stop does
    not apply. **Bundle cost: 2,069 KiB self-contained** (sql.js JS+WASM ≈ 1.5 MB of it; drizzle +
    domain + data + migrations ≈ 0.5 MB; gzip roughly halves it). Runner: `pnpm --filter
@xangarro/web test:spike` (no database, no server). O-06 will load the WASM only on register
    routes and move persistence into a Worker with the real `@sqlite.org/sqlite-wasm` OPFS VFS
    where feasible.

- [ ] Status · **Blocked by:** — · **Blocks:** O-05, O-06
- **Steps:** restore `packages/sync/src` from the branch that has it (see `git log --all -- packages/sync/src`), make
  it build and pass its tests on this checkout. Spike: a Worker running
  SQLite-WASM on OPFS, the `@xangarro/data` migrations applied, one repository round-trip and one
  change-log row, in Chromium and WebKit via Playwright.
- **Acceptance:** spike green in both engines, bundle cost measured and recorded here. **If the
  Drizzle driver does not run on WASM, stop and ask the owner** (ADR-071 §4).

### O-03 Expected-cash calculator, one per turno

- [x] Status · **Blocked by:** C-18 · **Blocks:** O-15, fase 12 Cierre
  - Done: 2026-09-19 · `esperadoDelTurno` joins the calculator (TDD, 5 new tests: scoping by
    `cajaTurnoId`, fiado/cancelled/other-turno/non-cash-abono exclusion by construction, fondo +
    adicional base, turno without id rejected). `CerrarCajaUseCase` now computes its esperado through
    it — fetching the turno's abonos (clientPayments) and passing tickets/lines/abonos/expenses
    scoped by the turno — replacing its own date-range sum; `#computeExpected` is gone. The use
    case's caja tests seed `cajaTurnoId` on their tickets and the gasto, which is exactly the C-18
    column doing its job. Application 469, data 270 green.
  - Calculator done 2026-09-18 (with O-28): `efectivoEsperado`, `totalContado`, `diferenciaCorte`
    and `DENOMINACIONES_MXN` in `packages/domain/src/financials/cierre-turno.ts`, 7 tests, the
    handoff's figure reproduced ($2,710.00 since the 2026-09-18 pull, ADR-085); Turno's fixture
    computes its figure with it. **Open:**
    scoping by `cajaTurnoId` and `CerrarCajaUseCase` using it wait on C-18 (expenses gain
    `cajaTurnoId`).
- **Steps:** TDD in `packages/domain`: `fondo + ventas en efectivo + abonos en efectivo −
gastos de caja`, scoped by `cajaTurnoId`, fiado excluded. `CerrarCajaUseCase` uses it instead of its
  date-range sum. Happy path + 3 unhappy.
- **Acceptance:** the handoff's figures reproduce exactly: fondo $800.00 + $1,980.00 + $550.00 −
  $620.00 = **$2,710.00** (amended files, ADR-085; was $2,870.00).

### O-04 Owner creates operators and resets NIPs (completes P-05)

- [x] Status · **Blocked by:** C-16 · **Blocks:** O-12
  - Done: 2026-09-19 · The portal half already existed (`/equipo` → `crearOperador` /
    `restablecerPin` server actions through the application use cases, 4-digit `isValidPin`,
    `sync_log` append inside `withTenant`; verified server-action tests in the web suite and
    `endpoints.test.ts` asserting `plataforma: 'web'` activates). This task removed the phone's
    flows (ADR-072): `RecuperarPinUseCase`, `CambiarPinUseCase` and their tests; the recovery and
    change-PIN screens + `ChangePinGate` (the `mustChangePin` flag stays dormant — no migration,
    pre-launch); the `onForgotPin` prop chain (pin-prompt, quick-switch screen/gate) and
    `maskEmail`; the recovery/changePin i18n blocks; the three Maestro flows +
    `full-regression.sh`/README/feature-areas entries. Application 461, UI 1821 green; mobile and
    application typecheck clean.
- **Steps:** «Nuevo operador» (nombre, NIP 4 masked + confirm) and «Reiniciar NIP» in `/equipo`,
  writing `users` through the application use case with its `sync_log` append (ADR-062). Remove the
  phone's recovery screen and change-PIN flow (ADR-072).
- **Acceptance:** server-action tests; the new hash appears in `/sync/pull`.

### O-05 Real `/sync/push` and `/sync/pull` (B-08, B-09)

- [x] Status · **Blocked by:** O-02, C-16 … C-19 · **Blocks:** O-06
  - Done: 2026-09-19 · `pnpm --filter @xangarro/web test:conformance` is green against the real
    portal (activate 4/4, sync 10 passed + 1 mock-only skip), with two new cases in
    `packages/contracts/tests/conformance/sync.test.ts`: a `plataforma = web` device activates
    (now a hard assert — C-16 is in the contract, so a current portal must accept it) and shares
    the pull surface (`mensajes_operador`); a ticket and its line push in one batch and a reply
    to a missing mensaje rejects `FK_MENSAJE_MISSING`. The run found and fixed a real portal bug:
    `users.permissions` travelled as its JSON-text string since A-05 gave `UserSchema` the field —
    `codec.ts` decodes it now. Rerun flake fixed too: `clearLocalThrottles` also clears the
    suite's bad code (`activate:code:ZZZZZZZZ`), which locked the second run inside 15 minutes.
    The browser round-trip is `apps/web/e2e/dispositivo-web.sync.spec.ts`: from a real page,
    activate a web device, push a ticket + its line, pull — acknowledgment ≥ push, rows verified
    in Postgres. Alongside it the C-17/A-05 fallout in the e2e fixtures: `sync-phone.ts` builds
    tickets + lines (not header-laden sales), three specs' raw `INSERT INTO sales` lost the
    dropped columns and gained their ticket headers, and the pg seed's two `INSERT INTO users`
    lost `role`/`recovery_password_hash`/`must_change_pin` (it broke `db:reset` outright).
    Fixing `db:reset` un-hid that the whole Playwright matrix had not run since A-05; also
    repaired to green: the e2e webServer now passes `BILLING_DATABASE_URL` (suscripción/facturas/
    data/a11y were sweeping error cards), `loadSuscripcion` counts operators without the dropped
    `users.role`, the Movimiento dialog keeps a synchronous in-flight guard (a 5-click smash
    wrote 5 movements and poisoned the shared DB for later specs), chaos-4's mocked 500 bodies
    declare `charset=utf-8` (Latin-1 mojibake broke the text match), chaos-1/chaos-2 point at
    SKUs the current seed actually has (TAC-002…006 died with the old demo seeder) and the
    register smash pays enough for the $185 fixture ticket, chaos-3's "no alert" assertions are
    scoped to non-empty alerts (Next's `#__next-route-announcer__` is a 1×1 role="alert" on
    every page), and eslint ignores generated dirs (`.next*`, `.out`). The last three failures
    needed product fixes, not spec fixes: the operator modal now has a close animation (Radix
    keeps the portal mounted while it plays, so a smashed «Registrar venta» cannot leak clicks
    onto the catalogue behind the closing card — the smash left "Orden de pastor ×4" on the next
    ticket) and `useCaja.vender` sells one ticket once (same-lines guard); the sync project's
    smoke signs up in its own cleared context (/signup bounces signed-in visitors), reads its
    tenant from the activation bootstrap (no `xg_business` cookie exists anymore), pushes a
    ticket + line dated inside the pinned business month, and clicks Xangarrito's real
    «Empezar gratis»; asesor's dismiss test arms a real detector (materialise-on-read reaps any
    seeded notice no detector backs — three April ventas fire the quincena insight), and
    asesor-metas' seed is idempotent (fullyParallel re-runs the file-level beforeAll per test
    group). **The full matrix is green: 523 passed, 0 failed** — first time since A-05 broke
    `db:reset` outright.
- **Steps:** as specified in B-08/B-09, now also serving `plataforma = web` devices.
- **Acceptance:** B-08/B-09 acceptance, plus a browser device round-trip in Playwright.

### O-06 Register runtime: device token, Worker, outbox flusher

- [x] Status · **Blocked by:** O-02, O-05 · **Blocks:** O-12 … O-16
  - Done: 2026-09-19 · Slices 1–2 (cdfc57a4, 8e21b4c8): `apps/web/src/operador/runtime/` — the
    Worker (sql.js on OPFS, the real `runMigrations`, Drizzle, the phone's own `SyncEngine`+
    `ApiClient` inside it), the typed main-thread client (`storage.persist()` at boot, one Worker
    per tab, protocol shared by both ends in `protocol.ts`), `device-store`, and `ColaProvider`
    driven by the engine when linked — real counts, `online`/`offline` state, reconnect flushes,
    and `desencolar()` so a capture uploads at once while online. Slice 3: `vender()` records the
    sale through `RegistrarTicketUseCase` in the Worker (the session store O-12 wrote stamps the
    operator and turno), and a linked register sells its **own** catalogue (`CajaViva`: the
    bootstrap's products, ticket empty — the fixture's pre-seeded ticket never enters a real
    register; an unlinked one keeps the design fixture untouched). **Acceptance met**
    (`e2e/captura.sync.spec.ts`): through the real door (link → NIP → fondo), the wire is cut
    (`context.setOffline`), a Taco al pastor sells with its change, Postgres sees nothing while
    offline, and the reconnect flush lands **exactly one** ticket — folio 1, $25.00, the line's
    concepto — and a re-flush of the same row is idempotent by row id. Matrix: 526 passed.
- **Steps:** register route group in `apps/web` (device-token auth, no owner cookie), the SQLite
  Worker, `navigator.storage.persist()`, push/pull loop with retry, connection state for the header.
- **Acceptance:** a sale captured offline is pushed on reconnect exactly once.

---

## 4. Fase 10 — Screens (10b), one at a time

Each task: design file, all states from its control panel, side-by-side capture at the same width
before reporting, Maestro/Playwright flow for the happy path.

### O-10 `Operador Estado` — the four shared states

- [x] Status · **Blocked by:** O-01 · **Blocks:** O-11 … O-16
  - Done: 2026-09-17 · uncommitted · `apps/web/src/operador/estado.tsx` + `.css.ts`, previewed at
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
  - Done: 2026-09-17 · `apps/web/src/operador/shell/*`, `/operador` layout + catch-all for screens not
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

- [ ] Status · **Blocked by:** O-04, O-06 (the ADR-072 design amendment landed on 2026-09-18)
  - Done: 2026-09-19 · `src/operador/acceso/` — the gate stands before every register route: an
    unlinked browser sees only Acceso (device-token state, never the owner cookie — ADR-071 §1).
    Vincular (correo + the panel's 8-char code, spaces/hyphens/case ignored — the correo is
    /activate's second factor; the design file shows only the code, the upstream amendment is
    this entry) redeems for real, and the bootstrap becomes the register's local database
    (`applyReferenceTables`). ¿Quién abre turno? lists the operators from that database; the NIP
    is verified on the device (bcryptjs in the Worker, three tries then back to the picker,
    «Te quedan N intentos.»). The fondo opens the turno through `AbrirCajaUseCase` — the gate this
    task owes — and a reload with an open turno walks straight back in. `e2e/acceso.sync.spec.ts`
    walks the real door in a fresh context (gated → link → wrong NIP → NIP 2580 → fondo → register
    → reload stays in) and the wrong-code refusal reads the contract's codes as Spanish copy. The
    pg seed's operators now carry a real bcrypt hash of a documented PIN (2580) — the old constant
    was a truncated hash no compare() could match; operators.spec reactivates what its last test
    deactivates (acceso's picker and permisos' grant read them). The fixture-era screens pass
    behind a demo flag the suite's storageState sets (`xangarro.caja.demo`) — removed when
    O-14+ wires real data. Matrix: 525 passed, 0 failed.
- **Gate contribution:** the turno does not open without a captured fondo.

### O-13 Register lock and operator switch

- [x] Status · **Blocked by:** O-12
  - Done: 2026-09-19 · the ticket in progress left `useCaja`'s useState for a module store
    (`src/operador/caja/ticket-store.ts`, `useSyncExternalStore`) with the lock flag beside it, so
    both survive navigation and the lock; the shell renders `BloqueoCaja` (`caja/bloqueo.tsx` +
    `caja/bloqueo-nip.tsx`) over any register route: the design's note (with and without a ticket),
    «Quién sigue en la caja» picker, NIP pad with the attempts line, and «Entrar como X» /
    «Desbloquear caja» when the same operator returns; «Cerrar el turno…» links to Cierre. Entering
    re-authenticates on the device and rewrites the session — same turno, next tickets are the new
    operator's. Two fixes the flow forced: (a) the lock dialog's scrim now scrolls with
    `minHeight`-centering — a tall card on a short viewport had its Entrar button outside the
    viewport, unreachable; (b) `RegistrarTicketUseCase` resolves the open turno per caja
    (`findOpenByBusiness`, ADR-071 §3) instead of per seller, and the worker passes the session
    operator to the tickets/sales repos so `created_by_user_id` is whoever sold — the turno stays
    the opener's. Acceptance `e2e/bloqueo.sync.spec.ts`: Ana opens with a two-line ticket, lock,
    wrong NIP refused, Luis enters, the ticket survives intact, the sale that reaches Postgres is
    Luis's. Unit: the turno-whosever test in `registrar-venta-use-case.test.ts`. Matrix 527 green.
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
  - **Superseded 2026-09-18 (ADR-085):** the amended file has «Hoy no» (built), the cancellation
    sentences and «Con faltante» (built, `src/operador/ui/frases.ts` and `inicio/kpis.ts`).
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

Collected while building fases 10–13; none is edited in `design-reference/`.

**Applied upstream and pulled on 2026-09-18 (ADR-085).** All fourteen requests of the first round
landed in Claude Design and the 16 files were pulled into `design-reference/operador/`: Acceso's
8-character text input (`K7M3 DQ9P`), radii 16, `#DBB80A` dividers, one shell (lock + «Cerrar
turno», bell on every main screen), «Hoy no» in Inicio, wrapping rows in Turno/Gastos/Inventario,
the missing sentences, one V-0412 ($160.00) and one $620.00 of gastos (so $3,120.00 cobrado,
$1,980.00 in cash and $2,710.00 expected everywhere), the queued-sale wording in Detalle de venta,
one account history with «a su favor», Cierre counting from zero with the band tied to unsent
records, and the owner screens drawn with owner components (Cortes: tabs, per-corte count and
events, Avisos instead of WhatsApp, ink breadcrumb). The code follows every one of them; D2, D5 and
D7 of ADR-083 are therefore no longer provisional.

**Second round — owner decision 2026-09-18: keep the code's versions** (capitalised hints,
AA-safe «×0», owner-component values) until a later UX audit; the requests stay in
[10-operador-design-changes.md](10-operador-design-changes.md) for that audit:

1. **Lowercase count words.** Inicio's «dos canceladas, la última a las …» and Turno's «cuatro con
   comprobante» start a hint in lowercase (the singular cases are capitalised). Code capitalises
   them (`src/operador/ui/frases.ts`).
2. **Cortes «×0».** The file grays an uncounted denomination's «×0» with gray-400 (2.4:1 on
   gray-100, under AA); code keeps gray-600 and lets the gray tile mark the zero.
3. **Owner components vs the files' values.** Following the owner decision, `/cortes` and
   `/revision-caja` render with `KpiCard`, `SegmentedTabs` and `Button`, which differ slightly
   from what the files now draw: KPI figure 32 px (`fontSizes.xl5`) vs 34 px, tab tracking 0.05em
   vs 0.04em and count weight 800 vs 700, «Exportar mes» 16 px radius / 4 px shadow vs 12 / 3.
   Either the files or the components move; nothing else differs.

## 5. Fase 11 — Caja y captura

> **Started before the fase 10 gate closed (owner, «continue», 2026-09-17).** O-12/O-13 wait on the
> runtime (the Acceso amendment landed 2026-09-18); fase 11 proceeds on fixtures so the screens are not idle.

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
    WhatsApp; the owner must know the message still needs sending. **Resolved (ADR-083 D2,
    provisional):** «WhatsApp abierto con el comprobante para el …».

**Open question found while building O-20:** `portalFontSizes` documents «the floor of 12 holds for
both» surfaces, but the operator design uses 11 px (tab labels, chips, «Sin leer», «Quedan N»), and
O-11 added `portalFontSizes.tag = 11`. **Resolved (ADR-083 D1, provisional):** 12 stays the floor;
`tag` (11) is the one exception for tags, chips and the phone tab bar (tokens comment and
DESIGN_CONTRACT updated).

## 6. Fase 12 — Turno completo, detalles y cola sin conexión

> **Resolved (ADR-083, provisional):** the five close-out reasons map onto the six-value enum
> (D6) and the expense categories onto `ExpenseCategory` (D4), both in `src/operador/vocabulario.ts`
> with tests; receipt photos live in a private Storage bucket uploaded by the outbox (D3, built
> with O-06).

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
    the empty state (only V-0412 and V-0409 have designed lines). The amended file agrees on the
    pill and adds the queued-sale state (built, dev-forced with `?enCola=true`).

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

### O-25 Operador · Cobranza

- [x] Status · **Blocked by:** O-11
  - Done: 2026-09-18 · `src/operador/cobranza/`, `/operador/cobranza`. The abono allocation of
    ADR-074 lands in the domain, test-first: `aplicarAbono` (`packages/domain/src/financials/
abonos.ts`, oldest ticket first, the excess returned as `excedente`, `AbonoInvalidoError` on
    zero or less; 6 tests). The screen derives balances, state, card text, quick amounts and the
    «se aplica a» line from it (`tests/operador/cobranza.test.ts`: $1,780.00 owed, $760.00 in
    abonos, $550.00 cash — Turno's figures). An abono settles tickets and joins today's list,
    device-local until O-06. Harness at 1440 and 375 px, loading/empty/error, the abono modal empty
    and filled, and the toast: match (agreed radius and default-black button aside).
    Playwright: `e2e/operador-cobranza.spec.ts`. The card's arrow leads to Detalle de cliente
    (O-26).
  - The file caps an abono at the balance and says nothing about the excess. **Resolved (ADR-083
    D5, provisional):** the whole amount is recorded and the excess is saldo a favor, shown in the
    preview («$X a su favor») and the toast.

### O-26 Operador · Detalle de cliente

- [x] Status · **Blocked by:** O-25
  - Done: 2026-09-18 · `src/operador/cobranza/cliente/`, `/operador/cobranza/[cliente]`. Per the
    README, an account is only its fiado tickets and abonos; `estadoDeCuenta` joins the domain
    test-first (7 tests: abonos applied in date order over `aplicarAbono`, balance, saldo a favor,
    the last ticket each abono reached; `disponible`). Hero, four KPIs, open tickets oldest first
    with «Ya abonó», history newest first, the limit note, the abono modal (Cobranza's
    `RecibirAbono`, now fed a preview by the caller, `variante="detalle"`) and «Recordarle por
    WhatsApp» (prefilled phone, live balance, opens `wa.me`). An abono is the only write; everything
    re-derives. `portalFontSizes.balance = 42` for the hero figure. Harness at 1440 and 375 px for
    both clients, header, loading/empty/error, both modals and the toast: match (agreed radius,
    split text, default-black button aside). `tests/operador/cliente.test.ts`,
    `e2e/operador-cliente.spec.ts`.
  - Deviations: «se aplicó hasta» comes from the domain, so Chuy's $120.00 abono reads V-0288
    (the file's loop says V-0244, which the earlier $300.00 had already settled). A new abono is
    dated now, not on the file's frozen «hoy». **Superseded 2026-09-18 (ADR-085):** the history now
    names every ticket an abono reached («V-0288 en parte», «… completa y …») plus saldo a favor, as
    the amended file does; new abonos are dated on the turno's `HOY`.
  - **Resolved (ADR-083 D7):** Cobranza and Detalle de cliente read one set of accounts
    (`cobranza/cuentas.ts`, tickets + abonos only) through `estadoDeCuenta`; Cobranza's history
    wins, so Detalle's Chuy now has V-0288 $800.00 with a $400.00 abono today (Cobranza still
    matches its file with 0 diffs; Detalle de cliente for Chuy differs from its file until the
    design adopts one history). Raúl and Delgado now have accounts and detail pages.

### O-27 Operador · Registros por enviar

- [x] Status · **Blocked by:** O-11
  - Done: 2026-09-18 · `src/operador/pendientes/`, `/operador/pendientes` (out of the catch-all).
    Hero in three phases (amber waiting, blue sending with the icon spinning, green sent), «La
    cola» with each record's kind, state chip («Esperando conexión» offline, «En cola» online,
    «Enviando»), time and amount; «Nada pendiente» leads to the close; the rule not to close the
    tab or clear site data. The shell now holds the queue in one client state (`shell/cola.tsx`,
    `ColaProvider` / `useCola`), so the header pill and this screen never disagree and the result
    survives navigation; O-06's outbox flusher will drive it. Until then a retry succeeds after the
    file's 1.4 s. Harness at 1440 and 375 px, offline and online, sending, sent, and
    loading/empty/error: 0 diffs (agreed radius aside). `tests/operador/pendientes.test.ts`,
    `e2e/operador-pendientes.spec.ts`.
  - Found: the design system sets `p { line-height: 1.45 }`; a `<p>` in the portal must say so.
  - Undesigned wording, generalised from the file's one case: the hero's sum with no expense
    («Suman $283.00 de ventas.») or several («y 2 gastos por $1,240.00»).

### O-28 Operador · Cierre de turno

- [x] Status · **Blocked by:** O-27, O-03 (calculator)
  - Done: 2026-09-18 · `src/operador/cierre/`, `/operador/cierre`. Count by denomination ($1,000
    to $1, tinted bills, − / field / +, amount), «Contado» in 38 px; the yellow expected-cash card
    (domain `efectivoEsperado`, the same four rows as Turno via `turno/desglose.ts`); the
    difference card (Cuadra / Falta / Sobra, domain `diferenciaCorte`); with a difference, a
    required reason (five chips) and note; the turno summary (Turno's figures, cancellations from
    Ventas, movements from Inventario); «Cerrar turno» blocked while the note is missing or the
    queue holds records. The amber band reads the shell's queue (`useCola`, whose `enviar` now
    serves Registros por enviar too) and its «Reintentar envío» empties it. Closed: the green card
    with counted, expected, signed difference and sales. Harness at 1440, 1024 and 375 px: open,
    blocked, cuadra, falta, sobra with note, both closed variants, loading/empty/error — 0 diffs
    (agreed radius aside). `tests/operador/cierre.test.ts`, `e2e/operador-cierre.spec.ts`. With
    every operator screen routed, the placeholder catch-all and `PendingScreen` are gone; unknown
    operator paths still 404.
  - Deviations: none left for the band — the amended file also shows it whenever records are
    unsent (ADR-085). «Abrir otro turno» goes to Inicio until Acceso
    (O-12) exists. The close is device-local until O-06; the count starts at zero (file amended).
  - Open with O-06: the five reasons vs the six-value `caja_turnos` enum (asked above).

**Fase 12 screens are complete** (O-21 to O-28). Its real data waits on the groundwork (O-02 to
O-06); fase 13 is next.

## 7. Fase 13 — Dueño: Revisión de caja y Cortes de turno

> Written 2026-09-18 when fase 12's screens closed. Both screens live in the **owner** portal
> (`app/(portal)/…`), built from the owner component vocabulary (`@/components`), behind
> `requireSession()`. They need data that does not exist yet in `data-pg` (review status on
> products and clients, ADR-074 §2; the per-denomination count on `caja_turnos`, §4), so they run
> on fixtures like fases 11–12 until C-18 and O-06 land. The owner shell (`shell/nav-items.ts`,
> sidebar) belongs to the Web Portal session: the 13th nav row with its badge is coordinated with
> it, not taken.

### O-30 Dueño · Revisión de caja

- [x] Status · **Blocked by:** — (fixtures) · **Wires with:** C-18
  - Done: 2026-09-18 · `app/(portal)/revision-caja/`, behind `requireSession()`. Owner vocabulary
    for the title, KPIs, tabs, button and empty state (owner decision 2026-09-18: the owner
    components win over the new files' small differences); the review modal and toast reuse the
    operator `OpModal` / `Toast`, which match this handoff. Live margin from the domain's
    `calcularMargenProducto` with the file's traffic light. Harness (through Playwright with the
    E2E owner session): list rows, both modals and the toast match; the remaining diffs are the
    owner components' (KPI spacing and hint, tab padding and tracking, button radius and shadow,
    empty state). `tests/operador/revision-caja.test.ts`, `e2e/dueno-revision-caja.spec.ts` (run
    against `pnpm dev`: the production build's /login does not hydrate right now — reported to the
    Web Portal session). The sidebar row with its badge waits on that session (shell ownership);
    until then the screen is reached by URL.
- **Steps:** `/revision-caja`. Tabs Productos / Clientes fiados with counts; three KPIs (por revisar,
  vendido sin costo, fiado sin límite); rows with who created it, where, how often it sold, and
  «Se parece a …»; the review modal (product: price, cost, live margin with the traffic light,
  category, stock, threshold; client: name, phone, credit limit with quick amounts, term, what
  they already owe); three exits — approve, merge with the duplicate, reject — each with its toast.
- **Acceptance:** harness match in both tabs, empty tabs, both modals and the toasts; approving
  needs cost + category + stock (product) or limit + term (client); Playwright spec.

### O-31 Dueño · Cortes de turno

- [x] Status · **Blocked by:** O-28 (the close it reviews) · **Wires with:** C-18, O-06
  - Done: 2026-09-18 · `app/(portal)/cortes/`, behind `requireSession()`; the sidebar lights
    «Operadores» (`NavItem.activeOn`). Expected cash from the domain's `efectivoEsperado`, counted
    cash from each corte's stored count (`totalContado`), the difference from `diferenciaCorte`;
    KPIs, state / register filters, search, the owner `DataTable`, and the owner `Drawer` at 560 px
    (new optional `width`, owner decision; default stays 460) with the difference, the note, how the
    expected was formed, the count and the rest of the turno. «Marcar como aclarado» and «Pedir
    aclaración» resolve on the page until C-18 / ADR-075's owner→operator message; «Exportar mes»
    downloads a CSV of the month. Owner components throughout (owner decision extended to table and
    chips). `tests/operador/cortes.test.ts`, `e2e/dueno-cortes.spec.ts`, and `/cortes` in the route
    sweep; a11y clean after darkening the breadcrumb link.

**Fase 13 screens are complete.** Every screen of the handoff except Acceso (O-12, blocked on the
O-04/O-06; its design amendment has landed) and the lock (O-13) is built on fixtures; real data follows the
groundwork (O-02 to O-06) and C-18.

- **Steps:** `/cortes` (the design marks «Operadores» active). Four KPIs including the month's
  accumulated difference; state and register filters and search; the list with expected, counted
  and difference per turno; the 560 px side panel (owner `Drawer`) with how the expected cash was
  formed, the operator's count by denomination, their note and reason, and the rest of the turno;
  two actions: ask for clarification (a message the operator reads in Avisos, ADR-075), or mark
  as clarified.
- **Acceptance:** harness match for the list, filters, panel and actions; Playwright spec.
