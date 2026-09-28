# Track M — la caja en el teléfono y la tableta (El Mostrador)

The native app (`apps/mobile` + `packages/ui`) becomes the same register as the
web caja (`apps/web/src/operador/`), in the El Mostrador language
(`docs/design/el-mostrador.md`, ADR-117). The boards are on the design canvas,
page «Teléfono y tableta» (24 phone boards `Mv*`, 3 tablet boards `Tb*`); they
translate the approved web caja boards and are the spec once the owner
approves them.

Owner decisions (2026-09-27):

- The device is for operating, not managing. The phone does exactly what the
  web caja does: no Merma tab (merma is a movement in Inventario), no
  Conversión, Auditoría, nómina, crédito or product management.
- Sales are cancelled with a reason, never edited or deleted from the caja
  (the owner's side of that is M-10).
- Four tabs: Inicio, Cobrar, Ventas, Mi turno; the rest opens from Inicio and
  Mi turno. Web side panels become bottom sheets.
- Tablets are supported: under 760 px the phone tabs; 760 to 1279 px an 88 px
  icon rail with the topbar; from 1280 px the full sidebar.

## Phases

- [x] **M-01 · Remove what the operator doesn't use.** 2026-09-27: Merma, Conversión, Auditoría, crédito, cuentas por cobrar (old), Clientes, nómina, export, sale and gasto edit/delete, unreachable hooks and charts, their tests and 38 Maestro flows (~27.6k lines).
- [x] **M-02 · Owner approves the phone and tablet boards.** Approved 2026-09-27. Canvas page «Teléfono y tableta»; changes land on the boards before code.
- [x] **M-03 · Tokens without the fork.** 2026-09-27: `theme.ts` re-exports `@xangarro/tokens` (no value differed; it gained borders.quiet, yellowRule, denseRadii, portalFontSizes), Tamagui reads it, native `Don` with the nine poses. `packages/ui/src/theme.ts` re-exports `@xangarro/tokens` (borders.quiet, yellowRule, denseRadii, font sizes) and the Tamagui config reads it; Don Cuentas poses as native assets.
- [x] **M-04 · Shared caja logic.** 2026-09-27: `@xangarro/caja` (ADR-118) holds the web caja's types, derivations, copy, fixtures and runtime read models, one subpath per screen; the web imports it and `packages/ui` depends on it. The Worker, OPFS, protocol and Drizzle readers stay in `apps/web`.
- [x] **M-05 · Shell.** 2026-09-27: tabs Inicio/Cobrar/Ventas/Mi turno (Inicio shows Mi turno until M-06), header with the caja's name and sync pill, BottomSheet/Dialog/Toast/Chip/SegmentedTabs/panels/OfflineBanner/BloqueoShell, rail from 760 px and sidebar from 1280 px, page gray200. Four tabs, header with sync pill and avisos, bottom sheet, dialog and toast primitives, lock screen, offline banner; the 88 px rail and full sidebar on tablets.
- [x] **M-06 · Entrar y empezar.** 2026-09-28: Inicio is the landing tab on the phone's data through `@xangarro/caja`; camera QR + code linking; Acceso and Bloqueo on the local NIP; Abrir turno sheet. Gaps: no business preview before redeeming a pairing token, owner messages not read yet (M-09), no fiado reader (M-08). Vincular (camera QR + code), Acceso (NIP), Abrir turno, Inicio with «Para hoy», Bloqueo.
- [x] **M-07 · Cobrar.** 2026-09-28: catalog, ticket sheet (tablet: side and docked panels), scanner with unknown-code → Producto nuevo, cobro with the four methods and cambio, fiado with the client picker, venta hecha with the N-20 comprobante sent as text. One ticket per sale via `RegistrarTicketUseCase`. Gaps: stock-low alert after a sale, quick products saved as aprobado, no image share or print. Catalog, scanner (quick add, unknown code opens Producto nuevo), ticket sheet, cobro with the four methods and cambio, venta hecha with the comprobante (N-20 SVG) through the share sheet, venta fiada, producto nuevo.
- [x] **M-08 · Dinero del turno.** 2026-09-28: Ventas (sale sheet, cancel with motive and NIP through `CancelarTicketUseCase`), Gastos (sheet, recurring due today prefilled, compra de inventario), Fiado y abonos (list, client, abono sheet, recordar saldo) with the saldo read shared in `@xangarro/caja/lectura/cuentas`; Inicio's «Por cobrar» and fiado tasks are live. Gaps: no per-ticket sync state, receipt photos, cash abonos not yet in the phone's expected cash (M-09), inventory purchases not scoped to the turno. Ventas with the sale sheet and cancel-with-reason, Gastos, Fiado y abonos with abono and recordar saldo.
- [ ] **M-09 · Mi turno y cierre.** Mi turno, Inventario (llegó mercancía, merma), Cierre with the count and the blocked state, cierre hecho, Avisos, Por enviar (the local queue, not only rejections), loading/empty/error/offline states.
- [ ] **M-10 · The owner corrects a sale.** The portal can't cancel or correct a sale today (Ventas y gastos only shows it); the caja only cancels with a reason. Decide the owner's action (cancel, change method, fix a line) and build it in the portal's sale panel with its own audit trail.
- [ ] **M-11 · Maestro rework.** Rewrite the flows per screen as each phase lands; the A-16 debt closes here.
- [ ] **M-12 · Leftovers from M-01.** Notification links to `/caja-reportes` and `/merma-reportes` (routes that no longer exist); ConsentModal has no mount; unused dependencies in `packages/ui` (react-pdf, exceljs, jspdf, html2canvas, echarts, victory-native, skia, react-hook-form).
