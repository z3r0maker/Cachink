# Pendientes — tablero generado

> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla
> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en
> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;
> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las
> líneas Done siguen en cada track: aquí sólo está lo que falta, en tres listas, con su disparador
> o bloqueo y la línea exacta de donde viene. «Siguiente» es el orden de trabajo, derivado de las
> dependencias.

## Siguiente (15)

Derivado de **Blocked by** / **Blocks**: tareas sin bloqueo abierto, ordenadas por cuántas
tareas abiertas destraban (transitivamente). Se recalcula con cada `pnpm plan:board`.

- **N-24** Phone app adopts the Track O operator design `[LAUNCH]` (Lanzamiento) — destraba 13: N-22, N-25, N-32, N-44, N-29, X-05, … · `09-next-features.md:693`
- **A-16** Maestro suite for the new app (Colas de tracks) — destraba 9: N-29, N-30, X-02, X-03, X-05, X-04, … · `05-app.md:194`
- **X-01** Staging environment (Q17 "A later") (Lanzamiento) — destraba 9: X-02, X-10, N-28, N-30, X-03, X-05, … · `07-launch.md:10`
- **C-13** Payment intents API (Colas de tracks) — destraba 5: N-41, N-42, N-53, N-43, N-44 · `02-contracts.md:323`
- **N-40** Provider validation + Clip partnership + legal opinion (Post-lanzamiento) — destraba 5: N-41, N-53, N-42, N-43, N-44 · `09-next-features.md:962`
- **N-64** Activation funnel and weekly cohorts (Post-lanzamiento) — destraba 3: N-70, N-74, N-73 · `09-next-features.md:1175`
- **P-35** Portal coverage to 85% (unit + E2E merged, ADR-102) (Colas de tracks) — destraba 3: P-30, P-28, P-29 · `04-portal.md:1439`
- **X-07** Brand masters + derivatives (ADR-054 §6) (Lanzamiento) — destraba 3: X-05, X-10, L-05 · `07-launch.md:62`
- **N-63** Negocio: MRR, churn, trial → paid (Post-lanzamiento) — destraba 2: N-70, N-72 · `09-next-features.md:1164`
- **N-66** Staff roles (Post-lanzamiento) — destraba 2: N-68, N-71 · `09-next-features.md:1195`
- **N-03** Overage warnings and provider alerts `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:142`
- **N-19** Logo + brand colour `[LAUNCH]` (Lanzamiento) — destraba 1: N-12 · `09-next-features.md:561`
- **N-26** Security audit `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:727`
- **N-27** Database audit `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:745`
- **N-34** Aviso de privacidad + ARCO requests `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:843`

## Lanzamiento (90)

Lo que la X-10 espera: los `[LAUNCH]` de Track N, las X-, las acciones del dueño y la preparación legal.

### `07-launch.md`

- [ ] **X-01** Staging environment (Q17 "A later") — Blocked by: B-01…B-10 · Falta: the repo is ready (`eas.json` splits preview/production env and entitlement keys; both `vercel.json` pin `pdx1`) but `docs/ops/provisioning.md` has no staging section and `scripts/hosted/*` targets one database; the `xangarro-staging` Supabase project, the Vercel Preview env, the Stripe test binding and the separate keypair are all outside the repo. · `07-launch.md:10`
- [ ] **X-02** End-to-end integration run (real app ↔ real backend) — Blocked by: X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · `07-launch.md:18`
- [ ] **X-03** Partner migration — Blocked by: X-02 · `07-launch.md:24`
- [ ] **X-04** Xangarro as tenant #1 (dogfooding) — Blocked by: X-02 · `07-launch.md:30`
- [ ] **X-05** Store listings + review readiness — Blocked by: F-01, A-15, X-07, B-04 · Falta: `app.json` is renamed (Xangarro!, `mx.xangarro.mobile`) and `store:screenshots` exists, but `docs/store/listing-*.md` still points support/privacy/terms at `cachink.mx`, the copy is pre-pivot (modo local, Director, LAN sync), there are no review notes (demo account, «no purchase flow»), and `eas.json` `submit.production` has no `ascAppId`. · `07-launch.md:38`
- [ ] **X-06** CLAUDE.md amendments (human applies) — Blocked by: — (can be prepared any time; apply at launch) · `07-launch.md:45`
- [ ] **X-07** Brand masters + derivatives (ADR-054 §6) — Blocked by: logo work (external) · Falta: the icon kit is landed in `assets/brand/icons/` and wired into all four apps (mobile icon + adaptive + themed layers, portal/console favicons and touch icons, landing favicons + manifest + the OG image). Still missing: `logo.png`, `splash-mobile.png` (the shipped splash still reads «Cachink!»), and deleting the four `role-*.png`. · `07-launch.md:62`
- [ ] **X-08** Repo + directory rename (optional, coordinate) — Blocked by: A-15 · `07-launch.md:69`
- [ ] **X-09** ROADMAP.md reset — Blocked by: X-02 · `07-launch.md:75`
- [ ] **X-10** Launch checklist gate — Blocked by: X-01…X-09 (except X-08) · `07-launch.md:81`

### `09-next-features.md` · 2. Launch blockers

- [~] **N-03** Overage warnings and provider alerts `[LAUNCH]` — Blocked by: N-02, N-08, B-14 · Falta: no portal usage banner; no app banner driven by the pulled `usage` (`usageMessageCode` is never called; `PlanLimitSheet` counts locally); no contract test that a paid tenant at 150 % still syncs every row (the mock's `over-limit` scenario is unused). · `09-next-features.md:142`
- [~] **N-12** "Platícanos de ti" wizard `[LAUNCH]` — Blocked by: N-11, N-19 · Falta: acceptance met (`suggested-plan-table.test.ts`, 535ceaa1). Business type and WhatsApp answers are never saved although `businesses.tipo_negocio` / `whatsapp` exist (`AplicarConfiguracionUseCase` writes only name + payment methods); step 6 records `hasLogo` with no upload (N-19); answers live in `business_onboarding`, not `businesses.onboarding` — documented, not ratified by an ADR. · `09-next-features.md:399`
- [~] **N-19** Logo + brand colour `[LAUNCH]` — Blocked by: C-15 · Falta: the phone does not download or cache the logo (nothing fetches `/api/logos`; 73324085 only added the branding columns), so «renders offline» is unmet. The monthly-PDF logo (02b207da) is done — drop it from «still to do». · `09-next-features.md:561`
- [~] **N-21** WhatsApp share `[LAUNCH]` — Blocked by: N-20 (done) · web half landed 2026-09-20 · Falta: phone half only: no Android send to a preset number (`share-image.ts` opens the generic sheet), no «Enviar como texto», no Maestro flow to the hand-off, no Android-fallback unit test. Blocked on N-24. · `09-next-features.md:621`
- [ ] **N-22** App sync banners `[LAUNCH]` — Blocked by: A-06, A-07, N-24 · `09-next-features.md:655`
- [ ] **N-24** Phone app adopts the Track O operator design `[LAUNCH]` — Blocked by: merge of `rename/xangarro-stored-ids`; each Track O screen closed (O-xx) before its phone counterpart starts · `09-next-features.md:693`
- [ ] **N-25** QR device pairing `[LAUNCH]` — Blocked by: C-14, B-11, P-06, A-04, N-24 · Falta: the phone side only — verified App Links and Universal Links (`assetlinks.json`, AASA) for `app.xangarro.mx/activar`, reading the token from the fragment, the camera screen, the SEC-MOB-04 confirmation «¿Vincular a _negocio_?» before redeeming (needs a small preview that names the business for a token, not built), and the Maestro deep-link flow. The contract, the token, the portal QR, the WhatsApp share and the `/activar` fallback page exist. Still blocked by N-24. · `09-next-features.md:709`
- [~] **N-26** Security audit `[LAUNCH]` — Blocked by: N-05, B-17 · Falta: 4 of 6 highs fixed (SEC-AUTH-01/02, SEC-SEC-01, SEC-DEV-01 — the oracle closed and the QR token built by C-14, 2026-09-23); SEC-DATA-01 is the owner switch O-2; SEC-PRIV-01 is N-34. Mediums in scope, 2026-09-23: **SEC-WEB-01 done** — the portal sends X-Frame-Options, an enforced `frame-ancestors 'none'`, nosniff, HSTS, a strict referrer and Permissions-Policy, `poweredByHeader` off, from one implementation shared with the console (`@xangarro/config/security`); its full nonce CSP (`src/proxy.ts`, with `'wasm-unsafe-eval'` and workers for the register) is served **report-only** to `/api/csp-report`, and the sweep found zero violations on 18 pages and every register/sync e2e flow after two fixes (Zod's eval probe set `jitless` in the head; every route rendered per request so every script gets the nonce). · `09-next-features.md:727`
- [~] **N-27** Database audit `[LAUNCH]` — Blocked by: B-03, B-08, B-09 · Falta: fixed: DB-SYNC-01, DB-IDX-01 (8666e6ce), DB-QRY-01, DB-MIG-01, DB-RLS-01 and DB-MIG-02 (B-03, 2026-09-23). Open: DB-OPS-01 (PITR + drill = O-3), DB-SYNC-02 (unverified). `pg_stat_statements` re-run needs the hosted project. · `09-next-features.md:745`
- [ ] **N-28** Performance audit `[LAUNCH]` — Blocked by: X-01 · `09-next-features.md:759`
- [ ] **N-29** Deterministic full-stack E2E gate `[LAUNCH]` — Blocked by: P-17, A-16, N-22, N-25 · `09-next-features.md:767`
- [ ] **N-30** Closed beta `[LAUNCH]` — Blocked by: X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29 · `09-next-features.md:777`
- [~] **N-32** Store-compliance sweep `[LAUNCH]` — Blocked by: N-24, A-15 · Falta: reviewer checklist for X-05 in `docs/store/`. `pnpm lint:store` is green again and gated in `ci.yml` (see Progress). · `09-next-features.md:816`
- [~] **N-34** Aviso de privacidad + ARCO requests `[LAUNCH]` — Blocked by: N-08 · Falta: the operator-NIP notice (variante C); Configuración → Privacidad to withdraw consent; self-service deletion; routing requests from a merchant's customers to the merchant; PRIV-GEO-01, PRIV-IA-01/02, PRIV-OPS-01. The texts are drafts with `[BRACKET]` gaps until counsel signs off (O-17). Hosted apply done 2026-09-25: `db:migrate:hosted` applied data-pg `0034`–`0042` and console `0017`–`0019` (12 files; the first production signup had failed with 42883 on `privacy_consent_record`); dry run reports 0 pending. Progress: 2026-09-23 · **The aviso is reachable from every surface.** xangarro.mx gets `/privacidad` (the aviso integral) and `/privacidad/arco` (section A of the procedure; the internal annex B is not published), rendered at build time from `docs/legal/aviso/*.md` with every `>` note dropped, as the drafts say; the prerender refuses to publish «BORRADOR», «Nota:» or «Anexo interno». Links: the landing footer, the portal sidebar (beside Ayuda), the login screen, the signup consent (already), and the device-linking notice. · `09-next-features.md:843`

### `11-pre-launch-and-deferred.md` · 1. Pre-launch actions (owner)

- [ ] **O-2** Turn Data API off · `11-pre-launch-and-deferred.md:25`
- [ ] **O-3** Backups / PITR on a paid plan · `11-pre-launch-and-deferred.md:26`
- [ ] **O-4** Vercel project `xangarro-web`, Root Directory `apps/web`, domain `app.xangarro.mx`, region pdx1 · `11-pre-launch-and-deferred.md:27`
- [ ] **O-5** Vercel project `xangarro-backoffice`, Root Directory `apps/backoffice`, domain `admin.xangarro.mx`, region pd… · `11-pre-launch-and-deferred.md:28`
- [ ] **O-6** Vercel project `xangarro-landing`, Root Directory `apps/landing`, domain `xangarro.mx` · `11-pre-launch-and-deferred.md:29`
- [ ] **O-7** Check the Vercel plan allows 4 cron jobs and pinned regions · `11-pre-launch-and-deferred.md:31`
- [ ] **O-8** Database URLs per role (Transaction pooler, port 6543) · `11-pre-launch-and-deferred.md:32`
- [ ] **O-9** Generate secrets: `DEVICE_TOKEN_SECRET`, `CRON_SECRET`, `ADMIN_INGEST_SECRET` (same in both apps), `ADMIN_TOT… · `11-pre-launch-and-deferred.md:33`
- [ ] **O-10** Archive `z3r0maker/CachinkLanding` on GitHub (do not delete) · `11-pre-launch-and-deferred.md:34`
- [ ] **O-11** `gh auth login` on the dev machine · `11-pre-launch-and-deferred.md:35`
- [ ] **O-12** Needs you (manual, 2026-09-23): Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLI… · `11-pre-launch-and-deferred.md:41`
- [ ] **O-13** Needs you (manual, 2026-09-23): Resend: add domain `xangarro.mx`; DNS records from `docs/ops/email.md` (MX + … · `11-pre-launch-and-deferred.md:42`
- [ ] **O-14** Contador sign-off on CFDI questions: PUE vs PPD for SPEI paid-on-receipt; ClaveProdServ `81112106` / unit `E4… · `11-pre-launch-and-deferred.md:48`
- [ ] **O-15** Generate the CSD (Certificado de Sello Digital) in CertiSAT with the e.firma · `11-pre-launch-and-deferred.md:49`
- [ ] **O-16** Until `live`: issue CFDIs manually in the SAT portal from the backoffice "Pagos sin CFDI" list; mark each pay… · `11-pre-launch-and-deferred.md:50`
- [ ] **O-17** Counsel review of `docs/legal/aviso/*` (16 open questions in its README), incl. whether ADR-064's 6-year dorm… · `11-pre-launch-and-deferred.md:51`
- [ ] **O-18** Counsel opinion: a platform that never holds funds and takes no fee is outside Ley Fintech / Banxico aggregat… · `11-pre-launch-and-deferred.md:52`
- [ ] **O-19** Contact Clip's partner team (sdk@payclip.com): OAuth/partner programme, a test device, bulk PinPad installs · `11-pre-launch-and-deferred.md:53`
- [ ] **O-22** Staging (X-01) before the first paying customer · `11-pre-launch-and-deferred.md:61`

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

- [ ] **N-40** Provider validation + Clip partnership + legal opinion — Trigger: N-30 exit criteria met. **The Clip conversation starts now** (owner action, not gated by the trigger). · `09-next-features.md:962`
- [ ] **N-41** `PaymentProvider` port + Mercado Pago adapter — Blocked by: N-40, C-13 · `09-next-features.md:978`
- [ ] **N-42** Payment intents backend + reconciliation — Blocked by: N-41, C-13 · `09-next-features.md:986`
- [ ] **N-43** Merchant account linking in the portal — Blocked by: N-41 · `09-next-features.md:996`
- [ ] **N-44** App "Cobrar con tarjeta" — Blocked by: N-42, N-43, N-45, N-24, N-53 · `09-next-features.md:1006`
- [ ] **N-45** External penetration test — Trigger: N-42 and N-43 on staging. · `09-next-features.md:1015`
- [ ] **N-46** Sync health and devices — Trigger: launch + 30 days, or the first cross-tenant sync incident. · `09-next-features.md:1022`
- [ ] **N-47** Broadcast announcements — Trigger: the first planned maintenance window or feature launch after go-live. · `09-next-features.md:1028`
- [ ] **N-48** Dormancy lifecycle (ADR-064) — Trigger: launch + 90 days (no tenant can be dormant earlier). · `09-next-features.md:1034`
- [ ] **N-49** GLM exploratory tester — Trigger: X-01 staging live and N-29 green. · `09-next-features.md:1049`
- [ ] **N-50** AI logo generation — Trigger: the ADR-059 production gate on model calls is lifted. · `09-next-features.md:1056`
- [ ] **N-51** DB scaling — Stage 2 (ADR-068) — Trigger: any of DB > 25 GB · a table > 50 M rows · sync p95 > 800 ms (N-07 card). · `09-next-features.md:1062`
- [ ] **N-52** DB scaling — Stage 3 (ADR-068) — Trigger: DB > 500 GB or > 10 000 active tenants. · `09-next-features.md:1068`
- [ ] **N-54** Facturación for merchants (white-label PAC reseller) — Trigger: N-33 `live` for 3 months, and ≥ 5 customers asking to invoice their own clients. · `09-next-features.md:1073`
- [ ] **N-53** Clip adapter — Blocked by: N-41, N-40 (Clip go) · `09-next-features.md:1084`
- [~] **N-58** Phase 4 — purchases + landing. · `09-next-features.md:1120`
- [~] **N-60** Phase 6 — ADR-092 + aviso. · `09-next-features.md:1135`
- [ ] **N-62** Cohort metrics from the fiscal address, not from IP. · `09-next-features.md:1143`
- [ ] **N-63** Negocio: MRR, churn, trial → paid — Blocked by: N-06 · Trigger: B-10 webhooks write `billing.subscriptions` for the first paying tenant (the N-06 stub is retired). · `09-next-features.md:1164`
- [ ] **N-64** Activation funnel and weekly cohorts — Blocked by: N-57 · Trigger: X-10 launch (real signups). · `09-next-features.md:1175`
- [ ] **N-65** Tenant timeline — Blocked by: N-08 · Trigger: now (every source table exists). · `09-next-features.md:1186`
- [ ] **N-66** Staff roles — Blocked by: N-05 · Trigger: the second staff member is added, or before N-68 / N-71 start — whichever is first. · `09-next-features.md:1195`
- [ ] **N-67** `/auditoria` — Blocked by: N-05 · Trigger: now. · `09-next-features.md:1205`
- [ ] **N-68** "Ver como" — time-boxed, read-only impersonation — Blocked by: N-66, N-67 · Trigger: X-10 launch and the first inbox item that could not be resolved from `/tenants/[id]` + N-65. · `09-next-features.md:1214`
- [ ] **N-69** Flag lifecycle and percentage rollout — Blocked by: N-09 · Trigger: N-09 `[x]`. · `09-next-features.md:1227`
- [ ] **N-70** Decisiones — Blocked by: N-07, N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1237`
- [ ] **N-71** Cobros: dunning, expiring trials, extend / credit — Blocked by: N-06, N-66 · Trigger: first paying tenant. · `09-next-features.md:1247`
- [ ] **N-72** Cost per tenant — Blocked by: N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1257`
- [ ] **N-73** Account health and NPS micro-survey — Blocked by: N-64, N-47 · Trigger: 50 active tenants. · `09-next-features.md:1265`
- [ ] **N-74** Promo and referral codes with attribution — Blocked by: N-64, N-01 · Trigger: X-10 launch. · `09-next-features.md:1275`

## Colas de tracks (13)

Sobrantes de tracks casi cerrados. Se verifican contra el código y se cierran o se archivan.

### `02-contracts.md` · §8 Table scope

- [ ] **C-13** Payment intents API — Trigger: N-40 go decision · `02-contracts.md:323`
- [ ] **C-21** Kill switches on the wire · `02-contracts.md:492`

### `03-backend.md`

- [~] **B-16** Back-office: Studio saved queries + support functions — Blocked by: B-03, B-11 · Falta: no «subscriptions by plan/status» saved query (unblocked now that `billing.subscriptions` exists); `billing.reissue_code` / `billing.resend_magic_link` do not exist. Studio-callable issuance is superseded by ADR-080 — drop that step. Runbook review is a human sign-off. 2026-09-17 · `supabase/studio/`: unresolved rejections, stale devices, codes expiring today, and a SQL sign-in unlock; `xangarro.security_prune()` and `xangarro.session_revoke_user()` (0006); runbook `docs/ops/back-office.md`. `support-tooling.integration.test.ts` runs every saved query on the seed and pins the SQL unlock to the app's throttle key. · `03-backend.md:292`

### `04-portal.md` · Fase 0 — Contrato y andamio

- [ ] **P-21** `pnpm design:compare` capture harness — Blocked by: P-18 · Falta: the whole harness. The one verified in `83ec5840` (2026-09-21) was never committed: the unanchored `.gitignore` pattern `design-compare/` also matched `scripts/design-compare/`, so the commit carried only the `package.json` script and the ignore line. The sources are on no disk (worktree and main checkout checked) and in no commit. Same day: the pattern is now `/design-compare/` and the dangling `design:compare` script is removed, so the Steps below are a rewrite, not a recovery. Restore the script entry when the harness lands. · `04-portal.md:187`

### `04-portal.md` · Fase 1 — Tokens y primitivas

- [~] **P-23** Primitives + Storybook inventory + visual-regression baselines — Blocked by: P-22 · Falta: the `design:compare` acceptance clause waits on P-21, reopened the same day (the harness was never committed and exists on no disk; see P-21). No Storybook page in `apps/web`; Toast, gauge, nav item, switcher and user menu are unharnessed. 2026-09-22 doc audit: shipped except the `design:compare` gate in its Acceptance. In progress: 2026-09-17 · **core vocabulary built and rendering**, gate not yet closed. · `04-portal.md:253`

### `04-portal.md` · Fase 6 — Asesor

- [~] **P-28** Diagnóstico + estrategia — «Próximamente» in production — Blocked by: P-26, P-30 · Falta: only the tab and both gates exist (`asesor/screen.tsx`); the ten sections, month tiles, price table, estrategia list, six states, printable variant and the prompt-injection fixture are all unbuilt. 2026-09-22 doc audit: shipped except the ten report sections and the price table. In progress: 2026-09-17 · the tab and **both gates** are wired; the report itself is not built. Two gates compose in the right order via `resolveScreenState`: `capabilities.asesor === · `04-portal.md:1134`
- [ ] **P-29** Catálogo desde una foto — «Próximamente» in production — Blocked by: P-07, P-30 · `04-portal.md:1161`
- [~] **P-30** Asesor generation runtime — Blocked by: P-26, B-02, B-03 · Falta: the **fan-out** and the **model call**. Everything else landed — see below. The `notices` line in the previous Remaining was already stale when it was written: ADR-088's materialise-on-read has written `source='asesor'` rows since `loadAsesorPage`. **Fan-out.** ADR-056's «a daily job selects the businesses that are due» needs a cross-tenant read of which businesses are live. No portal role has one: RLS scopes the app role to a single tenant, and the only privileged cross-tenant path today is `xangarro.usage_counts` on the metering role. Choosing between a new privileged function, reusing the metering role, or the console's service role is a **Track B decision with a migration behind it**. Until it is taken there is no `vercel.json` entry — and could not be, since the unit of work is a POST with a body and Vercel Cron sends neither. **Model call.** ADR-056 makes it the last step, prompted from the deterministic figures. Held until **P-28**: the Diagnóstico is `<p>Reporte completo del mes.</p>` behind two gates, so generated prose would land in a table no screen reads. The boundary stays the single module ADR-056 requires (`server/asesor/model.ts`) and `runtime.ts` names the seam. The Batches API and prompt caching ride with it — batching needs a ledger to collect results, which is its own table. 2026-09-24 · **One business, on demand** (`ab519eb7`). `server/asesor/runtime.ts` composes the deterministic half in ADR-056's order — entitlement → cadencia → `calcularInsights` → `filtrarPorCadencia` → `materializarInsights` — and is idempotent by construction. `server/asesor/invocacion.ts` is the HTTP contract, split from the route so it tests without Next and without a database; `cron.ts` gained `cronAuth`/`cronRefusal` so it shares the guard with the three `handleCron` routes while answering 400 for a nameless request. `POST /api/cron/asesor`. · `04-portal.md:1171`

### `04-portal.md` · Fase 9 — Impresión, exportes y cierre

- [ ] **P-35** Portal coverage to 85% (unit + E2E merged, ADR-102) — Blocked by: — · `04-portal.md:1439`
- [~] **P-36** First production walkthrough: the owner's findings (2026-09-25) — Blocked by: ADR-105 landing (`feat/no-trial`, the billing session) for P-36.1; `feat/don-cuentas-portal` landing for P-36.7 Done: 2026-09-25 · items 2–6 on `main` (`feat/p36-walkthrough`): the guide with its required and optional lists, the D-2 gate (owner, wizard completed, required list open, no opt-out cookie) with «Ir a mi portal» as the escape, both onboarding paths ending on `/como-empiezo`; the wizard's answers applied before any Checkout and Crédito never stored as a method (parser tolerant of old rows); D-1's `BILLING_BETA_NO_CHARGE=1` (to set on `xangarro-web` in Vercel) keeps Checkout closed with the «Durante la beta no cobramos» notice; régimen «Ninguno por ahora» and the two one-line explanations; the edit bar on top; «Tu plan incluye» from the session's plan. Tests: domain 881, application 513, portal unit 522, portal E2E 489 passed (full local run). · Falta: P-36.1 and P-36.7 wait on their branches; the Inicio card's line reads «Listo para vender. N opcionales por hacer» once the required list is done. · `04-portal.md:1503`

### `05-app.md`

- [ ] **A-16** Maestro suite for the new app — Blocked by: A-04…A-10, A-15 · Falta: 133 flows exist (plan says 142). `login-operator-pin.yaml` not created; the eight pre-activation flows to delete are still present; `full-regression.sh` still buckets demo/wizard/fresh and calls `wizard-local-standalone`; the A-01/A-09 rework list is unaddressed; no green iPhone + iPad run recorded. Also owns A-15's «regression green» clause. · `05-app.md:194`

### `06-landing.md`

- [ ] **L-04** Domain + DNS + email domain — Blocked by: — (do early; ADR-054 follow-up) · Falta: owner-side only — registrar, DNS zone and Resend console (O-4 … O-6, O-13 in `11-pre-launch-and-deferred.md`); nothing in the repo can prove it. · `06-landing.md:59`
- [ ] **L-05** Store badges + legal pages — Blocked by: X-05 (real store URLs) · Falta: `/privacidad/` and `/privacidad/arco/` exist on the landing, rendered from `docs/legal/aviso/*.md`, linked from the footer and carrying WebPage schema (N-34, L-07); still missing: a términos route (`docs/legal/terms.md` mentions neither the 7-day grace nor the downgrade), and the store badges wait for X-05's real URLs. · `06-landing.md:88`

## Por archivo

- `02-contracts.md` — 2 abiertos (0 en curso, 0 bloqueados, 20 hechos)
- `03-backend.md` — 1 abiertos (1 en curso, 0 bloqueados, 17 hechos)
- `04-portal.md` — 7 abiertos (4 en curso, 0 bloqueados, 29 hechos)
- `05-app.md` — 1 abiertos (0 en curso, 0 bloqueados, 17 hechos)
- `06-landing.md` — 2 abiertos (0 en curso, 0 bloqueados, 5 hechos)
- `07-launch.md` — 10 abiertos (0 en curso, 0 bloqueados, 0 hechos)
- `08-post-launch.md` — 8 abiertos (0 en curso, 0 bloqueados, 4 hechos)
- `09-next-features.md` — 44 abiertos (10 en curso, 0 bloqueados, 26 hechos)
- `11-pre-launch-and-deferred.md` — 19 abiertos (0 en curso, 0 bloqueados, 7 hechos)
- `16-design-conformance.md` — todo cerrado — archivar (0 en curso, 0 bloqueados, 8 hechos)
- `../launch/production-readiness.md` — 47 abiertos (5 en curso, 0 bloqueados, 5 hechos)
