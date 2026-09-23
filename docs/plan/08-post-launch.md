# Track Z — Post-launch (after X-10)

> Ordered by expected value. Each has a **trigger** — do not start it before the trigger is true.

---

### Z-01 `ventasCredito` — first portal-delivered feature (Q10)

- [ ] Status · **Trigger:** launch done; ≥ 1 customer asks for fiado, or 30 days after launch.
- **Scope:** app: un-hide Clientes picker/quick-create, Cuentas por Cobrar card, Entregas de Crédito, registrar pago; portal: Clientes module (list, detail, history, CxC aging), Dashboard CxC tile; sync: tables already in scope (§8) — verify end-to-end; flags: `PLATFORM_AVAILABLE.ventasCredito = true`, plan inclusion Emprendedor+; Maestro + Playwright flows.
- **Acceptance:** Director toggles it on in Funciones → app shows credit flow on next pull; tests green.

### Z-02 Portal group-2 screens

- [ ] Status · **Trigger:** Z-01 or customer demand.
- **Scope:** Indicadores (KPIs from domain), Caja reports (turnos, discrepancias — port `CajaReportes` intent), Gastos recurrentes templates (portal CRUD; app already fires them), Alertas inbox (stock-low history, rejections digest), Merma/Conversion/Auditoría reports when those flags go live.

### Z-03 CFDI automation (PAC)

- [x] Done: dropped — superseded by N-33 (ADR-070), pulled forward to launch · Original status · **Trigger:** ≥ 50 paying businesses **or** > 2 h/month spent issuing manually.
- **Scope:** Facturama or SW Sapien; CSD upload; webhook `invoice.paid` → CFDI issue → XML/PDF to storage → `factura_requests.issued` → email; cancellations; complemento de pago for OXXO/SPEI-settled invoices.

### Z-04 Extract `apps/api`

- [ ] Status · **Trigger:** sync p95 latency > 800 ms at the handler, or Vercel function limits hit, or a second client (e.g. a future POS) needs the API without the portal.
- **Scope:** move `apps/web/src/app/api/v1/*` adapters to `apps/api` (Hono/Fastify), same `packages/application` use cases; portal keeps server actions. Conformance suite (C-10) must pass unchanged.

### Z-05 Stripe payouts → ventas importer (dogfood)

- [ ] Status · **Trigger:** X-04 running for 2 months.
- **Scope:** scheduled job in the portal: for the Xangarro business only, each Stripe payout → one venta (categoría Suscripciones, método Transferencia, fecha = arrival) with fee as a gasto (comisiones). Idempotent by payout id.

### Z-06 Informe mensual para el contador (PDF, Pro)

- [x] Status · **Trigger:** first Pro customer.
  - Done before its trigger (verified by the 2026-09-22 doc audit):
    `apps/web/src/app/api/export/informe-mensual/route.ts`, gated by the ADR-090 `informeMensual`
    capability (Xangarrote), not by the old "Pro" bucket. Shipped with P-34.
- **Scope:** server-rendered PDF (Estado de Resultados + ventas/gastos por categoría + notas), shareable link, WhatsApp share button; gated to Pro via flags.

### Z-07 Multi-sucursal

- [ ] Status · **Trigger:** first customer with two locations on Pro.
- **Scope:** uses `business_members` already; adds business grouping (`billing.organizations`) and a consolidated dashboard; devices stay bound to one business.

### Z-08 Background sync (Android WorkManager / iOS BGTaskScheduler)

- [ ] Status · **Trigger:** telemetry shows > 10 % of sales reaching the cloud > 1 h after capture.
- **Scope:** opportunistic background drain; never a dependency.

### Z-09 Internal support app (Q16 option C)

- [x] Done: dropped — superseded by N-05 … N-10 (`apps/backoffice`, ADR-063), pulled forward to launch · Original status · **Trigger:** the same Studio query is run weekly by a non-engineer, or support volume > 10 tickets/week.
- **Scope:** separate `apps/internal`, separate auth (staff SSO), separate DB role, IP-restricted; never a route in the portal.

### Z-10 Annual pricing + plan changes proration

- [x] Done: dropped — superseded by N-01 (ADR-067), pulled forward to launch · Original status · **Trigger:** churn or requests.
- **Scope:** second Stripe Price per plan; Customer Portal already handles switch/proration.

### Z-11 Pro extras: audit history + per-operator permissions UI

- [ ] Status · **Trigger:** first Pro customer.
      **Remaining (2026-09-23, verified against the code):** only the audit-history screen (from `sync_log` / `cancelacion_logs`); the per-operator permissions editor already exists as P-05 (`equipo/operador-actions.tsx`, plan-gated, single key `canCancelSales`).
- **Scope:** `users.permissions` JSON editor in Operadores (portal), app enforces (already reads permissions); audit history screen from `sync_log` + `cancelacion_logs`.

### Z-12 Sale-confirm sound: commission new audio (ADR-054 §7)

- [ ] Status · **Trigger:** brand work budget.
- **Scope:** replace `sale-confirm.mp3`; no code change.
