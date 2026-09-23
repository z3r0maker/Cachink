# Pendientes — tablero generado

> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla
> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en
> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;
> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las
> líneas Done siguen en cada track: aquí sólo está lo que falta, en tres listas, con su disparador
> o bloqueo y la línea exacta de donde viene.

## Lanzamiento (99)

Lo que la X-10 espera: los `[LAUNCH]` de Track N, las X-, las acciones del dueño y la preparación legal.

### `07-launch.md`

- [ ] **X-01** Staging environment (Q17 "A later") — Blocked by: B-01…B-10 · Falta: the repo is ready (`eas.json` splits preview/production env and entitlement keys; both `vercel.json` pin `pdx1`) but `docs/ops/provisioning.md` has no staging section and `scripts/hosted/*` targets one database; the `xangarro-staging` Supabase project, the Vercel Preview env, the Stripe test binding and the separate keypair are all outside the repo. · `07-launch.md:10`
- [ ] **X-02** End-to-end integration run (real app ↔ real backend) — Blocked by: X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · `07-launch.md:18`
- [ ] **X-03** Partner migration — Blocked by: X-02 · `07-launch.md:24`
- [ ] **X-04** Xangarro as tenant #1 (dogfooding) — Blocked by: X-02 · `07-launch.md:30`
- [ ] **X-05** Store listings + review readiness — Blocked by: F-01, A-15, X-07, B-04 · Falta: `app.json` is renamed (Xangarro!, `mx.xangarro.mobile`) and `store:screenshots` exists, but `docs/store/listing-*.md` still points support/privacy/terms at `cachink.mx`, the copy is pre-pivot (modo local, Director, LAN sync), there are no review notes (demo account, «no purchase flow»), and `eas.json` `submit.production` has no `ascAppId`. · `07-launch.md:38`
- [ ] **X-06** CLAUDE.md amendments (human applies) — Blocked by: — (can be prepared any time; apply at launch) · `07-launch.md:45`
- [ ] **X-07** Brand masters + derivatives (ADR-054 §6) — Blocked by: logo work (external) · `07-launch.md:62`
- [ ] **X-08** Repo + directory rename (optional, coordinate) — Blocked by: A-15 · `07-launch.md:68`
- [ ] **X-09** ROADMAP.md reset — Blocked by: X-02 · `07-launch.md:74`
- [ ] **X-10** Launch checklist gate — Blocked by: X-01…X-09 (except X-08) · `07-launch.md:80`

### `09-next-features.md` · 2. Launch blockers

- [~] **N-01** Stripe: annual prices + trial on both paid tiers `[LAUNCH]` — Blocked by: B-10, C-12 · Falta: the Suscripción screen hard-codes `iniciarPrueba(planId, 'month')` — no annual option, no «Cambiar a anual», nothing calls `pagarAnualPorSpei`, cards show «MXN / mes» without «+ IVA» (`planes.ts`). Gateway, catalog, card-less trial and SPEI `send_invoice` code are done. The four-price Checkout run needs O-12. · `09-next-features.md:65`
- [~] **N-02** Server usage metering `[LAUNCH]` — Blocked by: C-12, B-08 · Falta: nothing counts at push time (push route and `pg-push-store.ts` never touch usage — build it or amend How to «nightly recount is enough»); no drift-injection test. · `09-next-features.md:106`
- [~] **N-03** Overage warnings and provider alerts `[LAUNCH]` — Blocked by: N-02, N-08, B-14 · Falta: no portal usage banner; no app banner driven by the pulled `usage` (`usageMessageCode` is never called; `PlanLimitSheet` counts locally); no contract test that a paid tenant at 150 % still syncs every row (the mock's `over-limit` scenario is unused). · `09-next-features.md:141`
- [~] **N-06** Tenants, licences and Stripe `[LAUNCH]` — Blocked by: N-05, B-10, B-06 · Falta: overrides never reach the entitlement — `tenantEntitlement` (`billing/plan.ts`) reads subscriptions only and nothing outside the backoffice reads `plan_overrides`; billing columns still come from `unknownBillingSource` (`tenants/wiring.ts`) although B-10's table exists. · `09-next-features.md:220`
- [~] **N-07** Usage, limits and capacity `[LAUNCH]` — Blocked by: N-05, N-02 · Falta: acceptance met; sync p95 shows «sin datos» (no per-call timing table in Track B) and the card shares N-02's ticket over-count. · `09-next-features.md:250`
- [~] **N-09** Platform flags and kill switches `[LAUNCH]` — Blocked by: N-05, A-14 · Falta: `platform_flags_for_entitlement` is never read (entitlement `features` come from plan limits only); the app still uses the compiled `PLATFORM_AVAILABLE` (`use-feature-flags.ts`); no C- task for `comprobanteShare` / `cobrosIntegrados`; the portal Asesor never reads the `asesorLlm` kill switch. · `09-next-features.md:295`
- [~] **N-10** Staff alerts `[LAUNCH]` — Blocked by: N-08, B-14, B-18 · Falta: digest has no over-limit section; the dormancy section belongs to N-48 (post-launch) — amend to defer it rather than build it now; urgent delivery within a minute needs `ALERT_WEBHOOK_URL` set. · `09-next-features.md:318`
- [~] **N-11** Portal settings parity `[LAUNCH]` — Blocked by: P-08, P-15, C-15 · Falta: every setting is built (`negocio.sync.spec.ts`, `comprobantes.sync.spec.ts`, `sync.spec.ts` Funciones, `avisos-configurar.spec.ts`; the ISR confirm became a switch per ADR-082); only the mapping checklist (portal / device A-12 / dropped-why) is missing. A-01 finished 2026-09-16, so «blocks A-01» is moot. · `09-next-features.md:345`
- [~] **N-12** "Platícanos de ti" wizard `[LAUNCH]` — Blocked by: N-11, N-19 · Falta: acceptance met (`suggested-plan-table.test.ts`, 535ceaa1). Business type and WhatsApp answers are never saved although `businesses.tipo_negocio` / `whatsapp` exist (`AplicarConfiguracionUseCase` writes only name + payment methods); step 6 records `hasLogo` with no upload (N-19); answers live in `business_onboarding`, not `businesses.onboarding` — documented, not ratified by an ADR. · `09-next-features.md:359`
- [~] **N-17** Saldos iniciales template `[LAUNCH]` — Blocked by: N-16, C-20 · Falta: the «¿Cómo empiezo?» checklist has no saldos iniciales row (`onboarding/checklist.ts`); no end-to-end test shows the portal Balance matching the captured figures (only the domain and data-pg unit/integration tests). The SQLite half listed as «still to do» landed in 23c7fd43. · `09-next-features.md:453`
- [~] **N-19** Logo + brand colour `[LAUNCH]` — Blocked by: C-15 · Falta: the phone does not download or cache the logo (nothing fetches `/api/logos`; 73324085 only added the branding columns), so «renders offline» is unmet. The monthly-PDF logo (02b207da) is done — drop it from «still to do». · `09-next-features.md:521`
- [~] **N-21** WhatsApp share `[LAUNCH]` — Blocked by: N-20 (done) · web half landed 2026-09-20 · Falta: phone half only: no Android send to a preset number (`share-image.ts` opens the generic sheet), no «Enviar como texto», no Maestro flow to the hand-off, no Android-fallback unit test. Blocked on N-24. · `09-next-features.md:581`
- [ ] **N-22** App sync banners `[LAUNCH]` — Blocked by: A-06, A-07, N-24 · `09-next-features.md:615`
- [ ] **N-24** Phone app adopts the Track O operator design `[LAUNCH]` — Blocked by: merge of `rename/xangarro-stored-ids`; each Track O screen closed (O-xx) before its phone counterpart starts · `09-next-features.md:653`
- [ ] **N-25** QR device pairing `[LAUNCH]` — Blocked by: C-14, B-11, P-06, A-04, N-24 · `09-next-features.md:669`
- [~] **N-26** Security audit `[LAUNCH]` — Blocked by: N-05, B-17 · Falta: 3 of 6 highs fixed (SEC-AUTH-01/02, SEC-SEC-01); SEC-DEV-01 half (the `EMAIL_MISMATCH` oracle, C-14); SEC-DATA-01 is the owner switch O-2; SEC-PRIV-01 is N-34. Mediums in scope still open: SEC-SUP-01 (no dependency/secret scanning in `ci.yml`), SEC-WEB-01 (no security headers/CSP in `apps/web/next.config.mjs`). The hosted re-run needs X-01. · `09-next-features.md:686`
- [~] **N-27** Database audit `[LAUNCH]` — Blocked by: B-03, B-08, B-09 · Falta: fixed: DB-SYNC-01, DB-IDX-01 (8666e6ce), DB-QRY-01, DB-MIG-01. Open: DB-RLS-01 (app-role DELETE revoked only on newer tables, not the ledger), DB-MIG-02 (`supabase/migrations/0001_schema.sql` still in the tree), DB-OPS-01 (PITR + drill = O-3), DB-SYNC-02 (unverified). `pg_stat_statements` re-run needs the hosted project. · `09-next-features.md:704`
- [ ] **N-28** Performance audit `[LAUNCH]` — Blocked by: X-01 · `09-next-features.md:718`
- [ ] **N-29** Deterministic full-stack E2E gate `[LAUNCH]` — Blocked by: P-17, A-16, N-22, N-25 · `09-next-features.md:726`
- [ ] **N-30** Closed beta `[LAUNCH]` — Blocked by: X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29 · `09-next-features.md:736`
- [~] **N-32** Store-compliance sweep `[LAUNCH]` — Blocked by: N-24, A-15 · Falta: **`pnpm lint:store` fails on `main` with 20 violations** since the `rename/xangarro-stored-ids` merge (`planLimit.*`, `planBanner.fellBack`, `settings.plans.*`, `activate.*`, `productos.editInPortal` in `es-mx.ts`) — the «main: 0 violations» note is stale; `lint:store` is not in `ci.yml`; no reviewer checklist for X-05 in `docs/store/`. · `09-next-features.md:775`
- [~] **N-34** Aviso de privacidad + ARCO requests `[LAUNCH]` — Blocked by: N-08 · Falta: the aviso integral is reachable from no surface (no route, footer or landing link); no ARCO form or `kind=arco` inbox item or due-date clock; consent captured only at signup (48bca19c, `privacy_consents`, migration 0034 — hosted apply pending), not for device linking or operator NIP; PRIV-GEO-01, PRIV-IA-01/02, PRIV-OPS-01 open; self-service deletion and consent withdrawal not built. Counsel review is O-17. · `09-next-features.md:799`
- [~] **N-33** CFDI automation for Xangarro's own subscriptions `[LAUNCH]` — Blocked by: B-10, P-10, N-08 · Falta: refund → PAC cancellation not wired (`cancel-cfdi-for-refund.ts` exists, nothing calls it; refunds only file an inbox item); egreso for partial refunds not built. Off-mode, duplicate-webhook and monthly-close criteria have unit tests. Sandbox stamps need Facturapi test keys (O-15); fiscal defaults need O-14. · `09-next-features.md:848`

### `11-pre-launch-and-deferred.md` · 1. Pre-launch actions (owner)

- [ ] **O-2** Turn Data API off · `11-pre-launch-and-deferred.md:25`
- [ ] **O-3** Backups / PITR on a paid plan · `11-pre-launch-and-deferred.md:26`
- [ ] **O-4** Vercel project `xangarro-web`, Root Directory `apps/web`, domain `app.xangarro.mx`, region pdx1 · `11-pre-launch-and-deferred.md:27`
- [ ] **O-5** Vercel project `xangarro-backoffice`, Root Directory `apps/backoffice`, domain `admin.xangarro.mx`, region pd… · `11-pre-launch-and-deferred.md:28`
- [ ] **O-6** Vercel project `xangarro-landing`, Root Directory `apps/landing`, domain `xangarro.mx` · `11-pre-launch-and-deferred.md:29`
- [ ] **O-7** Check the Vercel plan allows 4 cron jobs and pinned regions · `11-pre-launch-and-deferred.md:30`
- [ ] **O-8** Database URLs per role (Transaction pooler, port 6543) · `11-pre-launch-and-deferred.md:31`
- [ ] **O-9** Generate secrets: `DEVICE_TOKEN_SECRET`, `CRON_SECRET`, `ADMIN_INGEST_SECRET` (same in both apps), `ADMIN_TOT… · `11-pre-launch-and-deferred.md:32`
- [ ] **O-10** Archive `z3r0maker/CachinkLanding` on GitHub (do not delete) · `11-pre-launch-and-deferred.md:33`
- [ ] **O-11** `gh auth login` on the dev machine · `11-pre-launch-and-deferred.md:34`
- [ ] **O-12** Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`) in web env; save a … · `11-pre-launch-and-deferred.md:40`
- [ ] **O-13** Resend: add domain `xangarro.mx`; DNS records from `docs/ops/email.md` (MX + SPF on `send.`, DKIM `resend._do… · `11-pre-launch-and-deferred.md:41`
- [ ] **O-14** Contador sign-off on CFDI questions: PUE vs PPD for SPEI paid-on-receipt; ClaveProdServ `81112106` / unit `E4… · `11-pre-launch-and-deferred.md:47`
- [ ] **O-15** Generate the CSD (Certificado de Sello Digital) in CertiSAT with the e.firma · `11-pre-launch-and-deferred.md:48`
- [ ] **O-16** Until `live`: issue CFDIs manually in the SAT portal from the backoffice "Pagos sin CFDI" list; mark each pay… · `11-pre-launch-and-deferred.md:49`
- [ ] **O-17** Counsel review of `docs/legal/aviso/*` (16 open questions in its README), incl. whether ADR-064's 6-year dorm… · `11-pre-launch-and-deferred.md:50`
- [ ] **O-18** Counsel opinion: a platform that never holds funds and takes no fee is outside Ley Fintech / Banxico aggregat… · `11-pre-launch-and-deferred.md:51`
- [ ] **O-19** Contact Clip's partner team (sdk@payclip.com): OAuth/partner programme, a test device, bulk PinPad installs · `11-pre-launch-and-deferred.md:52`
- [ ] **O-22** Staging (X-01) before the first paying customer · `11-pre-launch-and-deferred.md:60`

### `../launch/production-readiness.md` · 0. The one thing everything waits on

- [ ] BLOCKER — Legal entity named. `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`, · `../launch/production-readiness.md:10`

### `../launch/production-readiness.md` · 1. Legal texts

- [~] Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based). · `../launch/production-readiness.md:18`
- [~] Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`. · `../launch/production-readiness.md:19`
- [~] Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`). · `../launch/production-readiness.md:20`
- [~] Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`. · `../launch/production-readiness.md:21`
- [~] Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`. · `../launch/production-readiness.md:22`
- [ ] BLOCKER — Lawyer's review of the five texts + the five confirmations in · `../launch/production-readiness.md:23`
- [ ] Plantilla de aviso for the negocio's own customers (OQ-L16). · `../launch/production-readiness.md:25`
- [ ] Retire `docs/legal/privacy.md` and `docs/legal/terms.md` once the above are approved. · `../launch/production-readiness.md:26`
- [ ] Fill the three `[PAÍS]` cells in aviso §6.1 (error monitoring, mail, messaging) and the · `../launch/production-readiness.md:27`

### `../launch/production-readiness.md` · 2. Consent capture (PRIV-REG-01) — implemented 2026-09-22

- [ ] BLOCKER — Apply migration 0034 to hosted (`pnpm --filter @xangarro/data-pg db:migrate:hosted`); · `../launch/production-readiness.md:40`
- [ ] Run the Playwright onboarding spec against a database (`apps/web/e2e/onboarding.spec.ts` gained · `../launch/production-readiness.md:42`
- [ ] SOON — Nightly seal job: call `xangarro.privacy_consents_day_root(day)` and obtain a · `../launch/production-readiness.md:44`
- [ ] Archive the full text of every `AVISO_VERSION` (a hash without its text proves nothing) — · `../launch/production-readiness.md:46`
- [ ] Configuración → Privacidad: show accepted version, toggle novedades (writes a · `../launch/production-readiness.md:48`
- [ ] Re-consent gate on login when a version adds a finalidad (art. 11); banner otherwise. · `../launch/production-readiness.md:50`
- [ ] Decide checkbox vs. button-as-consent with the lawyer (OQ-N7); today: checkbox. · `../launch/production-readiness.md:51`

### `../launch/production-readiness.md` · 3. Rights the aviso promises (must exist before the aviso is public)

- [ ] BLOCKER — Self-service account deletion in the portal (export → confirm → cancel Stripe → · `../launch/production-readiness.md:55`
- [ ] In-app "Desvincular y borrar los datos de este dispositivo" (aviso §7 currently admits · `../launch/production-readiness.md:58`
- [ ] ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day · `../launch/production-readiness.md:60`
- [ ] Retention calendar implemented per table (OQ-L13 numbers once confirmed); 72-month rule for · `../launch/production-readiness.md:62`
- [ ] Breach protocol with the Reglamento art. 65 field list, a named person, and the 72 h clause to · `../launch/production-readiness.md:64`
- [ ] Verify Sentry server-side captures no PII before the aviso says so. · `../launch/production-readiness.md:66`

### `../launch/production-readiness.md` · 4. Subscriptions (LFPC art. 76 Bis VIII–IX, in force 2025-12-13)

- [ ] BLOCKER — Cancel in one click from Configuración → Suscripción. · `../launch/production-readiness.md:70`
- [ ] BLOCKER — Renewal reminder e-mail ≥ 5 business days before each charge, with a one-click · `../launch/production-readiness.md:71`
- [ ] Recurring-charge consent screen at checkout: frequency, amount, date, express acceptance. · `../launch/production-readiness.md:73`
- [ ] Price increases: 30-day notice + express re-acceptance flow. · `../launch/production-readiness.md:74`
- [ ] Address, phone and complaint channel visible before contracting (landing + checkout). · `../launch/production-readiness.md:75`
- [ ] Legal links (aviso, términos) in the landing footer, the portal footer, e-mail footers. · `../launch/production-readiness.md:76`

### `../launch/production-readiness.md` · 5. Stores

- [ ] BEFORE-STORES — Apple Privacy Nutrition Label + privacy manifest; Play Data Safety form — · `../launch/production-readiness.md:80`
- [ ] BEFORE-STORES — Terms and privacy URLs live (`xangarro.mx/privacidad`, `/terminos`) and · `../launch/production-readiness.md:82`
- [ ] BEFORE-STORES — Reviewer notes explaining the device + NIP model (no in-app account, no · `../launch/production-readiness.md:84`
- [ ] Open-source licence notices screen generated from `pnpm licenses list --prod` (1,184 pkgs, no · `../launch/production-readiness.md:86`
- [ ] Never add Sign in with Apple/Google to the mobile app (would trigger 5.1.1(v)). · `../launch/production-readiness.md:88`

### `../launch/production-readiness.md` · 6. Third parties and contracts

- [ ] Signed DPAs: Supabase, Vercel, Sentry, Stripe, mail provider, PAC, Microsoft (Foundry), · `../launch/production-readiness.md:92`
- [ ] Foundry hosting option decided and configured (Hosted on Azure, US DataZone recommended); · `../launch/production-readiness.md:94`
- [ ] `ASESOR_LLM_*` never pointed at a personal proxy with real tenant data (add a guard). · `../launch/production-readiness.md:96`
- [ ] Rule: the Asesor's model boundary stays the only module that knows a model exists; the IA · `../launch/production-readiness.md:97`

### `../launch/production-readiness.md` · 7. Product hygiene with legal weight

- [ ] Receipt (`comprobante`) carries "Este comprobante no es un CFDI" and the negocio's name as · `../launch/production-readiness.md:103`
- [ ] Attribution retention rule for `signup_attribution` (geo has 400 days; propose the same). · `../launch/production-readiness.md:105`
- [ ] Landing beacon disclosed in the aviso (done) and a footer link on `xangarro.mx` (open). · `../launch/production-readiness.md:106`
- [ ] Marketing e-mail: opt-out honoured within the 5-day window; REPEP if phone/SMS ever used. · `../launch/production-readiness.md:107`
- [ ] Advertising claims on the landing are demonstrable (LFPC art. 32). · `../launch/production-readiness.md:108`

### `../launch/production-readiness.md` · 8. Intellectual property and governance

- [ ] BLOCKER — IMPI trademark search and filing for "Xangarro" (classes 9, 35, 36, 42) before · `../launch/production-readiness.md:112`
- [ ] Licences recorded for hero images/illustrations/fonts (assets beyond sounds and map data). · `../launch/production-readiness.md:114`
- [ ] Cyber-liability insurance — business decision. · `../launch/production-readiness.md:115`
- [ ] INDAUTOR software registration — optional. · `../launch/production-readiness.md:116`

## Post-lanzamiento (38)

Cada tarea tiene un disparador; no se empieza antes de que sea cierto.

### `08-post-launch.md`

- [ ] **Z-01** `ventasCredito` — first portal-delivered feature (Q10) — Trigger: launch done; ≥ 1 customer asks for fiado, or 30 days after launch. · `08-post-launch.md:9`
- [ ] **Z-02** Portal group-2 screens — Trigger: Z-01 or customer demand. · `08-post-launch.md:15`
- [ ] **Z-04** Extract `apps/api` — Trigger: sync p95 latency > 800 ms at the handler, or Vercel function limits hit, or a second client (e.g. a future POS) needs the API without the portal. · `08-post-launch.md:25`
- [ ] **Z-05** Stripe payouts → ventas importer (dogfood) — Trigger: X-04 running for 2 months. · `08-post-launch.md:30`
- [ ] **Z-07** Multi-sucursal — Trigger: first customer with two locations on Pro. · `08-post-launch.md:43`
- [ ] **Z-08** Background sync (Android WorkManager / iOS BGTaskScheduler) — Trigger: telemetry shows > 10 % of sales reaching the cloud > 1 h after capture. · `08-post-launch.md:48`
- [ ] **Z-11** Pro extras: audit history + per-operator permissions UI — Trigger: first Pro customer. · Falta: only the audit-history screen (from `sync_log` / `cancelacion_logs`); the per-operator permissions editor already exists as P-05 (`equipo/operador-actions.tsx`, plan-gated, single key `canCancelSales`). · `08-post-launch.md:63`
- [ ] **Z-12** Sale-confirm sound: commission new audio (ADR-054 §7) — Trigger: brand work budget. · `08-post-launch.md:69`

### `09-next-features.md` · 3. Post-launch

- [ ] **N-40** Provider validation + Clip partnership + legal opinion — Trigger: N-30 exit criteria met. **The Clip conversation starts now** (owner action, not gated by the trigger). · `09-next-features.md:917`
- [ ] **N-41** `PaymentProvider` port + Mercado Pago adapter — Blocked by: N-40, C-13 · `09-next-features.md:933`
- [ ] **N-42** Payment intents backend + reconciliation — Blocked by: N-41, C-13 · `09-next-features.md:941`
- [ ] **N-43** Merchant account linking in the portal — Blocked by: N-41 · `09-next-features.md:951`
- [ ] **N-44** App "Cobrar con tarjeta" — Blocked by: N-42, N-43, N-45, N-24, N-53 · `09-next-features.md:961`
- [ ] **N-45** External penetration test — Trigger: N-42 and N-43 on staging. · `09-next-features.md:970`
- [ ] **N-46** Sync health and devices — Trigger: launch + 30 days, or the first cross-tenant sync incident. · `09-next-features.md:977`
- [ ] **N-47** Broadcast announcements — Trigger: the first planned maintenance window or feature launch after go-live. · `09-next-features.md:983`
- [ ] **N-48** Dormancy lifecycle (ADR-064) — Trigger: launch + 90 days (no tenant can be dormant earlier). · `09-next-features.md:989`
- [ ] **N-49** GLM exploratory tester — Trigger: X-01 staging live and N-29 green. · `09-next-features.md:1004`
- [ ] **N-50** AI logo generation — Trigger: the ADR-059 production gate on model calls is lifted. · `09-next-features.md:1011`
- [ ] **N-51** DB scaling — Stage 2 (ADR-068) — Trigger: any of DB > 25 GB · a table > 50 M rows · sync p95 > 800 ms (N-07 card). · `09-next-features.md:1017`
- [ ] **N-52** DB scaling — Stage 3 (ADR-068) — Trigger: DB > 500 GB or > 10 000 active tenants. · `09-next-features.md:1023`
- [ ] **N-54** Facturación for merchants (white-label PAC reseller) — Trigger: N-33 `live` for 3 months, and ≥ 5 customers asking to invoice their own clients. · `09-next-features.md:1028`
- [ ] **N-53** Clip adapter — Blocked by: N-41, N-40 (Clip go) · `09-next-features.md:1039`
- [~] **N-58** Phase 4 — purchases + landing. · `09-next-features.md:1075`
- [~] **N-60** Phase 6 — ADR-092 + aviso. · `09-next-features.md:1090`
- [ ] **N-62** Cohort metrics from the fiscal address, not from IP. · `09-next-features.md:1098`
- [ ] **N-63** Negocio: MRR, churn, trial → paid — Blocked by: N-06 · Trigger: B-10 webhooks write `billing.subscriptions` for the first paying tenant (the N-06 stub is retired). · `09-next-features.md:1119`
- [ ] **N-64** Activation funnel and weekly cohorts — Blocked by: N-57 · Trigger: X-10 launch (real signups). · `09-next-features.md:1130`
- [ ] **N-65** Tenant timeline — Blocked by: N-08 · Trigger: now (every source table exists). · `09-next-features.md:1141`
- [ ] **N-66** Staff roles — Blocked by: N-05 · Trigger: the second staff member is added, or before N-68 / N-71 start — whichever is first. · `09-next-features.md:1150`
- [ ] **N-67** `/auditoria` — Blocked by: N-05 · Trigger: now. · `09-next-features.md:1160`
- [ ] **N-68** "Ver como" — time-boxed, read-only impersonation — Blocked by: N-66, N-67 · Trigger: X-10 launch and the first inbox item that could not be resolved from `/tenants/[id]` + N-65. · `09-next-features.md:1169`
- [ ] **N-69** Flag lifecycle and percentage rollout — Blocked by: N-09 · Trigger: N-09 `[x]`. · `09-next-features.md:1182`
- [ ] **N-70** Decisiones — Blocked by: N-07, N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1192`
- [ ] **N-71** Cobros: dunning, expiring trials, extend / credit — Blocked by: N-06, N-66 · Trigger: first paying tenant. · `09-next-features.md:1202`
- [ ] **N-72** Cost per tenant — Blocked by: N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1212`
- [ ] **N-73** Account health and NPS micro-survey — Blocked by: N-64, N-47 · Trigger: 50 active tenants. · `09-next-features.md:1220`
- [ ] **N-74** Promo and referral codes with attribution — Blocked by: N-64, N-01 · Trigger: X-10 launch. · `09-next-features.md:1230`

## Colas de tracks (17)

Sobrantes de tracks casi cerrados. Se verifican contra el código y se cierran o se archivan.

### `02-contracts.md` · §8 Table scope

- [ ] **C-13** Payment intents API — Trigger: N-40 go decision · `02-contracts.md:310`
- [ ] **C-14** QR activation with a long single-use token — Falta: no `qrToken` minted, stored hashed or accepted by `/activate`; no `app.xangarro.mx/activar?t=` link; the `EMAIL_MISMATCH` oracle is still live (`contracts/src/errors.ts`, `activate.ts`, `mock/handler.ts`) against the «one generic error» clause. The limiter (`activate-throttle.ts`) is done. · `02-contracts.md:321`

### `03-backend.md`

- [~] **B-03** Migrations + RLS (replace hand-written SQL) — Blocked by: B-02 · Falta: `drizzle/0001_rls.sql` grants directly to `xangarro_app` and its `tenant_isolation` policies carry no `TO` clause (not pushable to hosted as written; `supabase-compat.integration.test.ts` pins that). The reset + hand-minted-JWT recipe in Acceptance is superseded by ADR-061 — local is plain Postgres, the suite is `tests/rls.integration.test.ts`. 2026-09-17 · Local Supabase compat layer (`local/0000_supabase_compat.sql`, ADR-061); `NULLIF` fix for the 22P02 that made an empty `request.jwt.claims` error every RLS query; `CREATE ROLE … PASSWORD` moved out of `drizzle/`; `0002_membership_lookup.sql` SECURITY DEFINER function. · `03-backend.md:69`
- [~] **B-04** Seed + demo business for local dev and App Review — Blocked by: B-03 · Falta: no App Review demo tenant distinct from the dev seed (only Taquería Don Pedro + the C-10 conformance tenant); `DEMOK7M3` is seeded nowhere, so «code activates the app» cannot pass. Operators, employees, devices and the three members are seeded. 2026-09-17 · Seed rewritten to satisfy its own domain schemas — ULID ids (was `p-tac`, `s1`), `'producto'`/`'semanal'` casing, two portal members (owner + viewer). `seed-contract.integration.test.ts` enforces it. · `03-backend.md:113`
- [~] **B-07** `POST /api/v1/activate` — Blocked by: C-02, C-10, B-04, B-05, B-06, B-11 · Falta: `BUSINESS_SUSPENDED` is in the contract but never thrown — archived businesses (`0016_business_archive.sql`) are not checked on activation. Slots (`NO_DEVICE_SLOTS`) and the real plan (`tenantEntitlement`, 2528ca25) are done; conformance against a live server is X-02's run. 2026-09-17 · `POST /api/v1/activate` passes the **contract's own conformance suite run against the real portal** (`pnpm --filter @xangarro/web test:conformance`, and in CI) — the same 4 assertions the mock satisfies. Redemption is one atomic UPDATE in `xangarro.redeem_activation_code` (SECURITY DEFINER, ADR-061 pattern); the concurrent-race test held 15/15, and a deliberate check-then-write version let one code bind two phones, so the test is shown to discriminate. The server parses its own response through `ActivateResponseSchema` rather than casting. · `03-backend.md:165`
- [~] **B-10** Stripe: products/prices, Checkout session, webhook, subscription state machine — Blocked by: B-02, B-03 · Falta: no daily `past_due → lapsed` job (crons are trial-emails, usage, cfdi-close); `grace_until` is derived in `compute-entitlement.ts`, not stored — decide and amend step 3 rather than tick. OXXO in step 1 is superseded by ADR-067 / N-01. `stripe listen` acceptance needs test-mode keys (O-12). Built (verified by the 2026-09-22 doc audit, not by its author): Checkout session, signed webhook `apps/web/src/app/api/stripe/webhook/route.ts`, the event → subscription-state mapping (`src/server/billing/stripe-mapping.ts`), the `stripe_events` idempotency ledger (`packages/data-pg/src/schema/billing.ts`), the seeding script `apps/web/scripts/stripe-seed.ts` and tests under `apps/web/tests/billing/`. · `03-backend.md:212`
- [~] **B-14** Transactional email — Blocked by: B-01 · Falta: templates `welcome`, `payment-failed`, `factura-issued` still missing (`packages/email/src/index.ts` exports activation-code, trial, usage-threshold, staff-digest, auth-links, generic-notice). DNS + Resend inbox check is O-13. `docs/ops/email.md` still lists activation-code as unwritten — stale. 2026-09-18 · branch `track-n/b14-email` · Resend (resend 6.28.1, @react-email/components 1.0.12, @react-email/render 2.1.0). Port + use cases in `@xangarro/application/email`; templates and adapters in the new `@xangarro/email` (Resend with Idempotency-Key and 429/5xx backoff; dev outbox `.email-outbox/` without a key). Templates: trial-ending (day 11/14), usage-threshold, staff-digest, password-reset, magic-link, generic-notice — snapshot-tested. Wired: admin digest (N-10), portal trial cron (N-01). Seams: `sendPasswordReset`/`sendMagicLink` (wired 2026-09-18 in P-02's emailed links), `notifyUsageThreshold` (N-03, for the N-02 wiring). Runbook `docs/ops/email.md`. · `03-backend.md:264`
- [~] **B-16** Back-office: Studio saved queries + support functions — Blocked by: B-03, B-11 · Falta: no «subscriptions by plan/status» saved query (unblocked now that `billing.subscriptions` exists); `billing.reissue_code` / `billing.resend_magic_link` do not exist. Studio-callable issuance is superseded by ADR-080 — drop that step. Runbook review is a human sign-off. 2026-09-17 · `supabase/studio/`: unresolved rejections, stale devices, codes expiring today, and a SQL sign-in unlock; `xangarro.security_prune()` and `xangarro.session_revoke_user()` (0006); runbook `docs/ops/back-office.md`. `support-tooling.integration.test.ts` runs every saved query on the seed and pins the SQL unlock to the app's throttle key. · `03-backend.md:292`

### `04-portal.md` · Fase 1 — Tokens y primitivas

- [~] **P-23** Primitives + Storybook inventory + visual-regression baselines — Blocked by: P-22 · Falta: `pnpm design:compare` cannot run — `package.json` points at `scripts/design-compare/compare.ts`, which is not in the repo because the unanchored `.gitignore` pattern `design-compare/` hides it (this also undercuts P-21's tick). No Storybook page in `apps/web`; Toast, gauge, nav item, switcher and user menu are unharnessed. 2026-09-22 doc audit: shipped except the `design:compare` gate in its Acceptance. In progress: 2026-09-17 · **core vocabulary built and rendering**, gate not yet closed. · `04-portal.md:245`

### `04-portal.md` · Fase 5 — Números y administración

- [~] **P-06** Dispositivos — Blocked by: P-25 · Falta: only the QR / app-link pairing panel is missing, hard-blocked on C-14 minting the token; the panel, drawer and revoke button shipped (9e7c90c1, 1183aa40). 2026-09-22 doc audit: shipped except the QR / app-link pairing panel (N-25, blocked on C-14). In progress: 2026-09-17 · the Dispositivos tab of `/equipo`. Device cards with platform label, model, operator, last sync and a pending-count pill. The **pairing panel** on flat yellow renders the eight-character code in 44×56 white boxes with the expiry countdown, "Generar otro" and "Enviar por correo". The fixture code is `K7M3DQ9P` — no `0`, `O`, `1` or `I`, per ADR-053 Q5. **Platform is a text label, never an Apple or Android logo** (design handoff). Revoke confirm carries the consequence, not just the question: "Revocar borra el acceso, no los datos ya sincronizados." 2026-09-18 · **Slots and drawer.** «X de Y dispositivos» from `PLAN_LIMITS`; when full, the pairing panel warns that a new code only works after a revoke (generation stays open: replacing a phone is «code first, then revoke», and a refused activation does not burn the code, B-12). «Ver detalle» opens the device drawer — platform as text, last sync on the business clock, its last five cortes (`cortesDeDispositivo`, 2 DB tests) and «Desvincular» for admins. Revoke was already wired to real rows. · `04-portal.md:839`

### `04-portal.md` · Fase 6 — Asesor

- [~] **P-28** Diagnóstico + estrategia — «Próximamente» in production — Blocked by: P-26, P-30 · Falta: only the tab and both gates exist (`asesor/screen.tsx`); the ten sections, month tiles, price table, estrategia list, six states, printable variant and the prompt-injection fixture are all unbuilt. 2026-09-22 doc audit: shipped except the ten report sections and the price table. In progress: 2026-09-17 · the tab and **both gates** are wired; the report itself is not built. Two gates compose in the right order via `resolveScreenState`: `capabilities.asesor === · `04-portal.md:1126`
- [ ] **P-29** Catálogo desde una foto — «Próximamente» in production — Blocked by: P-07, P-30 · `04-portal.md:1153`
- [~] **P-30** Asesor generation runtime — Blocked by: P-26, B-02, B-03 · Falta: only `server/asesor/model.ts` exists; no cron entry, no one-business route, no `notices` writes with `source='asesor'`, no Batches API / prompt caching, no fixture tests. 2026-09-22 doc audit: shipped except the cron entry, the per-business route and the batch API. 2026-09-21 · **The model boundary landed** — the single module ADR-056 requires (`server/asesor/model.ts`): env-gated, unset → null → fixtures (CI/fresh clones/ pre-credential production unchanged), set → an Anthropic SDK client pointed at whichever gateway owns the credential. 5 unit tests (null path, half-credential, live construction, model-id default + override). **Verified live** through the owner's local proxy: seeded-figure prose from `claude-opus-4-6` (ADR-056 names opus-5; `ASESOR_LLM_MODEL` bridges until the gateway catches up). Azure AI Foundry credentials for Vercel will land in the same two env vars — the owner is obtaining them. · `04-portal.md:1163`

### `05-app.md`

- [ ] **A-16** Maestro suite for the new app — Blocked by: A-04…A-10, A-15 · Falta: 133 flows exist (plan says 142). `login-operator-pin.yaml` not created; the eight pre-activation flows to delete are still present; `full-regression.sh` still buckets demo/wizard/fresh and calls `wizard-local-standalone`; the A-01/A-09 rework list is unaddressed; no green iPhone + iPad run recorded. Also owns A-15's «regression green» clause. · `05-app.md:194`

### `06-landing.md`

- [ ] **L-04** Domain + DNS + email domain — Blocked by: — (do early; ADR-054 follow-up) · Falta: owner-side only — registrar, DNS zone and Resend console (O-4 … O-6, O-13 in `11-pre-launch-and-deferred.md`); nothing in the repo can prove it. · `06-landing.md:59`
- [ ] **L-05** Store badges + legal pages — Blocked by: X-05 (real store URLs) · Falta: no privacidad/términos route on the landing and the legal texts are not linked from it; store badges wait for X-05's real URLs; `docs/legal/terms.md` mentions neither the 7-day grace nor the downgrade. · `06-landing.md:67`

### `16-design-conformance.md` · W-5 · Comprobante (Ticket)

- [ ] Status · `16-design-conformance.md:260`

## Por archivo

- `02-contracts.md` — 2 abiertos (0 en curso, 0 bloqueados, 18 hechos)
- `03-backend.md` — 6 abiertos (6 en curso, 0 bloqueados, 12 hechos)
- `04-portal.md` — 5 abiertos (4 en curso, 0 bloqueados, 29 hechos)
- `05-app.md` — 1 abiertos (0 en curso, 0 bloqueados, 17 hechos)
- `06-landing.md` — 2 abiertos (0 en curso, 0 bloqueados, 3 hechos)
- `07-launch.md` — 10 abiertos (0 en curso, 0 bloqueados, 0 hechos)
- `08-post-launch.md` — 8 abiertos (0 en curso, 0 bloqueados, 4 hechos)
- `09-next-features.md` — 53 abiertos (19 en curso, 0 bloqueados, 17 hechos)
- `11-pre-launch-and-deferred.md` — 19 abiertos (0 en curso, 0 bloqueados, 7 hechos)
- `16-design-conformance.md` — 1 abiertos (0 en curso, 0 bloqueados, 7 hechos)
- `../launch/production-readiness.md` — 47 abiertos (5 en curso, 0 bloqueados, 5 hechos)
