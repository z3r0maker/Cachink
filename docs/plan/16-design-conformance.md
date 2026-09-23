# Track W — conformidad de diseño del portal web

Source: `docs/audits/design-2026-09-22.md` (audit of `apps/web` against the
Xangarro portal handoff). This file turns that audit's findings into work
batches. The audit stays the evidence; this stays the plan.

Findings are referenced by their audit ids: `S-n` systemic, `A-n` acceso,
`B-n` operación diaria, `C-n` dinero y negocio, `D-n` detalle transversal.

**Track W is complete.** A-12 (hero de acceso, ADR-093) · W-1 (los cuatro
estados, ADR-094) · W-8 (las gráficas de Estados) · W-2 (tipografía y escala)
· W-4 (detalle transversal) · W-5 (comprobante) — 2026-09-22; W-3 (las once
consultas) · W-6 (`design-lint` en 0) · W-7 (el asistente de alta, ADR-098) —
2026-09-23.

What the audit left standing is recorded in each section: three KPI tiles
with no data behind them, four Personas columns needing a migration, the
aviso meta's relative time, the Indicadores delta, and the screens §4 lists
as never built. None of it is drift — it is work with a name.

---

## W-1 · Los cuatro estados (S-1, S-2) — un arreglo, todas las pantallas

- [x] Status

**Done 2026-09-22.** What shipped, and what it turned up:

- `(portal)/loading.tsx` — one file, every portal route. The `LoadingState`
  primitive was already built and correct; nothing rendered it, so a
  navigation simply froze on the outgoing screen.
- `isEmpty` wired on Equipo (per tab, with the tab's own copy), Negocio (the
  page now tells "no row" apart from "the read threw") and Estados (a new
  `EstadosModel.vacio`, with Posición exempt because a Balance is a snapshot,
  not a window).
- Suscripción and Asesor had `empty` copy that **nothing should reach**: the
  first always has a plan to show, the second is still behind `proximamente`.
  Both dropped the prop, which is now optional on `ScreenBody`. Suscripción's
  real emptiness — no invoices yet — moved inside the Facturas card as the
  design's inset empty state.
- `tests/screen-states.test.ts` is the ratchet: `empty` copy and the `isEmpty`
  that reaches it must travel together, in both directions, on every portal
  screen — and the loading boundary must exist. Shown to fail when broken.

**A crash found on the way.** Verifying the empty period in the browser took
the Posición tab down with "Cannot mix BigInt and other types" — on _every_
period, not just empty ones. `valuacionApertura` typed a Postgres `sum()` as
`sql<bigint>` when the driver returns the numeric as text; `bigint + string`
is legal JavaScript, so the Balance's `capitalInicial` concatenated instead of
adding and «Total capital» read **-$640,885,164,500.00**. Fixed at the
boundary, with `packages/data-pg/tests/estados-facts.integration.test.ts`
asserting the `typeof` and the rule recorded as **ADR-094**: an aggregate over
money is typed `sql<string>` and converted, never asserted to be a `bigint`.
`dashboard.ts` had it written down already; one query had not followed it.

**Left open:** the empty states of Equipo and Negocio are wired but not yet
exercised end to end — both need a tenant with no operators and no business
row, which the seeded suite has no fixture for. The unit ratchet holds the
wiring; an E2E against a throwaway tenant would hold the rendering.

---

## W-2 · Tipografía y escala (S-3, S-4, S-5)

- [x] Status

**Done 2026-09-22.**

- **S-3** — a global `h1…h6` rule at weight 800 with the design's tracking,
  `h1` at the 36 page-title step. Element selectors, so every component that
  dresses its own heading still wins; this only catches the ones nobody did.
  The UA margin goes to zero, because the portal spaces itself with `gap` —
  the three headings that leaned on that margin say what they want now, and
  the auth card keeps its own **30**, which the design sets apart because the
  heading lives inside a 460px card.
- **S-4** — nav label, business name, Inicio's subtitle and the empty-state
  body move to `portalFontSizes.body` (15). The per-screen `pageSubtitle`
  styles were already at 15; the audit's list was one entry generous.
- **S-5** — `kpiFigure` at 34 (`portalFontSizes.xl6`), with a `size="lg"`
  step at 36 for Inicio's «Resumen de hoy», the only KPI row the design
  calls out that way. The old value reached for the **phone's** ramp, which
  has no 34 at all.

`tests/typography.test.ts` pins all three by reading the stylesheets —
vanilla-extract class names are opaque at runtime, so the same trick
`screen-states.test.ts` uses. Shown to fail when broken.

**A missing token, found on the way.** The design files set **18px 21 times**
— card section headings, a donut's title, a total's label — and the portal
scale had no step for it, so nine call sites had inlined the number.
`portalFontSizes.sectionTitle` is that step now, and `design-lint`'s
`fontsize-literal` count fell from 45 to 36 as a result.

**Table cells deliberately left at 14.** The token file's docblock claims
«15 (body and table)», but the handoff's own Table section gives no body-cell
size, so there is nothing to conform to. Worth settling with the owner.

---

## W-8 · Las gráficas de Estados financieros (C-13)

- [x] Status

**Done 2026-09-22.** All four charts now exist and are drawn to the design.

The Resultados half first: they were Recharts with stock
defaults — an axis, gridlines, tick labels, a tooltip and a legend the design
has none of; unbordered marks; two colours doing the work of four; no leader
lines, so the cascade read as a bar chart; and a donut with no centre total
whose legend fell off the bottom of its card. `charts.tsx` admitted it:
«Provisional (the design file is not mirrored, O-23)». The mirror landed and
nobody came back.

Redrawn as SVG on the design's own canvases — `cascada.tsx` (`560×214`) and
`donut.tsx` (`120×120`), with `charts-data.ts` still the pure, tested shape.
Every mark carries the house `2px --black`; the colours are the design's
semantic four (green kept, blue subtotal, red subtracted, amber ISR); the
leaders are back; the donut's black backing ring gives each slice its border
and the hole carries the total.

Then the two that had never been built at all — both live only in the
`.dc.html`, which is how the first audit pass missed them:

- **Flujo** — «Entradas y salidas del periodo», `700×180`: diverging bars
  around a centre `$0` axis, entradas right in green and salidas left in red,
  closing on a `2.5px` rule with «Incremento neto en efectivo» at 32px.
  **One scale serves both sides**, or a gasto would out-run a larger cobro;
  the shorter runway sets it.
- **Indicadores** — a `180×106` dial per margin: three bands, a black needle
  on a yellow hub, the 36px figure and a verdict with a bordered dot. The
  bands come from the domain's `DEFAULT_HEALTH_THRESHOLDS`, the same numbers
  `evaluateHealth` judges by, so the needle can never sit in green under a
  «Crítico». The three ratios that have no natural ceiling — liquidez,
  rotación, cobranza — stay as cards, as the design has them; two of them
  were not on the screen at all before.

`chart-geo.ts` holds the rules a wrong chart would break quietly — the
shared scale and the band boundaries — with `tests/chart-geo.test.ts` on
them.

**Still open:** the design's per-ratio delta and `120×34` sparkline
(«↑ 2.1 pts vs mes anterior»). Both need the previous period's indicadores,
which `loadEstadosModel` does not fetch — a data change, so it belongs with
W-3 rather than here.

**Also freed up:** `recharts` now has one consumer left,
`_inicio/ultimos-30.tsx`. The design gives that sparkline its own geometry
too; drawing it would drop the dependency.

---

## W-3 · Consultas que no traen lo que el diseño muestra (B-1…B-6, C-2…C-6)

- [x] Status — **done 2026-09-23**, all eleven

Landing per screen, because each screen is its own query change and its own
review.

### Done

- **B-4, B-5, B-6 · Productos.** Pills tinted by the design's four tones; the
  12px stock bar, the product tile and the SKU line, built from styles that
  had been written and imported nowhere; «Margen promedio» on Catálogo and a
  KPI row on Movimientos, which had none.
- **B-1, B-3 · Movimientos.** Operador and Dispositivo, both **recovered
  rather than stored** — the operator through the shift the ticket belongs
  to, the device through the sync receipt that delivered the row. Stacked
  date over time, the circular `$`/`−` badge, and the missing KPI row.
- **C-2…C-5 · Equipo.** The shift pill (abierto / cerrado / **sin vincular**),
  the two stat boxes, a footer naming the phone; device cards with their
  tile, their operator and an amber strip for refused rows; four KPI tiles
  per tab beside the plan quota rather than in its place.
- **B-2 · the Movimientos drawer.** Rows were inert, and «Compartir
  comprobante» — a read-only action the design keeps for every role — had
  nowhere to live in the portal at all. The amount block, the field list,
  the ticket's other lines (grouped from rows already on screen, not asked
  for again) and where the row came from. ADR-058 drops the design's second
  footer action, the danger «Cancelar»: cancelling is the register's job.
- **C-6 · Empleados.** Personas reads in weeks. The column showed each
  employee's raw per-period figure while the KPI above showed the weekly
  total, so the two could not be reconciled by eye. Both go through the
  domain's `salarioSemanal` — which already existed, and which the screen
  nearly got a second copy of.

### What the seed cannot prove

It links no ticket to a shift and writes no sync receipts, so the attribution
columns read «—» against it and a broken join looks exactly like a correct
one. Two integration tests build those rows. They earned it immediately: the
device subquery had been matching the receipt against the **ticket's** id
instead of the sale's.

### Needs a migration before it can be built

Three Personas columns have **no column to select** — `employees` carries id,
nombre, puesto, salario and periodo, and nothing else.

- **Contrato** (Fijo / Por horas / Temporal). The pill we draw is `periodo`,
  which is how often someone is _paid_, not what they are hired as.
- **Ingreso** — the hire date. `created_at` is when the row was typed in.
- **Acceso a la app** — the design's own note says this screen is the HR view
  and Operadores the app-access one, and that a person may appear in one and
  not the other. That is a link between `employees` and `users`, and matching
  on name would be a guess.

«Estado» is a fourth: the query filters out `deleted_at`, so the column could
only ever read «Activo». It needs a real state, not a row that exists.

### Tiles deliberately absent

«Sin factura» (no invoice flag on `expenses`), «Efectivo en caja» and
«Cuentas por cobrar» (the cash position and the open balance, both other
screens' numbers). A tile nobody can compute is worse than a tile that is not
there. The device card's «{n} registros esperando conexión» is a queue on the
phone the server cannot see, so it counts rows the phone **sent and the
server refused** instead.

Still waiting here from earlier tracks: the aviso meta's relative time and
its device/operator half (W-4), and the Indicadores delta and sparkline
(W-8).

---

## W-4 · Detalle transversal (D-1…D-4)

- [x] Status

**Done 2026-09-22.** Four small defects that shared one shape: something the
design pairs was only half applied.

- **D-1** — Negocio's four section tiles were coloured squares with a
  self-closing `<span>` inside. Each carries its 19px stroked glyph now; the
  storefront and the receipt are the design's own paths, the card and the
  gear the nearest reading of the two sections we have that it does not.
- **D-2** — «Guardar cambios» wore yellow on the yellow save bar, so the
  action read as part of the panel. The dark variant, as the design sets it.
- **D-3** — severity tinted the tile and left the glyph at default ink, so
  colour alone carried the meaning. Each tone now pairs with its own
  contrast-checked `*Text` token.
- **D-4** — aviso rows printed «Sin leer» / «Leído» where the design puts a
  meta line. The state moved into the row itself (a 10px yellow dot, a white
  ground against the read row's offwhite, 800 against 600), and the word
  survives as the dot's accessible name.

`tests/detalle-transversal.test.ts` holds all four, each as the invariant
rather than the string — a tone with a fill must have a glyph, a severity
with a background must have an ink, the state must be encoded in more than
one channel. Shown to fail when broken.

**Left open on D-4:** the design's meta reads «Hace 40 min · iPhone de caja ·
Ana». Ours gives the absolute time and the source. The relative form needs a
clock this row cannot reach without a hydration mismatch — it renders in the
bell panel too, which loads through an action — and the device and operator
need columns `notices` does not have. Both are data, so they belong with W-3.

---

## W-5 · Comprobante (Ticket)

- [ ] Status

- The card shadow the other templates carry via `tarjeta()` (`SOMBRA=5`) and
  the ticket does not.
- `#d4a017` in `negocio/comprobantes/brand-widgets.tsx` — an off-palette
  fallback that the design system has no colour for.

**Size:** small, self-contained, and it is customer-facing output.

---

## W-6 · `design-lint` de vuelta a 0 (S-7)

- [x] Status — **done 2026-09-23**, baseline re-recorded at **0**

**Done 2026-09-23: 59 → 0.** They split three ways, not two.

- **Fixed canvases (43).** The login animation on its `460×200` stage and the
  Estados charts on theirs. `fontSize={12}` inside a `560`-wide `viewBox` is
  not twelve pixels of type — it lands at whatever size the card is, about 27
  on a wide screen — so snapping it to the ramp would change the drawing's
  proportions and tell the next reader a lie about what the number is. A
  `LIENZOS_FIJOS` exception in `scan.ts` names them, with the bar for joining
  the list written down: the file's numbers must be meaningless outside a
  `viewBox` or a stage of fixed size. Looking drawn is not enough.
- **Real defects (14).** `colors.red` as an error line where `redText` is the
  contrast-checked ink; two dialogs writing their own `rgba()` scrim instead
  of `colors.scrim`; a `3px` border on the login coin where the house has
  only 2 and 2.5; `999` and `'50%'` where `shapeRadii.pill` is; a `9` radius
  off the ladder; thirteen hexes duplicating tokens, five of them the palette
  retyped as a tint array in `revision-mapear`; and font-size literals with
  exact steps waiting for them.
- **A rule that was wrong (1).** `borderRadius: 0` on an inset card is the
  absence of a radius, not a radius off the scale — a reset every scale
  implies and none needs a step for. The rule ignores zero now.

---

## W-7 · Decidir el asistente de alta (§4 del audit)

- [x] Status — **done 2026-09-23** (ADR-098)

**Done 2026-09-23 — ADR-098.** It was a deliberate improvement, made in N-12
and never written down where the next person holding the design file would
find it.

The design's four steps capture data; two of them ask for an RFC and a
régimen, which is exactly what someone starting out has not sorted yet. The
eight questions ask how the business works, and every answer **configures**
it — `answersToConfiguration` turns them into payment types, inventory and
caja toggles and a plan recommendation. The pairing step moved to Tu equipo,
where a device is actually paired.

The ADR also settles what the divergence costs: the onboarding `.dc.html`
stops being the spec for that flow, and the wizard's shape becomes a domain
decision — a question that configures nothing does not belong in it.

---

## Orden sugerido

~~W-1 → W-2 → W-8 → W-4 → W-5 → W-3 → W-6 → W-7~~ — **Track W is done.**

W-8 sits third because the charts are the most visible thing on the screen a
director actually opens. W-4 and W-5 move ahead of W-3 because they are small
and shippable while the data-layer batch is still being reviewed. W-6 goes
after W-5 because they share the `#d4a017` fix. W-7 can happen at any point
and blocks nothing.
