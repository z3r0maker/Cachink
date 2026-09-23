# Pendientes — tablero generado

> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla
> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en
> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;
> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las
> líneas Done siguen en cada track: aquí sólo está lo que falta, con su disparador o bloqueo.

## Resumen

- `02-contracts.md` — 2 abiertos (0 en curso, 0 bloqueados, 18 hechos)
- `03-backend.md` — 11 abiertos (11 en curso, 0 bloqueados, 7 hechos)
- `04-portal.md` — 5 abiertos (4 en curso, 0 bloqueados, 29 hechos)
- `05-app.md` — 2 abiertos (1 en curso, 0 bloqueados, 16 hechos)
- `06-landing.md` — 2 abiertos (0 en curso, 0 bloqueados, 3 hechos)
- `07-launch.md` — 10 abiertos (0 en curso, 0 bloqueados, 0 hechos)
- `08-post-launch.md` — 8 abiertos (0 en curso, 0 bloqueados, 4 hechos)
- `09-next-features.md` — 60 abiertos (24 en curso, 0 bloqueados, 10 hechos)
- `11-pre-launch-and-deferred.md` — 21 abiertos (0 en curso, 0 bloqueados, 5 hechos)
- `16-design-conformance.md` — 4 abiertos (0 en curso, 0 bloqueados, 4 hechos)
- `../launch/production-readiness.md` — 47 abiertos (5 en curso, 0 bloqueados, 5 hechos)

## `02-contracts.md`

### §8 Table scope

- [ ] **C-13** Payment intents API — Trigger: N-40 go decision · `02-contracts.md:310`
- [ ] **C-14** QR activation with a long single-use token · `02-contracts.md:321`

## `03-backend.md`

- [~] **B-01** Provision Supabase (local + one hosted project) and secrets layout — Blocked by: F-04 · `03-backend.md:15`
- [~] **B-02** `packages/data-pg`: Postgres Drizzle schema + drift test — Blocked by: F-04, F-07 · `03-backend.md:28`
- [~] **B-03** Migrations + RLS (replace hand-written SQL) — Blocked by: B-02 · `03-backend.md:65`
- [~] **B-04** Seed + demo business for local dev and App Review — Blocked by: B-03 · `03-backend.md:107`
- [~] **B-05** Auth: Supabase Auth config, membership claims hook, device-JWT minting — Blocked by: B-03 · `03-backend.md:124`
- [~] **B-06** Entitlement signer + computation — Blocked by: F-06, C-05, B-02 · `03-backend.md:135`
- [~] **B-07** `POST /api/v1/activate` — Blocked by: C-02, C-10, B-04, B-05, B-06, B-11 · `03-backend.md:153`
- [~] **B-10** Stripe: products/prices, Checkout session, webhook, subscription state machine — Blocked by: B-02, B-03 · `03-backend.md:198`
- [~] **B-11** Activation code issuance (portal + Studio-callable) — Blocked by: B-03 · `03-backend.md:218`
- [~] **B-14** Transactional email — Blocked by: B-01 · `03-backend.md:246`
- [~] **B-16** Back-office: Studio saved queries + support functions — Blocked by: B-03, B-11 · `03-backend.md:272`

## `04-portal.md`

### Fase 1 — Tokens y primitivas

- [~] **P-23** Primitives + Storybook inventory + visual-regression baselines — Blocked by: P-22 · `04-portal.md:245`

### Fase 5 — Números y administración

- [~] **P-06** Dispositivos — Blocked by: P-25 · `04-portal.md:837`

### Fase 6 — Asesor

- [~] **P-28** Diagnóstico + estrategia — «Próximamente» in production — Blocked by: P-26, P-30 · `04-portal.md:1122`
- [ ] **P-29** Catálogo desde una foto — «Próximamente» in production — Blocked by: P-07, P-30 · `04-portal.md:1147`
- [~] **P-30** Asesor generation runtime — Blocked by: P-26, B-02, B-03 · `04-portal.md:1157`

## `05-app.md`

- [~] **A-15** Rename sweep (copy, i18n, testIDs, file names, sound) — Blocked by: A-01, A-03, A-09, A-12 · `05-app.md:172`
- [ ] **A-16** Maestro suite for the new app — Blocked by: A-04…A-10, A-15 · `05-app.md:192`

## `06-landing.md`

- [ ] **L-04** Domain + DNS + email domain — Blocked by: — (do early; ADR-054 follow-up) · `06-landing.md:59`
- [ ] **L-05** Store badges + legal pages — Blocked by: X-05 (real store URLs) · `06-landing.md:65`

## `07-launch.md`

- [ ] **X-01** Staging environment (Q17 "A later") — Blocked by: B-01…B-10 · `07-launch.md:10`
- [ ] **X-02** End-to-end integration run (real app ↔ real backend) — Blocked by: X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · `07-launch.md:17`
- [ ] **X-03** Partner migration — Blocked by: X-02 · `07-launch.md:23`
- [ ] **X-04** Xangarro as tenant #1 (dogfooding) — Blocked by: X-02 · `07-launch.md:29`
- [ ] **X-05** Store listings + review readiness — Blocked by: F-01, A-15, X-07, B-04 · `07-launch.md:37`
- [ ] **X-06** CLAUDE.md amendments (human applies) — Blocked by: — (can be prepared any time; apply at launch) · `07-launch.md:43`
- [ ] **X-07** Brand masters + derivatives (ADR-054 §6) — Blocked by: logo work (external) · `07-launch.md:60`
- [ ] **X-08** Repo + directory rename (optional, coordinate) — Blocked by: A-15 · `07-launch.md:66`
- [ ] **X-09** ROADMAP.md reset — Blocked by: X-02 · `07-launch.md:72`
- [ ] **X-10** Launch checklist gate — Blocked by: X-01…X-09 (except X-08) · `07-launch.md:78`

## `08-post-launch.md`

- [ ] **Z-01** `ventasCredito` — first portal-delivered feature (Q10) — Trigger: launch done; ≥ 1 customer asks for fiado, or 30 days after launch. · `08-post-launch.md:9`
- [ ] **Z-02** Portal group-2 screens — Trigger: Z-01 or customer demand. · `08-post-launch.md:15`
- [ ] **Z-04** Extract `apps/api` — Trigger: sync p95 latency > 800 ms at the handler, or Vercel function limits hit, or a second client (e.g. a future POS) needs the API without the portal. · `08-post-launch.md:25`
- [ ] **Z-05** Stripe payouts → ventas importer (dogfood) — Trigger: X-04 running for 2 months. · `08-post-launch.md:30`
- [ ] **Z-07** Multi-sucursal — Trigger: first customer with two locations on Pro. · `08-post-launch.md:43`
- [ ] **Z-08** Background sync (Android WorkManager / iOS BGTaskScheduler) — Trigger: telemetry shows > 10 % of sales reaching the cloud > 1 h after capture. · `08-post-launch.md:48`
- [ ] **Z-11** Pro extras: audit history + per-operator permissions UI — Trigger: first Pro customer. · `08-post-launch.md:63`
- [ ] **Z-12** Sale-confirm sound: commission new audio (ADR-054 §7) — Trigger: brand work budget. · `08-post-launch.md:68`

## `09-next-features.md`

### 2. Launch blockers

- [~] **N-01** Stripe: annual prices + trial on both paid tiers `[LAUNCH]` — Blocked by: B-10, C-12 · `09-next-features.md:65`
- [~] **N-02** Server usage metering `[LAUNCH]` — Blocked by: C-12, B-08 · `09-next-features.md:104`
- [~] **N-03** Overage warnings and provider alerts `[LAUNCH]` — Blocked by: N-02, N-08, B-14 · `09-next-features.md:136`
- [~] **N-05** `apps/backoffice` scaffold + staff auth `[LAUNCH]` — Blocked by: B-01, P-22 · `09-next-features.md:183`
- [~] **N-06** Tenants, licences and Stripe `[LAUNCH]` — Blocked by: N-05, B-10, B-06 · `09-next-features.md:211`
- [~] **N-07** Usage, limits and capacity `[LAUNCH]` — Blocked by: N-05, N-02 · `09-next-features.md:239`
- [~] **N-08** Inbox (support and escalations) `[LAUNCH]` — Blocked by: N-05 · `09-next-features.md:260`
- [~] **N-09** Platform flags and kill switches `[LAUNCH]` — Blocked by: N-05, A-14 · `09-next-features.md:280`
- [~] **N-10** Staff alerts `[LAUNCH]` — Blocked by: N-08, B-14, B-18 · `09-next-features.md:301`
- [ ] **N-11** Portal settings parity `[LAUNCH]` — Blocked by: P-08, P-15, C-15 · `09-next-features.md:326`
- [~] **N-12** "Platícanos de ti" wizard `[LAUNCH]` — Blocked by: N-11, N-19 · `09-next-features.md:338`
- [~] **N-13** Plan recommendation + signup reorder `[LAUNCH]` — Blocked by: N-12, N-01 · `09-next-features.md:361`
- [~] **N-14** "¿Cómo empiezo?" checklist update `[LAUNCH]` — Blocked by: N-12 · `09-next-features.md:374`
- [~] **N-15** Re-run the wizard `[LAUNCH]` — Blocked by: N-12 · `09-next-features.md:382`
- [~] **N-17** Saldos iniciales template `[LAUNCH]` — Blocked by: N-16, C-20 · `09-next-features.md:424`
- [~] **N-19** Logo + brand colour `[LAUNCH]` — Blocked by: C-15 · `09-next-features.md:490`
- [~] **N-21** WhatsApp share `[LAUNCH]` — Blocked by: N-20 (done) · web half landed 2026-09-20 · `09-next-features.md:548`
- [ ] **N-22** App sync banners `[LAUNCH]` — Blocked by: A-06, A-07, N-24 · `09-next-features.md:580`
- [~] **N-23** Portal offline page `[LAUNCH]` — Blocked by: P-24 (shell landed; nothing in its remainder blocks this) · `09-next-features.md:595`
- [ ] **N-24** Phone app adopts the Track O operator design `[LAUNCH]` — Blocked by: merge of `rename/xangarro-stored-ids`; each Track O screen closed (O-xx) before its phone counterpart starts · `09-next-features.md:616`
- [ ] **N-25** QR device pairing `[LAUNCH]` — Blocked by: C-14, B-11, P-06, A-04, N-24 · `09-next-features.md:632`
- [~] **N-26** Security audit `[LAUNCH]` — Blocked by: N-05, B-17 · `09-next-features.md:649`
- [~] **N-27** Database audit `[LAUNCH]` — Blocked by: B-03, B-08, B-09 · `09-next-features.md:665`
- [ ] **N-28** Performance audit `[LAUNCH]` — Blocked by: X-01 · `09-next-features.md:677`
- [ ] **N-29** Deterministic full-stack E2E gate `[LAUNCH]` — Blocked by: P-17, A-16, N-22, N-25 · `09-next-features.md:685`
- [ ] **N-30** Closed beta `[LAUNCH]` — Blocked by: X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29 · `09-next-features.md:695`
- [~] **N-32** Store-compliance sweep `[LAUNCH]` — Blocked by: N-24, A-15 · `09-next-features.md:734`
- [~] **N-34** Aviso de privacidad + ARCO requests `[LAUNCH]` — Blocked by: N-08 · `09-next-features.md:756`
- [~] **N-33** CFDI automation for Xangarro's own subscriptions `[LAUNCH]` — Blocked by: B-10, P-10, N-08 · `09-next-features.md:803`

### 3. Post-launch

- [ ] **N-40** Provider validation + Clip partnership + legal opinion — Trigger: N-30 exit criteria met. **The Clip conversation starts now** (owner action, not gated by the trigger). · `09-next-features.md:870`
- [ ] **N-41** `PaymentProvider` port + Mercado Pago adapter — Blocked by: N-40, C-13 · `09-next-features.md:886`
- [ ] **N-42** Payment intents backend + reconciliation — Blocked by: N-41, C-13 · `09-next-features.md:894`
- [ ] **N-43** Merchant account linking in the portal — Blocked by: N-41 · `09-next-features.md:904`
- [ ] **N-44** App "Cobrar con tarjeta" — Blocked by: N-42, N-43, N-45, N-24, N-53 · `09-next-features.md:914`
- [ ] **N-45** External penetration test — Trigger: N-42 and N-43 on staging. · `09-next-features.md:923`
- [ ] **N-46** Sync health and devices — Trigger: launch + 30 days, or the first cross-tenant sync incident. · `09-next-features.md:930`
- [ ] **N-47** Broadcast announcements — Trigger: the first planned maintenance window or feature launch after go-live. · `09-next-features.md:936`
- [ ] **N-48** Dormancy lifecycle (ADR-064) — Trigger: launch + 90 days (no tenant can be dormant earlier). · `09-next-features.md:942`
- [ ] **N-49** GLM exploratory tester — Trigger: X-01 staging live and N-29 green. · `09-next-features.md:957`
- [ ] **N-50** AI logo generation — Trigger: the ADR-059 production gate on model calls is lifted. · `09-next-features.md:964`
- [ ] **N-51** DB scaling — Stage 2 (ADR-068) — Trigger: any of DB > 25 GB · a table > 50 M rows · sync p95 > 800 ms (N-07 card). · `09-next-features.md:970`
- [ ] **N-52** DB scaling — Stage 3 (ADR-068) — Trigger: DB > 500 GB or > 10 000 active tenants. · `09-next-features.md:976`
- [ ] **N-54** Facturación for merchants (white-label PAC reseller) — Trigger: N-33 `live` for 3 months, and ≥ 5 customers asking to invoice their own clients. · `09-next-features.md:981`
- [ ] **N-53** Clip adapter — Blocked by: N-41, N-40 (Clip go) · `09-next-features.md:992`
- [~] **N-58** Phase 4 — purchases + landing. · `09-next-features.md:1028`
- [~] **N-60** Phase 6 — ADR-092 + aviso. · `09-next-features.md:1043`
- [ ] **N-61** Phase 7 — retention. · `09-next-features.md:1049`
- [ ] **N-62** Cohort metrics from the fiscal address, not from IP. · `09-next-features.md:1050`
- [ ] **N-63** Negocio: MRR, churn, trial → paid — Blocked by: N-06 · Trigger: B-10 webhooks write `billing.subscriptions` for the first paying tenant (the N-06 stub is retired). · `09-next-features.md:1071`
- [ ] **N-64** Activation funnel and weekly cohorts — Blocked by: N-57 · Trigger: X-10 launch (real signups). · `09-next-features.md:1082`
- [ ] **N-65** Tenant timeline — Blocked by: N-08 · Trigger: now (every source table exists). · `09-next-features.md:1093`
- [ ] **N-66** Staff roles — Blocked by: N-05 · Trigger: the second staff member is added, or before N-68 / N-71 start — whichever is first. · `09-next-features.md:1102`
- [ ] **N-67** `/auditoria` — Blocked by: N-05 · Trigger: now. · `09-next-features.md:1112`
- [ ] **N-68** "Ver como" — time-boxed, read-only impersonation — Blocked by: N-66, N-67 · Trigger: X-10 launch and the first inbox item that could not be resolved from `/tenants/[id]` + N-65. · `09-next-features.md:1121`
- [ ] **N-69** Flag lifecycle and percentage rollout — Blocked by: N-09 · Trigger: N-09 `[x]`. · `09-next-features.md:1134`
- [ ] **N-70** Decisiones — Blocked by: N-07, N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1144`
- [ ] **N-71** Cobros: dunning, expiring trials, extend / credit — Blocked by: N-06, N-66 · Trigger: first paying tenant. · `09-next-features.md:1154`
- [ ] **N-72** Cost per tenant — Blocked by: N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1164`
- [ ] **N-73** Account health and NPS micro-survey — Blocked by: N-64, N-47 · Trigger: 50 active tenants. · `09-next-features.md:1172`
- [ ] **N-74** Promo and referral codes with attribution — Blocked by: N-64, N-01 · Trigger: X-10 launch. · `09-next-features.md:1182`

## `11-pre-launch-and-deferred.md`

### 1. Pre-launch actions (owner)

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

### 3. Web portal (P-track) — added 2026-09-18

- [ ] **O-25** Add to the contador questions (O-14): ISR by régimen — the statements apply `isr_tasa` to utilidad operativa,… · `11-pre-launch-and-deferred.md:91`
- [ ] **O-26** Approved 2026-09-19 (owner): `empleado_id` on `expenses` + phone's «Tipos de pago» read-only — implementing. · `11-pre-launch-and-deferred.md:92`

## `16-design-conformance.md`

### W-3 · Consultas que no traen lo que el diseño muestra (B-1…B-6, C-2…C-6)

- [ ] Status · `16-design-conformance.md:147`

### W-5 · Comprobante (Ticket)

- [ ] Status · `16-design-conformance.md:197`

### W-6 · `design-lint` de vuelta a 0 (S-7)

- [ ] Status · `16-design-conformance.md:210`

### W-7 · Decidir el asistente de alta (§4 del audit)

- [ ] Status · `16-design-conformance.md:230`

## `../launch/production-readiness.md`

### 0. The one thing everything waits on

- [ ] BLOCKER — Legal entity named. `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`, · `../launch/production-readiness.md:10`

### 1. Legal texts

- [~] Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based). · `../launch/production-readiness.md:18`
- [~] Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`. · `../launch/production-readiness.md:19`
- [~] Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`). · `../launch/production-readiness.md:20`
- [~] Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`. · `../launch/production-readiness.md:21`
- [~] Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`. · `../launch/production-readiness.md:22`
- [ ] BLOCKER — Lawyer's review of the five texts + the five confirmations in · `../launch/production-readiness.md:23`
- [ ] Plantilla de aviso for the negocio's own customers (OQ-L16). · `../launch/production-readiness.md:25`
- [ ] Retire `docs/legal/privacy.md` and `docs/legal/terms.md` once the above are approved. · `../launch/production-readiness.md:26`
- [ ] Fill the three `[PAÍS]` cells in aviso §6.1 (error monitoring, mail, messaging) and the · `../launch/production-readiness.md:27`

### 2. Consent capture (PRIV-REG-01) — implemented 2026-09-22

- [ ] BLOCKER — Apply migration 0034 to hosted (`pnpm --filter @xangarro/data-pg db:migrate:hosted`); · `../launch/production-readiness.md:40`
- [ ] Run the Playwright onboarding spec against a database (`apps/web/e2e/onboarding.spec.ts` gained · `../launch/production-readiness.md:42`
- [ ] SOON — Nightly seal job: call `xangarro.privacy_consents_day_root(day)` and obtain a · `../launch/production-readiness.md:44`
- [ ] Archive the full text of every `AVISO_VERSION` (a hash without its text proves nothing) — · `../launch/production-readiness.md:46`
- [ ] Configuración → Privacidad: show accepted version, toggle novedades (writes a · `../launch/production-readiness.md:48`
- [ ] Re-consent gate on login when a version adds a finalidad (art. 11); banner otherwise. · `../launch/production-readiness.md:50`
- [ ] Decide checkbox vs. button-as-consent with the lawyer (OQ-N7); today: checkbox. · `../launch/production-readiness.md:51`

### 3. Rights the aviso promises (must exist before the aviso is public)

- [ ] BLOCKER — Self-service account deletion in the portal (export → confirm → cancel Stripe → · `../launch/production-readiness.md:55`
- [ ] In-app "Desvincular y borrar los datos de este dispositivo" (aviso §7 currently admits · `../launch/production-readiness.md:58`
- [ ] ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day · `../launch/production-readiness.md:60`
- [ ] Retention calendar implemented per table (OQ-L13 numbers once confirmed); 72-month rule for · `../launch/production-readiness.md:62`
- [ ] Breach protocol with the Reglamento art. 65 field list, a named person, and the 72 h clause to · `../launch/production-readiness.md:64`
- [ ] Verify Sentry server-side captures no PII before the aviso says so. · `../launch/production-readiness.md:66`

### 4. Subscriptions (LFPC art. 76 Bis VIII–IX, in force 2025-12-13)

- [ ] BLOCKER — Cancel in one click from Configuración → Suscripción. · `../launch/production-readiness.md:70`
- [ ] BLOCKER — Renewal reminder e-mail ≥ 5 business days before each charge, with a one-click · `../launch/production-readiness.md:71`
- [ ] Recurring-charge consent screen at checkout: frequency, amount, date, express acceptance. · `../launch/production-readiness.md:73`
- [ ] Price increases: 30-day notice + express re-acceptance flow. · `../launch/production-readiness.md:74`
- [ ] Address, phone and complaint channel visible before contracting (landing + checkout). · `../launch/production-readiness.md:75`
- [ ] Legal links (aviso, términos) in the landing footer, the portal footer, e-mail footers. · `../launch/production-readiness.md:76`

### 5. Stores

- [ ] BEFORE-STORES — Apple Privacy Nutrition Label + privacy manifest; Play Data Safety form — · `../launch/production-readiness.md:80`
- [ ] BEFORE-STORES — Terms and privacy URLs live (`xangarro.mx/privacidad`, `/terminos`) and · `../launch/production-readiness.md:82`
- [ ] BEFORE-STORES — Reviewer notes explaining the device + NIP model (no in-app account, no · `../launch/production-readiness.md:84`
- [ ] Open-source licence notices screen generated from `pnpm licenses list --prod` (1,184 pkgs, no · `../launch/production-readiness.md:86`
- [ ] Never add Sign in with Apple/Google to the mobile app (would trigger 5.1.1(v)). · `../launch/production-readiness.md:88`

### 6. Third parties and contracts

- [ ] Signed DPAs: Supabase, Vercel, Sentry, Stripe, mail provider, PAC, Microsoft (Foundry), · `../launch/production-readiness.md:92`
- [ ] Foundry hosting option decided and configured (Hosted on Azure, US DataZone recommended); · `../launch/production-readiness.md:94`
- [ ] `ASESOR_LLM_*` never pointed at a personal proxy with real tenant data (add a guard). · `../launch/production-readiness.md:96`
- [ ] Rule: the Asesor's model boundary stays the only module that knows a model exists; the IA · `../launch/production-readiness.md:97`

### 7. Product hygiene with legal weight

- [ ] Receipt (`comprobante`) carries "Este comprobante no es un CFDI" and the negocio's name as · `../launch/production-readiness.md:103`
- [ ] Attribution retention rule for `signup_attribution` (geo has 400 days; propose the same). · `../launch/production-readiness.md:105`
- [ ] Landing beacon disclosed in the aviso (done) and a footer link on `xangarro.mx` (open). · `../launch/production-readiness.md:106`
- [ ] Marketing e-mail: opt-out honoured within the 5-day window; REPEP if phone/SMS ever used. · `../launch/production-readiness.md:107`
- [ ] Advertising claims on the landing are demonstrable (LFPC art. 32). · `../launch/production-readiness.md:108`

### 8. Intellectual property and governance

- [ ] BLOCKER — IMPI trademark search and filing for "Xangarro" (classes 9, 35, 36, 42) before · `../launch/production-readiness.md:112`
- [ ] Licences recorded for hero images/illustrations/fonts (assets beyond sounds and map data). · `../launch/production-readiness.md:114`
- [ ] Cyber-liability insurance — business decision. · `../launch/production-readiness.md:115`
- [ ] INDAUTOR software registration — optional. · `../launch/production-readiness.md:116`
