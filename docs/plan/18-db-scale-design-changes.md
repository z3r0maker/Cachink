# DB scale — changes to request in Claude Design

The DB scale work (audit `docs/audits/db-2026-09-26.html`, branch `perf/db-scale`) changed what some
screens can do. The code ships a minimal, functional version of each change, built from existing
components, so nothing is broken while the design catches up. This file lists every UI/UX change
that work implies. Portal requests go to the portal's Claude Design project (mirrored read-only in
`design-reference/portal/`). Caja and phone requests go to the operador project
(`5dd266f3-42e7-403f-b941-95c8e6551dc6`, mirrored in `design-reference/operador/`). Afterwards the
files are pulled again with `pnpm design:pull`. `design-reference/` is never edited by hand
(ADR-058).

Each quoted block can be pasted into Claude Design as it stands. All three **owner decisions**
are answered, and the copy below already follows them.

## Owner decisions

1. **Cierre and unsent rows (DS-06).** Today cierre is blocked only by rows in state `pending`.
   Rows in automatic retry, and sales captured offline and never attempted, do not block it. Should
   cierre (a) stay open and say the rows will be sent later, which keeps the register offline-first,
   or (b) block until everything is sent, which means an offline register cannot close?
   **Recommendation: (a).** **Answered 2026-09-26: (a)** — recorded in ADR-123.
2. **Search scope in Ventas y gastos (DS-01).** The placeholder promises «concepto, folio u
   operador», but search has only ever matched the concepto. Should folio and operador become
   searchable (a small server change), or should the copy shrink to «Buscar por concepto»?
   **Answered 2026-09-27: widen it.** A number («412», «#412», «folio 412») finds that venta's
   folio exactly, any part of the operator's name finds the rows captured on their shifts, and the
   concepto still matches as before. Server side done in `movimientos-filtro.ts` (branch
   `feat/busqueda-folio-operador`); the page, its counts, the KPIs and the chips all follow it.
3. **Tab counts (DS-01).** «Ventas N / Gastos N» used to count the whole history. They now count
   the selected period plus the search. Should that stay, with a caption, or go back to the
   history-wide count (one more query per page)?
   **Answered 2026-09-27: they stay per period**, with the caption DS-01 asks for.

## Portal

### DS-01 Ventas y gastos — filters answered by the server

- [x] Status · done 2026-09-28: `app/(portal)/movimientos/*` follows EsVentasFiltros — the old rows
      stay dimmed under a bar while a filter is out (React transition; «Cargando movimientos…»), a
      failed read keeps them under «No pudimos cargar los movimientos. Reintentar», «Periodo: …»
      under the KPIs, «en este periodo» by the tab counts, the folio empty sentence, the
      Personalizado hint, «Ir a fecha» in the pager (`?ir=`), and the drawer lists the whole ticket.

**Why.** The screen used to load a tenant's whole history into the browser: 576K rows and 3.6 s
for a one-year Xangarrote tenant, past the production 5 s timeout with a few more months of
history. Every chip, date, category, search and page now goes to the server, and the state lives
in the URL (`?tab&rango&desde&hasta&cat&q&pagina`). Chips used to respond instantly; now the table
updates when the answer arrives.

> **Ventas y gastos — loading between filters.** When a chip, a date, the category, the search or
> the page changes, the chip lights at once and the table keeps its old rows, dimmed, with a thin
> progress bar under the table header until the new page arrives. Screen-reader text: «Cargando
> movimientos…». If the request fails, keep the old rows and show the error row «No pudimos cargar
> los movimientos. Reintentar».

> **Ventas y gastos — the period is always visible.** Under the KPI row add a caption «Periodo:
> 1–31 may» (or «Hoy», «Esta semana»). The KPIs and tab counts refer to that period, and to the
> search when there is one: «Ventas 1,284 · en este periodo».

> **Ventas y gastos — paging a long period.** The pager «Mostrando 11–20 de N movimientos» with
> Anterior / Siguiente stays. With a year selected, N can mean thousands of pages, so add «Ir a
> fecha» (a date picker that jumps to the page holding that day). An «Ir a página» field is an
> acceptable alternative.

> **Ventas y gastos — search.** Search runs 300 ms after typing stops. With «Personalizado» and no
> dates, show the hint «Elige un periodo para buscar más rápido» under the field. Placeholder:
> «Buscar por concepto, folio u operador». A number searches the folio exactly («412», «#412»),
> so an empty result for a folio reads «No hay ninguna venta con el folio 412 en este periodo.»

> **Ventas y gastos — detail drawer, «Lo que llevó».** The drawer lists every line of the ticket,
> including lines the search filtered out or the page cut off. Confirm this. The ticket is the unit
> the customer paid for.

### DS-02 Exportar — every row, with a preparing state

- [x] Status · done 2026-09-28: every `ExportButton` shows «Preparando tu archivo…» and fails with
      the one-line toast «No pudimos generar el archivo. Intenta de nuevo.»; Productos › Movimientos
      has «Exportar movimientos» (XLSX) in its header.

**Why.** «Exportar movimientos» (inventory) was silently cut to 50 rows, and its «Cantidad» column
was always 0. Both are fixed, and exports now read in batches of 5,000. A large tenant's export
takes a few seconds, and today no screen links to the inventory export at all.

> **Productos › Movimientos — «Exportar movimientos».** Add a secondary button «Exportar
> movimientos» (xlsx) to the tab header, like the Ventas y gastos export.

> **Every export — preparing and failing.** After the click, the button reads «Preparando tu
> archivo…» with a spinner and is disabled until the download starts. On failure, show a toast
> «No pudimos generar el archivo. Intenta de nuevo.»

### DS-03 Sincronización › Historial — the last 30 days

- [x] Status · done 2026-09-28: the historial card says «Últimos 30 días» and has its empty state.

**Why.** The history aggregated every receipt ever written (897 ms for a whale, and growing). It
now reads the last 30 days.

> **Sincronización › Historial.** Card subtitle «Últimos 30 días». Empty state: «Sin actividad de
> sincronización en los últimos 30 días.»

### DS-04 Productos › Movimientos — the newest 50

- [x] Status · done 2026-09-28: the footer reads «Mostrando los 50 más recientes · Exportar
      todos», the same export as the header button.

> **Productos › Movimientos — footer.** Replace «Mostrando 50 movimientos» with «Mostrando los 50
> más recientes · Exportar todos», where «Exportar todos» is the DS-02 export.

## Caja (operador) and phone

### DS-05 Sync status — «Reintentando»

- [x] Status · done 2026-09-28: EsCajaReintentando and EsMvReintentando. One wording for both
      (`pillEnvio`, `@xangarro/caja`): en línea · enviando · reintentando («Reintentando en 1 min»
      counting down to the engine's `retryAt`; «Reintentando a las 7:42 p. m.», «Reintento: 7:42
      p. m.» on the phone, when the server set Retry-After) · sin conexión (gray) · con rechazos,
      on the caja's header pill (`operador/shell/pill.tsx`) and the phone's. Registros por enviar
      turns «Reintentando» with the cause's line (ocupado / lenta / esperar) and, after «Reintentar
      envío» (now a manual run on the caja too), what happens next.

**Why.** At the evening peak the devices now back off instead of hammering the server. After a
5xx, a 429 or a timeout the engine waits 5 s, doubling to at most 5 min, and it honours the
server's `Retry-After`. Nothing on screen says so yet. The phone shows a timeout as a generic error,
and the caja shows only «en línea / sin conexión».

> **Sync pill — states.** en línea · enviando · **reintentando** · sin conexión · con rechazos.
> «Reintentando» uses the warning tone with a countdown: «Reintentando en 1 min». Helper copy in
> Registros por enviar: «El servidor está ocupado; reintentamos solos.» When the connection timed
> out: «La conexión está lenta; reintentamos solos.» When the server asked to wait: «El servidor
> pidió esperar hasta las 7:42 p. m.» «Reintentar envío» stays as the manual override. It skips
> our wait but not the server's.

### DS-06 Cierre — rows still to send

- [x] Status · done 2026-09-28: option (a) (ADR-123) as EsCajaCierre and EsMvCierre draw it: the
      band with the sync tile, «Enviando…» / «Todavía no se pudo…» after a retry, «N por enviar»
      in the summary, and «Pedro lo verá en su portal cuando se envíen los registros.» on its own
      line of the closed screen. Don's card on Por enviar says «Puedes cerrar el turno; se envían
      cuando vuelva la conexión.» (caja and phone).

> **Cierre — option (a), recommended.** Banner (warning tone): «Tienes N registros por enviar (M se
> reintentarán solos). Puedes cerrar; se enviarán cuando vuelva la conexión.» Cierre stays enabled.

> **Cierre — option (b).** Keep «Primero se tienen que enviar los registros pendientes.» Count
> rows in retry and never-attempted rows too, and add «Reintentar envío» next to it.

### DS-07 Registros por enviar — last and next attempt

- [x] Status · done 2026-09-28: each record in retry carries the chip «En reintento» and the gray
      line «Último intento: hace 3 min · Próximo: en 2 min» (`lineaIntento`, `@xangarro/caja`;
      «Próximo: a las 7:42 p. m.» when the server said when), on the caja and on the phone, whose
      reader now maps `lastAttemptAt` / `nextAttemptAt` too. A row still `pending` goes with the
      engine's next run, not its ten-minute sweep.

**Why.** A row can no longer be stranded as «pendiente» (audit DB2-DEV-01). After a failed batch,
or 10 minutes with no answer, it moves to «en reintento» on a jittered backoff.

> **Registros por enviar — each row in retry.** Second line in gray: «Último intento: hace 3 min
> · Próximo: en 2 min». When the server rejected the row, keep the existing rejection sentence
> instead.

## Added by the round-3 audit (`docs/audits/db-2026-09-26-r3.html`)

### DS-08 Caja — already open in another tab

- [x] Status · done 2026-09-28: EsCajaPestana's three states: aviso (the notice in Don's bubble,
      the date, the two tabs, the rule), esperando (the busy button, «Esperando a que se cierre la
      otra pestaña…») and sigue («La otra pestaña sigue abierta. Ciérrala y vuelve a intentar.»
      after 3 s, the claim still queued). No «Cerrar esta pestaña»: a script can only close a tab
      it opened.

**Why.** Two tabs of the caja each keep their own copy of the local database, and the last one to
save erases the other's unsent sales. The fix lets one tab hold the register; the second tab needs
a screen.

> **Caja — second tab.** Full-screen notice in place of the register: «La caja ya está abierta en
> otra pestaña.» Secondary line: «Para no perder ventas, usa una sola pestaña.» Primary button
> «Usar esta pestaña» (takes the register over once the other tab closes); link «Cerrar esta
> pestaña».

### DS-09 Estados — the custom range has a limit

- [x] Status · done 2026-09-28: the cap is enforced server-side and in the picker: the inline error
      on «Hasta», «Aplicar» disabled past 13 months or without both days in order, and the help link
      «¿Necesitas más? Exporta tus movimientos.» always under Personalizado.

**Why.** «Personalizado» accepted any range, and a multi-year range loads the whole history into
memory. The range is capped at 13 months.

> **Estados — Personalizado.** The date picker allows at most 13 months. Past that, the second date
> shows the inline error «Elige un periodo de hasta 13 meses.» and «Aplicar» stays disabled. For
> longer periods, a help link: «¿Necesitas más? Exporta tus movimientos.»

### DS-10 Linking a big business — the first download comes in pages

- [x] Status · done 2026-09-28: EsCajaDescarga, EsMvDescarga, EsMvInventarioBajando. «Conectar
      esta caja» and the phone's activation stay busy with «Descargando los datos de tu negocio…»,
      «3 de 7» and a bar (aria-live, a progressbar) until the last page; a cut download keeps what
      came and offers «Reintentar». The phone opens after the download; if it opened before (the
      app closed mid-way), Inventario shows «Terminando de descargar el inventario…» until a sync
      finishes the snapshot. Without an estimate (an older server) the count reads «Página 3».

**Why.** Linking used to download the business's whole movement history in one response, which
stopped working after about a month of a busy shop. It now downloads a snapshot in pages of at
most 5,000 rows: one page for almost every business, a handful for a busy one, and about two
dozen for a year-old whale (tens of seconds on a slow connection). Today the caja keeps «Conectando…» on the button until every page is in; the
phone opens as soon as the first page lands and the rest arrives on the first sync, so for a few
seconds its stock can read low on a very big business.

> **Caja — Conectar esta caja, while it downloads.** After the code is accepted and before the NIP
> step: the button stays busy and a line under it reads «Descargando los datos de tu negocio…»
> with a progress bar that advances per page («3 de 7»). If the connection drops mid-way: «Se
> interrumpió la descarga. Lo que ya bajó se queda; toca Reintentar.» with «Reintentar».
>
> **Phone — Activación, while it downloads.** Same line and bar on the activation screen after
> «Vincular». If the phone opens before the last page (poor connection), a slim banner under the
> top bar on Inventario: «Terminando de descargar el inventario…» until the snapshot completes.
