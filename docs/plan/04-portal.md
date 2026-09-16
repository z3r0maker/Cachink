# Track P — Admin Portal (session "Backend+Portal", part 2)

> `apps/portal` — Next.js App Router, Tailwind + shadcn/ui, Drizzle `pg-core` (`@xangarro/data-pg`),
> Supabase Auth, Recharts, Vercel. Responsive down to a tablet (it replaces the desktop app for a
> Director standing in the shop). Spanish (es-MX) UI. Reuses `@xangarro/domain` for all calculations;
> does **not** import `@xangarro/ui` (phone-shaped Tamagui — ADR-054 reasoning).
>
> Prereqs: B-01…B-05 (project, schema, migrations, seed, auth). Each screen task lists which B-task
> it needs. Tests: Vitest for server actions/pure code; Playwright for the smoke E2E (P-17).

---

### P-01 Scaffold `apps/portal`

- [ ] Status · **Blocked by:** F-04, B-01 · **Blocks:** P-02…P-17
- **Steps:** `pnpm create next-app@latest apps/portal` (App Router, TS, Tailwind, `src/`), name `@xangarro/portal`; add `shadcn` init + components `button card dialog form input table tabs badge toast sheet command dropdown-menu select`; `@supabase/ssr`; Drizzle client (`postgres` driver, `DATABASE_URL` pooled); Recharts; `zod`. Check every version on npm first. `vercel.json` with `regions: ["iad1"]`. Add to Turbo (`build`, `typecheck`, `lint`, `test`). Layout: sidebar nav (Inicio, Ventas, Gastos, Productos, Operadores, Dispositivos, Negocio, Suscripción, Sincronización) + business switcher in the header + user menu.
- **Acceptance:** `pnpm --filter @xangarro/portal dev` serves `/`; typecheck/lint green; imports `@xangarro/domain` and `@xangarro/data-pg` compile.

### P-02 Auth pages + membership guard + business switcher

- [ ] Status · **Blocked by:** P-01, B-05 · **Blocks:** all other P
- **Steps:** `/login` (magic link + password tabs), `/auth/callback`, `/reset`, `/logout`. Middleware: unauthenticated → `/login`; authenticated with zero memberships → `/signup/business` (P-03). Active business stored in a cookie `xg_business`, validated against `memberships` claim on every server action (`requireMember`). Switcher lists memberships; `viewer` sees read-only UI (no create/edit buttons; server rejects anyway).
- **Acceptance:** Playwright: magic-link flow with Supabase local inbox (`http://localhost:54324` Inbucket); viewer cannot see "Nuevo producto"; switching business changes the data shown.

### P-03 Signup flow (`/signup?plan=freelancer|emprendedor|mipyme_pro`)

- [ ] Status · **Blocked by:** P-02, B-10, B-14 · **Blocks:** X-02, L-03
- **Context:** Q18 — landing links here; account first, then payment. Free tier skips Stripe.
- **Steps:** step 1 email + password (or magic link) → Supabase user; step 2 business name + tipo de negocio → `tenant.businesses` + `business_members(owner)` + `billing.subscriptions(free)`; step 3 (paid plans) → Stripe Checkout redirect; return `/onboarding?session_id=` → verify session server-side → `/onboarding` (P-04). If the webhook hasn't arrived yet, show "Confirmando tu pago…" with polling (max 60 s) then proceed anyway (grace covers OXXO/SPEI). Plan param invalid → default freelancer.
- **Acceptance:** Playwright: free signup lands on onboarding with checklist; paid signup with Stripe test card `4242…` lands on onboarding with plan badge "Emprendedor"; OXXO test flow shows the "confirmando" state.

### P-04 "¿Cómo empiezo?" onboarding checklist

- [ ] Status · **Blocked by:** P-02 · **Blocks:** X-02
- **Context:** Q2 addition. Interactive, persistent, dismissible, reachable later from the sidebar.
- **Steps:** `tenant.businesses.onboarding JSONB` (or a small table) tracking: `fiscal_data` (optional for free), `first_operator`, `first_product` (or import), `first_device_code_issued`, `first_device_activated` (set when `/activate` succeeds), `first_sale_synced` (set by push). Each item: title, 1–2 line instruction, CTA to the screen, done state. The "activate a device" item shows the code inline + the 3 steps for the phone. Progress bar; confetti on completion (small).
- **Acceptance:** completing each real action flips the item; deep links work; state survives logout.

### P-05 Operadores

- [ ] Status · **Blocked by:** P-02, B-13 · **Blocks:** X-02
- **Steps:** list (name, active, created) · create dialog (name, PIN 4–6 digits, confirm) · set PIN · deactivate/reactivate · plan counter "2 de 2 operadores" with upsell link when full. Copy explains the PIN is what the Operator types on the phone. No email field.
- **Acceptance:** server-action tests (via B-13); Playwright: create → appears; limit reached → button disabled with tooltip; viewer read-only.

### P-06 Dispositivos

- [ ] Status · **Blocked by:** P-02, B-11, B-12 · **Blocks:** X-02
- **Steps:** list (name, platform, last sync, pending/rejected counts from `sync_rejections` + `sync_log`, status) · "Agregar dispositivo" → issues code (B-11), shows it large + copy button + "Enviar por correo a…" (B-14) + expiry countdown · "Revocar" with confirm dialog and the copy from B-12 · slot counter.
- **Acceptance:** Playwright: issue code → visible + emailed (Inbucket); revoke → status revoked; mock a device activation (B-04 seed code) → appears in list.

### P-07 Productos + Excel import

- [ ] Status · **Blocked by:** P-02, B-03 · **Blocks:** X-02
- **Steps:**
  1. Table (name, SKU, categoría, precio venta, costo, stock actual from movements, low-stock badge, icon) with search/filter/sort; create/edit sheet with the same fields as the app's `ProductoFormState` (port field list from `packages/ui/src/screens/Productos/nuevo-producto-form.ts`); icon picker porting `ICON_CATEGORIES` from `packages/ui/src/screens/Productos/icon-picker-data.ts` (move that data to `@xangarro/domain` or `packages/contracts` so both consume one list — CLAUDE.md §2.3); archive (soft delete → `deleted_at`).
  2. Every write appends `sync_log` so devices pull it (write through a `packages/data-pg` repository that does both).
  3. **Excel import**: "Descargar plantilla" (xlsx with headers `sku, nombre, categoria, unidad, costo_unitario, precio_venta, seguir_stock, umbral_stock_bajo, stock_inicial, icono`); upload → parse (`xlsx` or `exceljs`, latest) → validate rows with the domain `Producto` schema → **dry-run preview** table: new / update (matched by SKU; rows without SKU are always new) / error with reason → "Importar N" commits in one transaction; `stock_inicial` creates an `inventory_movements` entrada row. Max 5 000 rows; errors downloadable as xlsx.
- **Acceptance:** unit tests for the parser (valid, missing header, bad number, duplicate SKU in file, > 5 000 rows); Playwright: import the template with 3 rows → 3 products; re-import with one price changed → preview says 1 update.

### P-08 Negocio (settings) + datos fiscales

- [ ] Status · **Blocked by:** P-02, B-03
- **Steps:** name, tipo de negocio, régimen fiscal, ISR tasa, tipos de pago enabled, categoría de venta predeterminada, atributos de producto (port from `Settings/settings-negocio.tsx` + `settings-tasas-isr.tsx` + `tipos-de-pago-screen.tsx` field lists); **Datos fiscales** section (RFC with checksum validation, razón social, régimen, uso CFDI, CP, email facturación) → `billing.fiscal_profiles`. Writes append `sync_log` for `businesses`.
- **Acceptance:** RFC validator tests (persona física, moral, invalid checksum, lowercase normalised); save → appears on device pull (verify with mock or B-09).

### P-09 Ventas + Gastos lists with export

- [ ] Status · **Blocked by:** P-02, B-03
- **Steps:** `/ventas` and `/gastos`: date-range picker (hoy / semana / mes / custom), search, filters (método de pago, categoría, operador, dispositivo), totals in header, cancelled rows styled; row drawer with full detail; **Exportar** (CSV + XLSX) for the current filter — available on **every plan** (Q14 adjustment). Use `@xangarro/domain` formatters for centavos → MXN.
- **Acceptance:** totals equal a SQL sum for the same filter (test); export opens in Excel with correct types; viewer can export.

### P-10 Suscripción

- [ ] Status · **Blocked by:** P-02, B-10, B-06
- **Steps:** current plan card (name, price, status badge incl. `grace` with "tienes hasta <fecha>"), next charge, operators/devices usage bars, "Cambiar plan / método de pago" → Stripe Customer Portal, invoice list (Stripe), **"Solicitar factura"** per paid invoice → `billing.factura_requests` (requires fiscal profile; links to P-08 if missing), upgrade CTAs from Freelancer. Show the entitlement the devices currently receive (debug-friendly: plan + limits).
- **Acceptance:** Playwright with seed: request factura → row pending; Stripe test subscription in `past_due` → grace copy shown.

### P-11 Sincronización (sync health)

- [ ] Status · **Blocked by:** P-02, B-08 · **Blocks:** X-02
- **Steps:** per device: last push/pull, pending (unknown server-side — show "última vez visto"), **rejected rows** table (table, row id, code → human message from `ERROR_CATALOG`, payload preview, received) with "Marcar como resuelto" (sets `resolved_at`); global banner on Inicio when unresolved rejections > 0.
- **Acceptance:** seed a rejection → appears; resolve → disappears; message text comes from the catalog (test).

### P-12 Empleados

- [ ] Status · **Blocked by:** P-02, B-03
- **Steps:** CRUD for `employees` (nombre, puesto, salario, periodo) — port fields from `Settings/empleado-form-fields.tsx`; writes append `sync_log` (the app's Gastos → Nómina tab reads this list).
- **Acceptance:** create → visible on device after pull.

### P-13 Dashboard (Inicio)

- [ ] Status · **Blocked by:** P-02, P-09
- **Steps:** port `DirectorHome` intent, not code (reference: `archive/ui-screens/DirectorHome/`, `archive/ui-screens/CajaReportes/compute-report-kpis.ts`): today's ventas/gastos/utilidad tiles, 30-day sparkline (Recharts), caja status per device (open turno?), stock bajo list, cuentas por cobrar placeholder (hidden until Z-01), unresolved rejections banner, onboarding progress if incomplete. Read via `@xangarro/domain` KPI functions where they exist (`packages/domain/src/**/kpi*`).
- **Acceptance:** numbers match P-09 totals for "hoy"; renders at 768 px width without horizontal scroll.

### P-14 Estados Financieros

- [ ] Status · **Blocked by:** P-02, P-09
- **Steps:** (the archived app UI in `archive/ui-screens/Estados/` holds `health-verdicts.ts` and `estado-resultados-mappers.ts` — port their logic into `@xangarro/domain` rather than rewriting it) period picker (mes/trimestre/año/custom); NIF B-3 Estado de Resultados, B-6 Balance, B-2 Flujo de Efectivo computed with the **existing** `@xangarro/domain` functions used by `packages/ui/src/screens/Estados` (locate them; do not reimplement); print stylesheet; "Exportar Excel" (all plans). "Informe mensual PDF" button visible but gated to Pro → Z-06.
- **Acceptance:** a fixture business (seed) produces the same numbers as the domain unit tests' expectations; print preview is one page per statement.

### P-15 Funciones (feature flags, read-mostly)

- [ ] Status · **Blocked by:** P-02, F-06
- **Steps:** list every `FeatureFlagKey` with three columns: disponible (platform), incluida en tu plan, activada (tenant toggle — editable only if the first two are true; writes `businesses.feature_flags` + `sync_log`). Hidden/unavailable ones show "próximamente".
- **Acceptance:** toggling `stock` off reaches the device on next pull; toggling a platform-unavailable flag is impossible in UI and rejected server-side.

### P-16 Responsive + accessibility pass

- [ ] Status · **Blocked by:** P-05…P-14
- **Steps:** every screen at 768 px and 1024 px; keyboard nav; labels on all inputs; contrast ≥ 4.5:1 on the yellow/black palette; `pnpm lint:design` if applicable.
- **Acceptance:** axe (Playwright `@axe-core/playwright`) reports 0 serious/critical on each route.

### P-17 Portal smoke E2E (Playwright)

- [ ] Status · **Blocked by:** P-03…P-07, P-11
- **Steps:** one flow: free signup → onboarding → create operator → add product via import (3 rows) → issue device code → (call `/activate` via the conformance helper) → device appears → push one sale via the conformance helper → appears in `/ventas`. Runs against local Supabase + dev server in CI (F-08 job `portal-e2e`, allowed to be slower).
- **Acceptance:** green locally and in CI.
