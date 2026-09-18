# Track O — changes to request in Claude Design

Requests go to the Claude Design project (`5dd266f3-42e7-403f-b941-95c8e6551dc6`), and the files are
pulled again afterwards. `design-reference/` is never edited by hand (ADR-058). The source is plan
§4b.

## First round — applied on 2026-09-18 (ADR-085)

Every request of the first round landed and was pulled: Acceso (8 characters, text input,
`K7M3 DQ9P`), shell and tokens (radii 16, `#DBB80A`, one footer, the bell everywhere), Inicio and
Turno («Hoy no», wrapping rows, the missing sentences), Ventas and Detalle de venta (one V-0412, the
queued-sale wording), Gastos ($620.00, «Otros», wrapping rows), Inventario (phone row), Cobranza and
Detalle de cliente (one history, «a su favor»), WhatsApp wording, Cierre (count from zero, band on
unsent records) and the two owner screens (owner components, per-corte count and events, Avisos,
ink breadcrumb). The code follows all of them.

## Second round — open

Each block can be pasted into Claude Design as it stands.

### Operador Inicio and Operador Turno — capital letters

> In «Operador Inicio», `hintCanceladas` returns «dos canceladas, la última a las …» and in
> «Operador Turno» `hintComprobantes` returns «cuatro con comprobante»: both open a KPI hint in
> lowercase, while the singular cases («Una cancelada…», «Un comprobante») are capitalised. Capitalise
> the word from `NUM` («Dos canceladas…», «Cuatro con comprobante»).

### Cortes de turno — the zero counts

> In «Cortes de turno», an uncounted denomination draws «×0» in gray-400 on gray-100 (2.4:1, under
> WCAG AA). Keep gray-600 for the count and let the gray tile mark the zero.

### Cortes de turno and Revisión de caja — owner component values

> Both files now follow the owner components, with three values that differ from the portal's
> components: the KPI figure is 34 px (the portal's `KpiCard` draws 32 px), the segmented tabs use
> 0.04em tracking and a 700 count (the portal: 0.05em and 800), and «Exportar mes» has a 12 px
> radius and a 3 px shadow (the portal's default button: 16 px and 4 px). Draw them with the
> portal's values, or say which side should move.
