# Track W — conformidad de diseño del portal web

Source: `docs/audits/design-2026-09-22.md` (audit of `apps/web` against the
Xangarro portal handoff). This file turns that audit's findings into work
batches. The audit stays the evidence; this stays the plan.

Findings are referenced by their audit ids: `S-n` systemic, `A-n` acceso,
`B-n` operación diaria, `C-n` dinero y negocio, `D-n` detalle transversal.

**Done:** A-12 (hero de acceso, ADR-093) · W-1 (los cuatro estados, ADR-094)
· W-8 en su mitad visible (las gráficas de Resultados) — todo 2026-09-22.

---

## W-1 · Los cuatro estados (S-1, S-2) — un arreglo, todas las pantallas

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

## W-2 · Tipografía y escala (S-3, S-4, S-5) — tres cambios de token

- A global `h1/h2/h3` rule: weight 800, tracking `-0.02em`…`-0.04em`. Today
  headings render at UA defaults wherever a screen emits a bare `<h1>`.
- Body at 15, not 14: `portalFontSizes.body` exists and is unused. Nav
  labels, business name, page subtitles, empty-state body.
- KPI figures at 34 (36 on Inicio's Resumen de hoy): `kpiFigure` reaches for
  the phone ramp `fontSizes.xl5` instead of `portalFontSizes.xl6`.

**Why second:** portal-wide effect for three edits, and it changes every
screenshot — better done before anyone reviews the per-screen work.

**Size:** small, but visually wide. Re-baseline any screenshot fixtures.

---

## W-8 · Las gráficas de Estados financieros (C-13)

**Half done 2026-09-22.** The Resultados charts were Recharts with stock
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

**Still open — the other two charts, which we never built at all:**

- **Flujo** — «Entradas y salidas del periodo»: `700×180` diverging bars
  around a centre `$0` axis, entradas right in green and salidas left in red,
  closing on a `2.5px` rule with «Incremento neto en efectivo» at 32px.
- **Indicadores** — a `180×106` gauge per ratio (three bands, black needle on
  a yellow hub), the 36px figure, a verdict with a bordered dot, and a
  `120×34` sparkline under a delta. Ours is text cards with a tone colour.

Both live only in the `.dc.html` — the handoff README's Estados section does
not mention charts at all, which is how the first audit pass missed them.

**Also freed up:** `recharts` now has one consumer left,
`_inicio/ultimos-30.tsx`. The design gives that sparkline its own geometry
too; drawing it would drop the dependency.

---

## W-3 · Consultas que no traen lo que el diseño muestra (B-1…B-6, C-2…C-6)

Grouped because each one is a change in `@xangarro/data-pg` and then upward
through the action and the screen — the same shape of work eleven times.

Do them as one batch per repository file, not one per screen, so the
`withTenant` queries are edited once. Domain/application rules that come with
them follow TDD per CLAUDE.md §2.4 (1 happy + 3 unhappy).

**Size:** the largest batch. Worth splitting into two passes: B (operación)
then C (dinero), so a review is possible in between.

---

## W-4 · Detalle transversal (D-1…D-4)

Blank tiles, the yellow-on-yellow save button (a contrast defect, not a taste
one), severity ink, aviso meta. Independent of each other; good filler work
between the bigger batches.

**Size:** small each.

---

## W-5 · Comprobante (Ticket)

- The card shadow the other templates carry via `tarjeta()` (`SOMBRA=5`) and
  the ticket does not.
- `#d4a017` in `negocio/comprobantes/brand-widgets.tsx` — an off-palette
  fallback that the design system has no colour for.

**Size:** small, self-contained, and it is customer-facing output.

---

## W-6 · `design-lint` de vuelta a 0 (S-7)

60 violations today, from a 0 baseline. They split in two:

- **Legitimate:** ~28 literals in the login animation, which the design
  specifies on a fixed 460×200 canvas. These need a _scoped exception_ in
  `scripts/design-lint`, not a rewrite — rewriting them would break the
  design's own geometry.
- **Real defects:** the hardcoded `rgba(13,13,13,0.45)` scrim, `colors.red`
  used as text colour, and `#d4a017` (shared with W-5).

Fix the defects, add the scoped exception, re-baseline at 0, and keep the
ratchet: the count may fall, never rise.

**Size:** medium, mostly judgment rather than code.

---

## W-7 · Decidir el asistente de alta (§4 del audit)

The onboarding wizard diverges from the handoff. It is not obviously wrong —
it may be a deliberate improvement made after the design was drawn. This is a
decision to record (ADR), not code to write. Needed before anyone "fixes" it
into conformance by accident.

---

## Orden sugerido

W-1 → W-2 → **W-8** → W-4 → W-5 → W-3 (B, then C) → W-6 → W-7.

W-8 sits third because the charts are the most visible thing on the screen a
director actually opens. W-4 and W-5 move ahead of W-3 because they are small
and shippable while the data-layer batch is still being reviewed. W-6 goes
after W-5 because they share the `#d4a017` fix. W-7 can happen at any point
and blocks nothing.
