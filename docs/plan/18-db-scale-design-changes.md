# DB scale — changes to request in Claude Design

The DB scale work (audit `docs/audits/db-2026-09-26.html`, branch `perf/db-scale`) changed what some
screens can do. The code ships a minimal, functional version of each change, built from existing
components, so nothing is broken while the design catches up. This file lists every UI/UX change
that work implies. Portal requests go to the portal's Claude Design project (mirrored read-only in
`design-reference/portal/`). Caja and phone requests go to the operador project
(`5dd266f3-42e7-403f-b941-95c8e6551dc6`, mirrored in `design-reference/operador/`). Afterwards the
files are pulled again with `pnpm design:pull`. `design-reference/` is never edited by hand
(ADR-058).

Each quoted block can be pasted into Claude Design as it stands. Answer the three **owner
decisions** first: they change the copy of DS-01 and DS-06.

## Owner decisions (answer before sending)

1. **Cierre and unsent rows (DS-06).** Today cierre is blocked only by rows in state `pending`.
   Rows in automatic retry, and sales captured offline and never attempted, do not block it. Should
   cierre (a) stay open and say the rows will be sent later, which keeps the register offline-first,
   or (b) block until everything is sent, which means an offline register cannot close?
   **Recommendation: (a).** **Answered 2026-09-26: (a)** — recorded in ADR-122.
2. **Search scope in Ventas y gastos (DS-01).** The placeholder promises «concepto, folio u
   operador», but search has only ever matched the concepto. Should folio and operador become
   searchable (a small server change), or should the copy shrink to «Buscar por concepto»?
3. **Tab counts (DS-01).** «Ventas N / Gastos N» used to count the whole history. They now count
   the selected period plus the search. Should that stay, with a caption, or go back to the
   history-wide count (one more query per page)?

## Portal

### DS-01 Ventas y gastos — filters answered by the server

- [ ] Status · Send the blocks below to the portal project; pull; align `app/(portal)/movimientos/*`.

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
> search when there is one: «Ventas 1,284 · en este periodo». _(Depends on owner decision 3.)_

> **Ventas y gastos — paging a long period.** The pager «Mostrando 11–20 de N movimientos» with
> Anterior / Siguiente stays. With a year selected, N can mean thousands of pages, so add «Ir a
> fecha» (a date picker that jumps to the page holding that day). An «Ir a página» field is an
> acceptable alternative.

> **Ventas y gastos — search.** Search runs 300 ms after typing stops. With «Personalizado» and no
> dates, show the hint «Elige un periodo para buscar más rápido» under the field. Placeholder:
> «Buscar por concepto» _(or keep «…folio u operador» if owner decision 2 widens the search)_.

> **Ventas y gastos — detail drawer, «Lo que llevó».** The drawer lists every line of the ticket,
> including lines the search filtered out or the page cut off. Confirm this. The ticket is the unit
> the customer paid for.

### DS-02 Exportar — every row, with a preparing state

- [ ] Status · Send; pull; add the inventory export entry point.

**Why.** «Exportar movimientos» (inventory) was silently cut to 50 rows, and its «Cantidad» column
was always 0. Both are fixed, and exports now read in batches of 5,000. A large tenant's export
takes a few seconds, and today no screen links to the inventory export at all.

> **Productos › Movimientos — «Exportar movimientos».** Add a secondary button «Exportar
> movimientos» (xlsx) to the tab header, like the Ventas y gastos export.

> **Every export — preparing and failing.** After the click, the button reads «Preparando tu
> archivo…» with a spinner and is disabled until the download starts. On failure, show a toast
> «No pudimos generar el archivo. Intenta de nuevo.»

### DS-03 Sincronización › Historial — the last 30 days

- [ ] Status · Send; pull; align the historial card.

**Why.** The history aggregated every receipt ever written (897 ms for a whale, and growing). It
now reads the last 30 days.

> **Sincronización › Historial.** Card subtitle «Últimos 30 días». Empty state: «Sin actividad de
> sincronización en los últimos 30 días.»

### DS-04 Productos › Movimientos — the newest 50

- [ ] Status · Send; pull.

> **Productos › Movimientos — footer.** Replace «Mostrando 50 movimientos» with «Mostrando los 50
> más recientes · Exportar todos», where «Exportar todos» is the DS-02 export.

## Caja (operador) and phone

### DS-05 Sync status — «Reintentando»

- [ ] Status · Send to the operador project; pull; wire `retryAt` into the caja header pill,
      Registros por enviar and the phone pill (`packages/ui/src/sync/cloud-sync-status.ts`).

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

- [ ] Status · Owner decision 1 answered: (a) (ADR-122). Minimal version shipped (DB3-CAJA-02): the
      amber band with the copy below, «Reintentar envío» and «Ver cuáles» kept, the close enabled;
      the blocked design's «Puede cambiar» chip, its «Espera a que se envíen…» hint and the
      «la diferencia se vuelve a calcular» line are gone. The closed screen says «Pedro lo verá en su
      portal cuando se envíen los registros.» Still to do: send option (a)'s block; pull; align.

> **Cierre — option (a), recommended.** Banner (warning tone): «Tienes N registros por enviar (M se
> reintentarán solos). Puedes cerrar; se enviarán cuando vuelva la conexión.» Cierre stays enabled.

> **Cierre — option (b).** Keep «Primero se tienen que enviar los registros pendientes.» Count
> rows in retry and never-attempted rows too, and add «Reintentar envío» next to it.

### DS-07 Registros por enviar — last and next attempt

- [ ] Status · Send; pull.

**Why.** A row can no longer be stranded as «pendiente» (audit DB2-DEV-01). After a failed batch,
or 10 minutes with no answer, it moves to «en reintento» on a jittered backoff.

> **Registros por enviar — each row in retry.** Second line in gray: «Último intento: hace 3 min
> · Próximo: en 2 min». When the server rejected the row, keep the existing rejection sentence
> instead.

## Added by the round-3 audit (`docs/audits/db-2026-09-26-r3.html`)

### DS-08 Caja — already open in another tab

- [ ] Status · Web Lock wired and a minimal version shipped (DB3-CAJA-01, ADR-122): Acceso's frame
      (Don preocupado) with the two lines and «Usar esta pestaña», which waits in the lock's queue
      («Esperando a que se cierre la otra pestaña…»). No «Cerrar esta pestaña» link: a script can
      only close a tab it opened. Still to do: send the block below; pull; align.

**Why.** Two tabs of the caja each keep their own copy of the local database, and the last one to
save erases the other's unsent sales. The fix lets one tab hold the register; the second tab needs
a screen.

> **Caja — second tab.** Full-screen notice in place of the register: «La caja ya está abierta en
> otra pestaña.» Secondary line: «Para no perder ventas, usa una sola pestaña.» Primary button
> «Usar esta pestaña» (takes the register over once the other tab closes); link «Cerrar esta
> pestaña».

### DS-09 Estados — the custom range has a limit

- [ ] Status · Send to the portal project; pull; enforce the cap server-side (audit DB3-EST-01).

**Why.** «Personalizado» accepted any range, and a multi-year range loads the whole history into
memory. The range is capped at 13 months.

> **Estados — Personalizado.** The date picker allows at most 13 months. Past that, the second date
> shows the inline error «Elige un periodo de hasta 13 meses.» and «Aplicar» stays disabled. For
> longer periods, a help link: «¿Necesitas más? Exporta tus movimientos.»

### DS-10 Linking a big business — the first download comes in pages

- [ ] Status · Send to the operador project; pull; show the progress on the caja's «Conectar esta
      caja» and the phone's activation (audit DB3-BOOT-01, ADR-120).

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
