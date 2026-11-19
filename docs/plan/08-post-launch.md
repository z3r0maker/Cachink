# Track Z — Post-launch (after X-10)

> Ordered by expected value. Each has a **trigger** — do not start it before the trigger is true.

---

### Z-01 `ventasCredito` — primera función entregada por el portal (Q10) [media]

- [ ] Status · **Trigger:** lanzamiento completado; ≥ 1 cliente pide fiado, o 30 días después del lanzamiento.
- **Scope:** app: un-hide Clientes picker/quick-create, Cuentas por Cobrar card, Entregas de Crédito, registrar pago; portal: Clientes module (list, detail, history, CxC aging), Dashboard CxC tile; sync: tables already in scope (§8) — verify end-to-end; flags: `PLATFORM_AVAILABLE.ventasCredito = true`, plan inclusion Emprendedor+; Maestro + Playwright flows.
- **Acceptance:** Director toggles it on in Funciones → app shows credit flow on next pull; tests green.

### Z-02 Pantallas del grupo 2 del portal [baja]

- [ ] Status · **Trigger:** Z-01 o demanda de clientes.
- **Scope:** Indicadores (KPIs from domain), Caja reports (turnos, discrepancias — port `CajaReportes` intent), Gastos recurrentes templates (portal CRUD; app already fires them), Alertas inbox (stock-low history, rejections digest), Merma/Conversion/Auditoría reports when those flags go live.

### Z-03 CFDI automation (PAC)

- [x] Done: dropped — superseded by N-33 (ADR-070), pulled forward to launch · Original status · **Trigger:** ≥ 50 paying businesses **or** > 2 h/month spent issuing manually.
- **Scope:** Facturama or SW Sapien; CSD upload; webhook `invoice.paid` → CFDI issue → XML/PDF to storage → `factura_requests.issued` → email; cancellations; complemento de pago for OXXO/SPEI-settled invoices.

### Z-04 Extraer `apps/api` [baja]

- [ ] Status · **Trigger:** latencia p95 de sync > 800 ms en el handler, o límites de funciones de Vercel alcanzados, o que un segundo cliente (p. ej. un POS futuro) necesite la API sin el portal.
- **Scope:** move `apps/web/src/app/api/v1/*` adapters to `apps/api` (Hono/Fastify), same `packages/application` use cases; portal keeps server actions. Conformance suite (C-10) must pass unchanged.

### Z-05 Importador de payouts de Stripe → ventas (dogfood) [baja]

- [ ] Status · **Trigger:** X-04 corriendo desde hace 2 meses.
- **Scope:** scheduled job in the portal: for the Xangarro business only, each Stripe payout → one venta (categoría Suscripciones, método Transferencia, fecha = arrival) with fee as a gasto (comisiones). Idempotent by payout id.

### Z-06 Informe mensual para el contador (PDF, Pro)

- [x] Status · **Trigger:** first Pro customer.
  - Done before its trigger (verified by the 2026-09-22 doc audit):
    `apps/web/src/app/api/export/informe-mensual/route.ts`, gated by the ADR-090 `informeMensual`
    capability (Xangarrote), not by the old "Pro" bucket. Shipped with P-34.
- **Scope:** server-rendered PDF (Estado de Resultados + ventas/gastos por categoría + notas), shareable link, WhatsApp share button; gated to Pro via flags.

### Z-07 Multi-sucursal `[baja]`

- [ ] Status · **Trigger:** primer cliente con dos sucursales en Pro.
- **Scope:** uses `business_members` already; adds business grouping (`billing.organizations`) and a consolidated dashboard; devices stay bound to one business.

### Z-08 Sync en segundo plano (Android WorkManager / iOS BGTaskScheduler) [baja]

- [ ] Status · **Trigger:** la telemetría muestra > 10 % de las ventas llegando a la nube > 1 h después de la captura.
- **Scope:** opportunistic background drain; never a dependency.

### Z-09 Internal support app (Q16 option C)

- [x] Done: dropped — superseded by N-05 … N-10 (`apps/backoffice`, ADR-063), pulled forward to launch · Original status · **Trigger:** the same Studio query is run weekly by a non-engineer, or support volume > 10 tickets/week.
- **Scope:** separate `apps/internal`, separate auth (staff SSO), separate DB role, IP-restricted; never a route in the portal.

### Z-10 Annual pricing + plan changes proration

- [x] Done: dropped — superseded by N-01 (ADR-067), pulled forward to launch · Original status · **Trigger:** churn or requests.
- **Scope:** second Stripe Price per plan; Customer Portal already handles switch/proration.

### Z-11 Extras de Pro: historial de auditoría + UI de permisos por operador [baja]

- [ ] Status · **Trigger:** primer cliente Pro.
      **Remaining (2026-09-23, verified against the code):** Solo falta la pantalla de historial de auditoría (desde `sync_log` / `cancelacion_logs`); el editor de permisos por operador ya existe como P-05 (`equipo/operador-actions.tsx`, restringido por plan, una sola clave `canCancelSales`).
- **Scope:** `users.permissions` JSON editor in Operadores (portal), app enforces (already reads permissions); audit history screen from `sync_log` + `cancelacion_logs`.

### Z-12 Sonido de confirmación de venta: encargar audio nuevo (ADR-054 §7) [baja]

- [ ] Status · **Trigger:** presupuesto para el trabajo de marca.
- **Scope:** replace `sale-confirm.mp3`; no code change.

### Z-13 Dos cajas, o dos personas cobrando a la vez en una caja (después del MVP) [media]

- [ ] Status · **Trigger:** the first business that needs to sell from two places at once (two phones or browsers in one shop), or two people on one caja at the same time; or the first support case about either.
- **Context:** the MVP rule (M-18, ADR-071 §3, decided with the owner 2026-11-19) is one open turno per caja, a caja being one device. A second operator who signs in continues the open turno or counts and closes it, then opens their own. That covers a relay between shifts, not two people working at once. Raised by the owner when approving board `MvTurnoDeOtro`.
- **Open questions:**
  1. **Two cajas in one shop.** Each device is already its own caja with its own turno and corte. If two devices share one physical drawer, two cortes count against the same cash and both esperados are wrong. Decide whether two cajas mean two drawers, how the portal shows two cortes of the same day, and how the owner names them (`devices.nombre`, «Caja 1», «Caja 2»).
  2. **Two people on one caja at once.** Today each sale carries whoever is signed in, and changing person means the lock or «¿Quién va a cobrar?» every time. Decide whether one corte should break down sales and cash per operator, who counts at the close, and whether a quicker per-sale switch is needed.
  3. **Offline.** Two devices without a connection cannot coordinate (ADR-071 §3), so any rule that spans devices is reconciled by the cloud, never enforced on a device.
- **Scope (to decide with the owner):** an interview first. Candidates: a `cajas` entity with devices assigned to it (rejected for v1 in ADR-071), a per-operator breakdown in the corte, a day view per caja in the portal. Needs an ADR amending ADR-071 §3 and canvas boards before code.
