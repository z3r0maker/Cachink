# Track O — changes to request in Claude Design

The code follows these already, or leaves the case blank. They need to be made **in the Claude
Design project** (`5dd266f3-42e7-403f-b941-95c8e6551dc6`) and then pulled again with
`pnpm design:pull`. `design-reference/` is never edited by hand (ADR-058). The source is plan §4b
and ADR-083. Each block below can be pasted into Claude Design as it stands.

## Operador Acceso — blocks O-12

> In «Operador Acceso»: the activation code has **8 characters**, not 6 — draw 8 boxes. Replace
> the numeric keypad with a single text input that uppercases and ignores spaces and hyphens. Use
> `K7M3 DQ9P` as the example code instead of `TD4 91K` (the alphabet has no 0, O, 1, I or L).
> Keep the 4-digit NIP step as it is.

## Every operator file — shell and tokens

> Across all operator files: (1) corner radii of 15 px and 17 px become 16 px (the Estado tile,
> the 52 px tiles in Inicio and Detalle de cliente, and Revisión de caja). (2) The breakdown
> divider in Turno and Cierre is `#DBB80A` (`yellowRule`), not `rgba(13,13,13,0.15)`. (3) One
> shell for every screen: the sidebar footer always shows the operator, «Desde 08:15 · Caja 1», the
> 42×42 lock button and «Cerrar turno»; the header shows the avisos bell on every main screen (not
> only Inicio). (4) Tags, chips and the phone tab bar stay at 11 px (`.t-tag`); nothing else goes
> below 12 px.

## Operador Inicio and Turno

> Inicio «Para hoy»: each row needs a «Hoy no» action, as the README says. Turno «Pendientes de
> registrar»: between 760 and 1000 px the expense name collapses to zero width — let the row wrap
> (name on its own line, amount and actions below). Write the missing sentences:
>
> - First KPI hint with 0 and with several cancellations (only the single case exists).
> - Inicio «Cerró» for a last turno that did not balance.
> - Turno «Gastos» hint with 0 and with several receipts.
> - Dues beyond tomorrow (code uses «Vence en N días» for now).

## Operador Ventas and Detalle de venta

> Use one V-0412 in both files. It is $160.00 in Detalle (3 pastor, 1 gringa, 1 horchata) and
> $320.00 in Ventas. In Detalle de venta, hide the header's state pill in the empty and error
> states, and add wording for «Enviada al portal» while the sale is still waiting in the offline
> queue.

## Operador Gastos

> The list totals $1,530.00 but Turno's breakdown subtracts $620.00. Make the day's gastos agree
> (Turno, Inicio and Cierre use $620.00). Add «Otros» to the category filters, since the form
> offers it. Between 760 and 1000 px the concept collapses to zero width: let the row wrap.

## Operador Inventario

> At 375 px the stock row does not fit: the name and «Umbral · unidad» wrap word by word and the
> «Registrar merma» button is cut off at the right. Give the row a phone layout: name and
> threshold on top; state chip, quantity and the two buttons on a second line.

## Operador Cobranza and Detalle de cliente — one history (ADR-083 D7)

> Both files must tell one history per client, from tickets and abonos only. Use Cobranza's:
> Taller de Chuy has V-0288 ($800.00, 28 abr) and V-0310 ($460.00, 2 may). Today's cash abono is
> $400.00, which leaves $860.00. In Detalle de cliente, drop V-0244 and the $300.00 and $120.00
> abonos. Fix «Efectivo contra saldo de $1,260.00 · se aplicó a V-0288 y parte de V-0310»: the
> $400.00 only covered part of V-0288. Also fix Detalle's «se aplicó hasta» loop, which names a
> ticket an earlier abono had already settled. An abono above the balance is **saldo a favor**:
> show «$X a su favor» in the preview and the toast (ADR-083 D5).

## Operador Caja, Detalle de venta and Detalle de cliente — WhatsApp (ADR-083 D2)

> The portal opens WhatsApp with the text ready; it cannot send. Replace «Comprobante enviado al …
> por WhatsApp» and «Recordatorio enviado al …» with «WhatsApp abierto con el comprobante (o el
> recordatorio) para el …».

## Operador Cierre de turno

> Start the count at zero, not pre-filled ($3,780.00, «Sobra $910.00»). Show the amber band
> whenever records are unsent, not only offline (README). The sidebar footer keeps «Desde 08:15 ·
> Caja 1», as in every other file. The five difference reasons map onto the stored six as
> ADR-083 D6 says; nothing to draw.

## Dueño Revisión de caja and Cortes de turno — owner components

> Draw both screens with the owner portal's components: segmented tabs (24 px padding, 2.5 px
> divider), KPI cards (figure 10 px under the label, 14 px muted hint, 260 px grid), 12 px-radius
> buttons with a 3 px shadow, the owner empty state, 40 px filter chips and the owner table. In
> Cortes, the panel is 560 px. Give each corte its own count by denomination (it must add up to
> its «Contado») and its own «qué más pasó». Make the breadcrumb link ink with an underline
> (blue on gray is 4.19:1, under AA). «Pedir aclaración» sends a message the operator reads in
> Avisos (ADR-075), not WhatsApp.
