# «Empresa» — the brief for Claude Design

The founders' command center (Track E, `20-command-center.md`; ADR-124) needs screens before
code (ADR-117: the canvas is the spec). No Claude Design project holds the console yet, so
these go to a new **«Consola»** project (OD-5). Mirror it into `design-reference/consola/` with
`pnpm design:pull`, like the others, and never edit the mirror by hand (ADR-058).

**The canvas (OD-5, answered 2026-10-08):** «Xangarro Consola · Empresa»,
https://claude.ai/artifact/V1Z1fnGY2ydkft28qXpmdq, drawn in El Mostrador (no separate design
system). Round 1 (2026-10-08) holds CD-12 Resumen, CD-01 Movimientos and its «Registrar gasto»
panel, CD-02 Cuentas de socios, CD-03 Agenda, CD-04 Expediente, CD-05 Libro corporativo, and the
shared navigation. Each board is approved on the canvas before its task starts. Round 2 (same day, after the owner's review) adds CD-07 Resultados, CD-06 Movimientos › Ingresos, CD-13 Tablero (kanban) and CD-03b Agenda › Evidencias. It also reworks CD-12 Resumen (the «Autonomía» hero), CD-05 Corporativo and the Movimientos tabs; `20-command-center.md` §9 lists what changed.

Each quoted block can be pasted into Claude Design as it stands. §1 goes first: it sets the
shell every other board uses. Send the phases in order. Phase 0 and 1 boards are needed first.

**Before sending:** answer OD-1 (devengado vs flujo default, which changes CD-07) and OD-4 (the
Tablero wording, which changes CD-13). Their recommendations are in `20-command-center.md` §1.

## 1. Shell and shared rules

> **Consola · área «Empresa» — the shell.** This is an internal console for the two founders of
> MEXIA, S.A.S., the company that operates the Xangarro app. It uses the same design language as
> the Xangarro portal (El Mostrador: paper background, black ink, yellow accent, flat cards with
> 1 px lines, the same type scale). It is a working tool, dense but calm. A founder reads it
> weekly and on the 17th of each month, and decides from it.
>
> The left navigation has two groups:
>
> - **«Plataforma»:** the console's existing screens (Inicio, Negocios, Uso, Inbox, Flags,
>   Mapa, Campañas).
> - **«Empresa»:** Resumen, Movimientos, Facturas, Resultados, Balance, Impuestos, Caja,
>   Presupuesto, Tablero, Acciones, Agenda, Expediente, Cierre, Corporativo, Propuestas.
>
> «Empresa» exists only for founders: anyone else sees no trace of it.
>
> At the top of every «Empresa» screen sits a context bar with two controls:
>
> - **Proyecto:** «Todos», «Xangarro». With one project, show the project name as a label
>   instead of a selector.
> - **Periodo:** Mes, Trimestre, Año, Personalizado; the default is the current month.
>
> Amounts are MXN with two decimals, and negatives in parentheses with the danger color. A USD
> amount shows its MXN value with a small «USD 20.00 · TC 18.42» under it.
>
> Every table, card and chart has 4 states:
>
> - **loading:** skeleton rows;
> - **empty:** one sentence and the action that fills it;
> - **error:** «No pudimos cargar … Reintentar»;
> - **with data.**
>
> A missing input shows «Sin datos», never 0 or 100 %. No «Pronto» labels: an unbuilt screen
> is simply not in the nav. No em dashes in the copy, except «—» as an empty-cell placeholder.

> **Consola · Empresa — capture drawer pattern.** Every capture (a movement, an invoice, a
> deliverable, a document) opens in a right-side drawer, not a page. The drawer has:
>
> - **Header:** the movement type as a title, for example «Registrar gasto».
> - **Fields:** few, grouped.
> - **Footer:** «Cancelar» and the primary action, which names what it does («Registrar
>   gasto»).
>
> Saved entries cannot be edited. The detail drawer of a saved entry offers «Revertir y
> corregir», and explains: «Los movimientos no se editan; se revierten y se registran de nuevo
> para que la historia quede completa.»
>
> When a choice has 5 options or fewer, show them as icon + description cards, not a dropdown.

## 2. Phase 0 boards

### CD-01 Movimientos

> **Empresa · Movimientos.** The company's book of what came in and went out, in plain language.
>
> **Top row: 4 KPI tiles for the period.**
>
> - «Entradas»
> - «Salidas»
> - «Neto»
> - «Por clasificar» (entries an agent proposed or that lack a category)
>
> **Main table.**
>
> - **Columns:** Fecha · Tipo · Concepto · Proyecto · Categoría · Monto · Estado.
> - **Estado** is one of «Registrado», «Revertido» or «Mes cerrado» (a lock icon).
> - **Filters, as chips:** Tipo (Cobro, Gasto, Impuestos, Socios, Transferencia, Ajuste),
>   Categoría (Costo del servicio, Ventas y marketing, Desarrollo, Administración), and a search
>   by concepto or proveedor.
>
> **Primary button «Registrar» opens a chooser of movement types as cards:**
>
> - «Gasto o factura recibida»: licencias, publicidad, infraestructura, servicios
> - «Cobro»: normalmente llega solo desde los pagos
> - «Pago de impuestos»
> - «Movimiento de socios» — capital, aportación, préstamo, reembolso
> - «Transferencia o comisión»
>
> «Ajuste» sits behind a secondary link for founders.
>
> **Gasto drawer fields:**
>
> 1. Proveedor
> 2. Fecha de pago
> 3. Monto and moneda (MXN or USD; USD shows the exchange-rate field)
> 4. IVA
> 5. Categoría, as 4 cards
> 6. Proyecto (or «Compartido»)
> 7. ¿Deducible? (sí / no)
> 8. «Adjuntar XML o comprobante»
> 9. «Hacer recurrente cada mes»
>
> A secondary tab «Recurrentes» lists the monthly services (Vercel, Supabase, Resend, Facturapi,
> tiendas de apps, dominios, contador) with the next expected charge, and a «Registrar el de este
> mes» button that pre-fills the drawer.
>
> **Empty state:** «Todavía no hay movimientos en este periodo. Registra el primer gasto o espera
> el primer cobro.»

### CD-02 Socios: aportaciones y préstamos (inside Balance, also reachable from Movimientos)

> **Empresa · Cuentas de socios.** There is one card per founder, side by side. Each card shows:
>
> - «Capital aportado»;
> - «Aportaciones adicionales» (with the subline «cuentan para la bolsa hasta el tope del
>   trimestre»);
> - «Préstamos a la empresa» (a balance owed by the company, with «sin intereses»);
> - «Reembolsado».
>
> **«Fondeo por mitades».** A strip shows the current call: «Fondeo de octubre: $20,000 · $10,000
> cada uno», with each partner's status «Pagado el 12 oct» or «Pendiente», and the due date.
>
> **Contribution drawer.** The movement types are cards: «Capital», «Fondeo por mitades»,
> «Aportación adicional», «Préstamo a la empresa», «Reembolso al socio». When an «Aportación
> adicional» passes the quarter's cap, the drawer shows before saving: «De $30,000, $20,000
> cuentan para la bolsa (tope del trimestre) y $10,000 quedan como préstamo sin intereses que la
> empresa te devolverá.»

### CD-03 Agenda

> **Empresa · Agenda.** The fiscal and corporate calendar. It has two views.
>
> **«Próximos» (default).** A list grouped by week, each row with:
>
> - the obligation («ISR e IVA de septiembre»);
> - the authority chip (SAT, Secretaría de Economía, IMPI);
> - the due date with days left;
> - a status chip: Pendiente, Preparada, Presentada, Pagada.
>
> Overdue rows sit on top with the danger color.
>
> **«Calendario».** A month grid.
>
> **Obligation detail drawer.** What it is, in one sentence; the legal basis; the amount when
> there is one (linked to Impuestos); the attachments (acuse, línea de captura, comprobante); and
> the button that advances its status. «Marcar pagada» stays disabled until a comprobante is
> attached, with the reason shown.
>
> **Section «Exentas».** Obligations that do not apply, each with its reason: «DIOT · RESICO
> persona moral está relevada · revisar cada año con la RMF».

### CD-04 Expediente

> **Empresa · Expediente.** The company's document archive.
>
> - **Left:** a folder tree by kind: Constitución, SAT, Secretaría de Economía, IMPI, Estados
>   financieros, Contratos, Acuerdo de socios, Comprobantes.
> - **Right:** a table with Nombre · Periodo · Vinculado a (an obligation, a movement, a
>   deliverable) · Subido por · Fecha.
>
> **Upload:** drag and drop, several files at once. Each file asks for its kind and period, with
> a suggestion pre-filled.
>
> **Nothing can be deleted.** The detail offers «Subir nueva versión», and the history shows
> every version with the note «Se conserva hasta 2031 · CFF art. 30».

### CD-05 Libro corporativo

> **Empresa · Corporativo.** Four sections on one page:
>
> 1. **«Socios y acciones»:** a summary that links to Acciones.
> 2. **«Beneficiario controlador»:** one card per partner, with a «Actualizado el …» date and a
>    warning when a share event happened after it («Actualiza en 15 días hábiles»).
> 3. **«Marca Xangarro»:** the IMPI expediente, its status timeline (Solicitud presentada → En
>    examen → Registrada) and the assignment to MEXIA (Pendiente / Inscrita).
> 4. **«Firmas y certificados»:** e.firma and CSD per holder, each with a serial number and an
>    expiry date. Within 60 days of expiry it shows a warning; for the CSD it says «Si vence, la
>    facturación automática se detiene.»
>
> Never show or ask for a key file or a password; the screen says so: «Aquí solo guardamos
> vigencias, nunca archivos de llave ni contraseñas.»

## 3. Phase 1 boards

### CD-06 Facturas

> **Empresa · Facturas.** Two tabs.
>
> **«Emitidas»** (automatic, from the payments):
>
> - **Columns:** Fecha · Cliente (shown only as «Cliente de Xangarro», never the name) · Total ·
>   IVA · Tipo (Individual / Global del mes) · Estado (Timbrada, En global, Cancelada, Nota de
>   crédito).
> - **Above the table:** «Factura global de septiembre: timbrada el 3 oct».
>
> **«Recibidas».**
>
> - **Upload:** «Subir XML» (drag and drop, several at once).
> - **Columns:** Fecha · Proveedor · RFC · Subtotal · IVA · Retenciones · Estado SAT (Vigente /
>   Cancelada) · Movimiento (linked).
> - A duplicate shows «Esta factura ya está registrada»; a cancelled one is marked and records
>   nothing.
> - A row an agent proposed carries the label «Sugerido» and the actions «Aceptar» / «Cambiar».

### CD-07 Estado de resultados

> **Empresa · Resultados.** The P&L of the period as a statement, with the lines in this order:
>
> 1. Ingresos netos (sin IVA)
> 2. Costo del servicio
> 3. **Utilidad bruta**, with its margin %
> 4. Ventas y marketing
> 5. Desarrollo
> 6. Administración
> 7. **EBITDA**, with its margin %
> 8. Depreciación y amortización
> 9. Utilidad de operación
> 10. Resultado financiero
> 11. Utilidad antes de impuestos
> 12. ISR estimado
> 13. **Utilidad neta**
>
> **Columns:** the period and the previous period, with the change. Each line can expand into
> its accounts and the movements behind them.
>
> **Toggle «Devengado / Flujo»**, with a one-line explanation of each:
>
> - «Devengado: lo facturado en el periodo»
> - «Flujo: lo cobrado y pagado; así se calculan los impuestos en RESICO»
>
> **«Costo de sudor» (memo).** A separate block under the statement: «Valor del trabajo de los
> socios no pagado: $X · EBITDA económico: $Y», with an info line: «Cuánto ganaría la empresa si
> pagara el trabajo de sus socios.»
>
> **Chart:** the monthly trend of ingresos, utilidad bruta and EBITDA, in bars and a line, for
> the last 12 months.
>
> **Missing costs:** if a month has no costs captured, the margin cells say «Sin datos» and a
> note reads «Faltan gastos del mes».

### CD-08 Balance y socios

> **Empresa · Balance.** Three columns:
>
> - **Activo:** Bancos, Stripe por depositar, IVA acreditable.
> - **Pasivo:** Proveedores, Impuestos por pagar, Retenciones por pagar, Préstamos de socios.
> - **Capital:** Capital social, Aportaciones para futuros aumentos, Resultados acumulados,
>   Resultado del ejercicio.
>
> Under them, a check row: «Activo = Pasivo + Capital ✓». Below sits CD-02's partner accounts.
> The date selector reads «Al 30 de septiembre de 2026».

### CD-09 Impuestos

> **Empresa · Impuestos.** One card per month, with the current month expanded.
>
> - **«ISR provisional (RESICO persona moral)»** shows the steps: ingresos cobrados en el año −
>   deducciones pagadas en el año = utilidad; × 30 %; − pagos provisionales anteriores = a pagar.
> - **«IVA del mes»:** trasladado cobrado − acreditable pagado − retenido = a pagar o a favor.
> - **«Retenciones»** (when there are any).
>
> **Each tax** shows the columns «Estimado», «Del contador» (editable) and «Diferencia». A
> difference over $1 is flagged: «Revisa con el contador».
>
> **Footer:** the attachments (acuse, línea de captura, comprobante) and the link to the Agenda
> item. The disclaimer line reads: «Estimado de referencia; la declaración la presenta el
> contador.»

### CD-10 Cierre del mes

> **Empresa · Cierre.** A checklist page for one month, with the month selector on top:
>
> 1. «Factura global timbrada»
> 2. «Cobros importados»
> 3. «Facturas recibidas capturadas» (count, plus «¿faltan?»)
> 4. «Saldo del banco confirmado»
> 5. «Impuestos estimados y declarados»
> 6. «Acuses adjuntos»
> 7. «Estados del contador cargados»
>
> Each step shows done or pending, with a link to the screen where it is done. When all are
> done, the primary action is «Cerrar septiembre». A closed month shows a lock and «Cerrado el 18
> oct por …». «Reabrir» needs the second founder's approval: «Esperando a [socio]».

### CD-11 Límites (a section of Resumen, also its own drawer)

> **Empresa · Límites.** Two horizontal gauges:
>
> - «Tope de la SAS 2026: $7,678,849.94»;
> - «Tope de RESICO: $35,000,000».
>
> Each shows income so far this year, the projection to December (dashed), and marks at 60, 80
> and 95 %. Under the SAS gauge: «Al rebasarlo, la sociedad debe transformarse. Proyección: lo
> alcanzaríamos en … (si sigue el ritmo actual).»

### CD-12 Resumen (the command center home)

> **Empresa · Resumen.** The founders' weekly page.
>
> **Top: the KPI strip.** Each tile has its value, the change against the last period, and a
> tiny 6-month sparkline:
>
> - «Caja»
> - «Meses de caja»
> - «MRR»
> - «Margen bruto»
> - «EBITDA»
> - «Impuestos del mes»
> - «Tope SAS»
>
> **Left column.**
>
> - **«Señales»:** cards that appear only when a threshold is crossed or trending to it, each
>   with a one-line why and a link. Examples: «Quedan 5 meses de caja», «La infraestructura es
>   34 % del MRR desde hace 2 meses», «El CSD vence en 41 días».
> - **«Próximos vencimientos»:** the next 3 Agenda items.
>
> **Right column.**
>
> - **«Pendientes de socios»:** objections to answer, proposals to approve, a funding call to
>   pay, a notice received.
> - **«Bolsa de desempeño»:** each partner's share today, and «Si el corte fuera hoy: 52 % / 48 %».
>
> **Empty start (before any data):** a short setup list: «Registra el capital», «Configura tus
> gastos recurrentes», «Revisa la agenda fiscal».

## 4. Phase 2 boards

### CD-13 Tablero _(answer OD-4 first)_

> **Empresa · Tablero.** One quarter at a time (selector «4T 2026»).
>
> **Two columns, one per partner.** Each column's header shows:
>
> - the area;
> - «Comprometido $X»;
> - «Entregado $Y»;
> - a bar to the 50 % line, marked «mínimo para cumplir».
>
> **Deliverable cards.** Each card shows the title, the «Criterio de terminado» (shown in full,
> it is the contract), the value, and the status chip: Comprometido, Terminado, Objetado,
> Aceptado.
>
> **Value detail.** On hover or in the detail: «Propuesto por [socio 1]: $40,000 · por [socio 2]:
> $30,000 · se usa el promedio $35,000». When the two differ by more than 2×: «Requiere
> cotización».
>
> **«Terminado».** It asks for evidence (a link or a file) and starts a visible clock: «[socio]
> tiene hasta el 22 oct para objetar».
>
> **Objections.** An objection opens a thread on the card with «Llevar al mediador».
>
> **Warnings.**
>
> - **Commitment mismatch:** «El compromiso de [socio] es menor a la mitad del de [socio]», shown
>   as a warning when the quarter is planned.
> - **Quarter close:** a banner shows each partner as cumplió or no cumplió. For an
>   incumplimiento it offers «Enviar aviso» (it drafts the notice with its consequences in plain
>   words).
>
> **New deliverable drawer.** Fields: título, responsable, criterio de terminado, «tu propuesta
> de valor», fecha. A hint under the criterion: «Escríbelo para que un tercero pueda decir sí o
> no sin preguntarte.» An agent suggestion can appear inline: «Sugerencia: …», with «Usar».

### CD-14 Acciones

> **Empresa · Acciones.** The top is a stacked bar of the 12,000 shares: each partner's base
> shares (consolidated in solid, pending in a light tint), the pool shares already assigned, the
> pool still to assign, and any forfeited shares (hatched).
>
> **Under the bar, per partner:** the percentage today, «Consolidadas 3,400 de 4,800», «Bolsa
> asignada +150», and the next consolidation date.
>
> **«Simulador del próximo corte (15 abr 2027)».** A card with the quarter-to-date values from
> the Tablero and the money credits. It shows the resulting split of the 600 shares and the
> transfer it would create: «[socio 2] transferiría 90 acciones a [socio 1]».
>
> **«Historial».** A table of cortes and share events, each with its registration status in the
> Secretaría de Economía's system and its beneficial-owner update (Pendiente / Hecho, with the
> due date).
>
> **Footer:** «Las reglas vienen del Acuerdo de fundadores. Si algo aquí no coincide con el
> acuerdo firmado, manda el acuerdo.»

### CD-15 Presupuesto y Caja

> **Empresa · Presupuesto.** The quarter's budget by category and project. Each row shows
> presupuesto, real, and a bar with the difference.
>
> A card per partner: «Tu límite de gasto sin consultar: $X al mes», with the rule in one line:
> «el mayor entre $1,000 y el 10 % del ingreso promedio de 3 meses». A spend outside the budget
> above the limit shows «Requiere aprobación de [socio]».
>
> **Empresa · Caja.** Bank balances (editable, «Confirmado el …»), «Consumo mensual
> (promedio 3 meses)», and «Meses de caja» as a big number. A 12-month chart projects cash under
> the current burn. The Fondeo strip from CD-02 and «Préstamos de socios por devolver» also
> appear here.

## 5. Phase 3 board

### CD-16 Propuestas

> **Empresa · Propuestas.** The inbox of what the agents suggest. Each card shows:
>
> - the agent («Clasificador de gastos»);
> - what it proposes, in one sentence («Registrar $412.30 de Vercel como Costo del servicio ·
>   Xangarro · deducible»);
> - «Por qué» (its rationale, expandable, with the sources it read);
> - the actions «Aprobar», «Cambiar y aprobar», «Rechazar».
>
> Approved and rejected proposals go to a «Historial» tab with who decided.
>
> Reports (the month-end narrative, the tax briefing) appear here as reading cards with
> «Marcar como leído».
>
> **A permanent line at the top:** «Los asistentes solo sugieren. Nada se registra sin que un
> socio lo apruebe.»
