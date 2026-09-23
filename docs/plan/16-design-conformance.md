# Track W — conformidad de diseño del portal web

Source: `docs/audits/design-2026-09-22.md` (audit of `apps/web` against the
Xangarro portal handoff). This file turns that audit's findings into work
batches. The audit stays the evidence; this stays the plan.

Findings are referenced by their audit ids: `S-n` systemic, `A-n` acceso,
`B-n` operación diaria, `C-n` dinero y negocio, `D-n` detalle transversal.

**Done:** A-12 (hero de acceso) — shipped 2026-09-22, ADR-093.

---

## W-1 · Los cuatro estados (S-1, S-2) — un arreglo, todas las pantallas

The design requires happy / loading / empty / error on every screen. We have
the primitives and use two of them.

- `(portal)/loading.tsx` so every route gets the design's static gray blocks
  on navigation — the `LoadingState` primitive is already built and correct.
- Pass `isEmpty` to `resolveScreenState` on Equipo, Negocio, Estados and
  Suscripción, whose empty copy is written and unreachable today.
- Guard: an E2E that visits each route with an empty tenant and asserts the
  empty copy, so the state cannot silently die again.

**Why first:** it is one shared change, it needs no data-layer work, and it
is the difference between "a period with no movements" reading as an empty
month or as a statement full of zeros.

**Size:** small. **Touches:** `session/gating.ts`, four screens, one new file.

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

W-1 → W-2 → W-4 → W-5 → W-3 (B, then C) → W-6 → W-7.

W-4 and W-5 move ahead of W-3 because they are small and shippable while the
data-layer batch is still being reviewed. W-6 goes after W-5 because they
share the `#d4a017` fix. W-7 can happen at any point and blocks nothing.
