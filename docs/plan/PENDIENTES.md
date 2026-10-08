# Pendientes — tablero generado

> **Generado por `pnpm plan:board`. No se edita a mano.** Cada línea viene de una casilla
> `- [ ]` / `- [~]` / `- [!]` en un track de `docs/plan` (o de una fila `| O-n |` en
> `11-pre-launch-and-deferred.md`). Para cambiar un estado, edita el track y regenera;
> `pnpm test:scripts` falla cuando este archivo quedó viejo. Las especificaciones, los pasos y las
> líneas Done siguen en cada track: aquí sólo está lo que falta, agrupado por **área** — qué clase
> de trabajo es y quién puede moverlo — y dentro de cada área por momento de lanzamiento, con su
> disparador o bloqueo y la línea exacta de donde viene. Un área se deduce del archivo y la
> sección; una etiqueta `` `[área]` `` en el track manda sobre esa deducción. «Siguiente» es el
> orden de trabajo, derivado de las dependencias.

## Siguiente (15)

Derivado de **Blocked by** / **Blocks**: tareas sin bloqueo abierto, ordenadas por cuántas
tareas abiertas destraban (transitivamente). Se recalcula con cada `pnpm plan:board`.

- **E-02** Ledger core and Movimientos (Colas de tracks) — destraba 20: E-10, E-11, E-12, E-24, E-14, E-15, … · `20-command-center.md:261`
- **N-24** Phone app adopts the Track O operator design `[LAUNCH]` (Lanzamiento) — destraba 13: N-22, N-25, N-32, N-44, N-29, X-05, … · `09-next-features.md:701`
- **N-75** Reconciliation spike — can we see card payments from any reader? (Post-lanzamiento) — destraba 10: N-41, N-76, N-53, N-43, N-80, N-44, … · `09-next-features.md:1046`
- **A-16** Maestro suite for the new app (Colas de tracks) — destraba 9: N-29, N-30, X-02, X-03, X-05, X-04, … · `05-app.md:194`
- **X-01** Staging environment (Q17 "A later") (Lanzamiento) — destraba 9: X-02, X-10, N-28, N-30, X-03, X-05, … · `07-launch.md:10`
- **N-40** Provider validation + Clip partnership + legal opinion (Post-lanzamiento) — destraba 6: N-80, N-53, N-42, N-79, N-44, N-78 · `09-next-features.md:1026`
- **C-13** Payment intents API (Colas de tracks) — destraba 5: N-80, N-42, N-79, N-44, N-78 · `02-contracts.md:332`
- **P-35** Portal coverage to 95% (unit + E2E merged, ADR-102) (Colas de tracks) — destraba 5: P-30, P-28, P-29, P-39, P-40 · `04-portal.md:1626`
- **E-26** Almacenamiento de documentos en Azure Blob (Colas de tracks) — destraba 3: E-20, E-21, E-17 · `20-command-center.md:810`
- **N-63** Negocio: MRR, churn, trial → paid (Post-lanzamiento) — destraba 3: N-70, N-72, E-40 · `09-next-features.md:1309`
- **N-64** Activation funnel and weekly cohorts (Post-lanzamiento) — destraba 3: N-70, N-74, N-73 · `09-next-features.md:1320`
- **X-07** Brand masters + derivatives (ADR-054 §6) (Lanzamiento) — destraba 3: X-05, X-10, L-05 · `07-launch.md:101`
- **N-66** Staff roles (Post-lanzamiento) — destraba 2: N-68, N-71 · `09-next-features.md:1340`
- **N-03** Overage warnings and provider alerts `[LAUNCH]` (Lanzamiento) — destraba 1: N-30 · `09-next-features.md:142`
- **N-19** Logo + brand colour `[LAUNCH]` (Lanzamiento) — destraba 1: N-12 · `09-next-features.md:561`

## Bloquea producción (54)

Mientras cualquiera de estas siga abierta, no se sale a producción. La marca la pone una
etiqueta `` `[bloq]` `` en el track, no una regla sobre el texto: hay tareas que ningún documento
llama BLOCKER y que aun así tienen producción detenida hoy.

### Crítica (21) — Producción no sale sin esto, o ya está roto en producción hoy.

- [ ] `⛔ bloquea prod` `Crítica` **L-04** Domain + DNS + email domain — Blocked by: — (do early; ADR-054 follow-up) · Falta: owner-side only — registrar, DNS zone and Resend console (O-4 … O-6, O-13 in `11-pre-launch-and-deferred.md`); nothing in the repo can prove it. · `06-landing.md:59`
- [ ] `⛔ bloquea prod` `Crítica` **X-01** Staging environment (Q17 "A later") — Blocked by: B-01…B-10 · Falta: the repo is ready (`eas.json` splits preview/production env and entitlement keys; both `vercel.json` pin `pdx1`) but `docs/ops/provisioning.md` has no staging section and `scripts/hosted/*` targets one database; the `xangarro-staging` Supabase project, the Vercel Preview env, the Stripe test binding and the separate keypair are all outside the repo. · `07-launch.md:10`
- [ ] `⛔ bloquea prod` `Crítica` **X-10** Launch checklist gate — Blocked by: X-01…X-09 (except X-08) · `07-launch.md:120`
- [ ] `⛔ bloquea prod` `Crítica` **N-30** Closed beta `[LAUNCH]` — Blocked by: X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29 · `09-next-features.md:800`
- [ ] `⛔ bloquea prod` `Crítica` **O-2** Turn Data API off · `11-pre-launch-and-deferred.md:25`
- [ ] `⛔ bloquea prod` `Crítica` **O-3** Backups / PITR on a paid plan · `11-pre-launch-and-deferred.md:26`
- [ ] `⛔ bloquea prod` `Crítica` **O-8** Database URLs per role (Transaction pooler, port 6543) · `11-pre-launch-and-deferred.md:33`
- [ ] `⛔ bloquea prod` `Crítica` **O-9** Generate secrets: `DEVICE_TOKEN_SECRET`, `CRON_SECRET`, `ADMIN_INGEST_SECRET` (same in both apps), `ADMIN_TOT… · `11-pre-launch-and-deferred.md:34`
- [ ] `⛔ bloquea prod` `Crítica` **O-30** Set `CRON_SECRET` in Vercel (xangarro-web, Production, Sensitive) and redeploy. Found by the 2026-09-27 smoke… · `11-pre-launch-and-deferred.md:37`
- [ ] `⛔ bloquea prod` `Crítica` **O-12** Needs you (manual, 2026-09-23): Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLI… · `11-pre-launch-and-deferred.md:44`
- [ ] `⛔ bloquea prod` `Crítica` **O-17** Counsel review of `docs/legal/aviso/*` (16 open questions in its README), incl. whether ADR-064's 6-year dorm… · `11-pre-launch-and-deferred.md:54`
- [ ] `⛔ bloquea prod` `Crítica` **O-33** Vercel deploys are refused unless HEAD's commit author may deploy. On 2026-09-26 a release sat `Blocked` — no… · `11-pre-launch-and-deferred.md:67`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Legal entity named. `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`, · `../launch/production-readiness.md:10`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Lawyer's review of the five texts + the five confirmations in · `../launch/production-readiness.md:23`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Self-service account deletion in the portal (export → confirm → cancel Stripe → · `../launch/production-readiness.md:59`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Cancel in one click from Configuración → Suscripción. · `../launch/production-readiness.md:74`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Renewal reminder e-mail ≥ 5 business days before each charge, with a one-click · `../launch/production-readiness.md:81`
- [ ] `⛔ bloquea prod` `Crítica` BEFORE-STORES — Apple Privacy Nutrition Label + privacy manifest; Play Data Safety form — · `../launch/production-readiness.md:92`
- [ ] `⛔ bloquea prod` `Crítica` BEFORE-STORES — Terms and privacy URLs live (`xangarro.mx/privacidad`, `/terminos`) and · `../launch/production-readiness.md:94`
- [ ] `⛔ bloquea prod` `Crítica` BEFORE-STORES — Reviewer notes explaining the device + NIP model (no in-app account, no · `../launch/production-readiness.md:96`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — IMPI trademark search and filing for "Xangarro" (classes 9, 35, 36, 42) before · `../launch/production-readiness.md:124`

### Alta (32) — Bloquea el lanzamiento, o destraba a varias otras.

- [ ] `⛔ bloquea prod` `Alta` **A-16** Maestro suite for the new app — Blocked by: A-04…A-10, A-15 `[alta]` `[bloq]` · Falta: 133 flows exist (plan says 142). `login-operator-pin.yaml` not created; the eight pre-activation flows to delete are still present; `full-regression.sh` still buckets demo/wizard/fresh and calls `wizard-local-standalone`; the A-01/A-09 rework list is unaddressed; no green iPhone + iPad run recorded. Also owns A-15's «regression green» clause. · `05-app.md:194`
- [ ] `⛔ bloquea prod` `Alta` **X-02** End-to-end integration run (real app ↔ real backend) — Blocked by: X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · `07-launch.md:18`
- [ ] `⛔ bloquea prod` `Alta` **X-03** Partner migration — Blocked by: X-02 · `07-launch.md:24`
- [ ] `⛔ bloquea prod` `Alta` **X-04** Xangarro as tenant #1 (dogfooding) — Blocked by: X-02 · `07-launch.md:30`
- [ ] `⛔ bloquea prod` `Alta` **X-05** Store listings + review readiness — Blocked by: F-01, A-15, X-07, B-04 · Falta: `app.json` is renamed (Xangarro!, `mx.xangarro.mobile`) and `store:screenshots` exists, but `docs/store/listing-*.md` still points support/privacy/terms at `cachink.mx`, the copy is pre-pivot (modo local, Director, LAN sync), there are no review notes (demo account, «no purchase flow»), and `eas.json` `submit.production` has no `ascAppId`. · `07-launch.md:38`
- [ ] `⛔ bloquea prod` `Alta` **X-07** Brand masters + derivatives (ADR-054 §6) — Blocked by: logo work (external) · Falta: the icon kit is landed in `assets/brand/icons/` and wired into all four apps (mobile icon + adaptive + themed layers, portal/console favicons and touch icons, landing favicons + manifest + the OG image). Still missing: `logo.png`, `splash-mobile.png` (the shipped splash still reads «Cachink!»), and deleting the four `role-*.png`. · `07-launch.md:101`
- [~] `⛔ bloquea prod` `Alta` **N-03** Overage warnings and provider alerts `[LAUNCH]` — Blocked by: N-02, N-08, B-14 · Falta: no portal usage banner; no app banner driven by the pulled `usage` (`usageMessageCode` is never called; `PlanLimitSheet` counts locally); no contract test that a paid tenant at 150 % still syncs every row (the mock's `over-limit` scenario is unused). · `09-next-features.md:142`
- [~] `⛔ bloquea prod` `Alta` **N-12** "Platícanos de ti" wizard `[LAUNCH]` — Blocked by: N-11, N-19 · Falta: acceptance met (`suggested-plan-table.test.ts`, 535ceaa1). Business type and WhatsApp answers are never saved although `businesses.tipo_negocio` / `whatsapp` exist (`AplicarConfiguracionUseCase` writes only name + payment methods); step 6 records `hasLogo` with no upload (N-19); answers live in `business_onboarding`, not `businesses.onboarding` — documented, not ratified by an ADR. · `09-next-features.md:399`
- [~] `⛔ bloquea prod` `Alta` **N-19** Logo + brand colour `[LAUNCH]` — Blocked by: C-15 · Falta: the phone does not download or cache the logo (nothing fetches `/api/logos`; 73324085 only added the branding columns), so «renders offline» is unmet. The monthly-PDF logo (02b207da) is done — drop it from «still to do». · `09-next-features.md:561`
- [~] `⛔ bloquea prod` `Alta` **N-21** WhatsApp share `[LAUNCH]` — Blocked by: N-20 (done) · web half landed 2026-09-20 · Falta: phone half only. · `09-next-features.md:621`
- [ ] `⛔ bloquea prod` `Alta` **N-22** App sync banners `[LAUNCH]` — Blocked by: A-06, A-07 · `09-next-features.md:655`
- [ ] `⛔ bloquea prod` `Alta` **N-24** Phone app adopts the Track O operator design `[LAUNCH]` — Blocked by: — `[alta]` `[bloq]` · `09-next-features.md:701`
- [ ] `⛔ bloquea prod` `Alta` **N-25** QR device pairing `[LAUNCH]` — Blocked by: C-14, B-11, P-06, A-04, N-24 · Falta: the phone side only — verified App Links and Universal Links (`assetlinks.json`, AASA) for `app.xangarro.mx/activar`, reading the token from the fragment, the camera screen, the SEC-MOB-04 confirmation «¿Vincular a _negocio_?» before redeeming (needs a small preview that names the business for a token, not built), and the Maestro deep-link flow. The contract, the token, the portal QR, the WhatsApp share and the `/activar` fallback page exist. Still blocked by N-24. · `09-next-features.md:724`
- [~] `⛔ bloquea prod` `Alta` **N-26** Security audit `[LAUNCH]` — Blocked by: N-05, B-17 · Falta: 4 of 6 highs fixed (SEC-AUTH-01/02, SEC-SEC-01, SEC-DEV-01 — the oracle closed and the QR token built by C-14, 2026-09-23); SEC-DATA-01 is the owner switch O-2; SEC-PRIV-01 is N-34. Mediums in scope, 2026-09-23: **SEC-WEB-01 done** — the portal sends X-Frame-Options, an enforced `frame-ancestors 'none'`, nosniff, HSTS, a strict referrer and Permissions-Policy, `poweredByHeader` off, from one implementation shared with the console (`@xangarro/config/security`); its full nonce CSP (`src/proxy.ts`, with `'wasm-unsafe-eval'` and workers for the register) is served **report-only** to `/api/csp-report`, and the sweep found zero violations on 18 pages and every register/sync e2e flow after two fixes (Zod's eval probe set `jitless` in the head; every route rendered per request so every script gets the nonce). · `09-next-features.md:750`
- [~] `⛔ bloquea prod` `Alta` **N-27** Database audit `[LAUNCH]` — Blocked by: B-03, B-08, B-09 · Falta: round 2 re-checked the 25 first-round findings (9 fixed, 9 partial, 6 open, 1 obsolete; QRY-01 and MIG-01 were only partial, SYNC-02 was done) and measured 24 new DB2-\* findings at scale. Fixed on `perf/db-scale`: DB2-USE-01 (indexes + debounced recount), DB2-SYNC-01/-02 (batched push, ADR-120), DB2-QRY-01..04, DB2-EXP-01, DB2-DEV-01/-02, DB2-HOT-01, DB2-CONN-01, DB2-MIG-01 (no-transaction migrations, ADR-119; not the stale drizzle journal), DB2-IDX-01, DB2-RLS-01, DB2-CRON-01, DB2-PAGE-01. Open: DB-OPS-01/DB2-OPS-01 (PITR + drill = O-3), DB2-QRY-05 (`product_stock` rollup; the snapshot bootstrap is done, ADR-121), DB2-SYNC-03 (receipt/log retention, needs an ADR), DB2-CHK-01 (the never-created B-19), the drizzle journal half of B-20, DB2-KEY-01, DB2-PART-01 (S2 ADR), incremental usage counters; UI in `18-db-scale-design-changes.md`. Round 3 (`docs/audits/db-2026-09-26-r3.html`) audited the branch itself: 31 findings (7 high). Fixed on `perf/db-scale`: DB3-MIG-01, DB3-IDX-01, DB3-OPS-01, DB3-SYNC-01 (a)(c)/-02/-03/-04. Fixed on `perf/db-launch`: DB3-BOOT-01 (the bootstrap passed Vercel's 4.5 MB limit after about a month of a heavy tenant; now a paged snapshot — stock baseline + 90 days of movements, ≤ 2 MB a page — ADR-121, C-23; also the bootstrap half of DB2-QRY-05). DB3-EXP-01 (streamed exports), DB3-EST-01 (13-month cap, sums in SQL), DB3-SYNC-05 (503 + Retry-After instead of queueing), DB3-QRY-03 (summary), ADR-122. DB3-SYNC-01 (b) (a batch refused as a whole is halved to its row; row size limit), DB3-L-02/03/07. Also fixed on `perf/db-launch`: DB3-CAJA-01/02/03 (one tab owns the caja, one «por enviar», cierre with a banner, idle pulls; ADR-123) and DB3-CAJA-04 in part (queued OPFS writes; the VFS stays open). `pg_stat_statements` re-run still needs the hosted project. · `09-next-features.md:768`
- [ ] `⛔ bloquea prod` `Alta` **N-28** Performance audit `[LAUNCH]` — Blocked by: X-01 · `09-next-features.md:782`
- [ ] `⛔ bloquea prod` `Alta` **N-29** Deterministic full-stack E2E gate `[LAUNCH]` — Blocked by: P-17, A-16, N-22, N-25 · `09-next-features.md:790`
- [~] `⛔ bloquea prod` `Alta` **N-32** Store-compliance sweep `[LAUNCH]` — Blocked by: N-24, A-15 · Falta: reviewer checklist for X-05 in `docs/store/`. `pnpm lint:store` is green again and gated in `ci.yml` (see Progress). · `09-next-features.md:839`
- [~] `⛔ bloquea prod` `Alta` **N-34** Aviso de privacidad + ARCO requests `[LAUNCH]` — Blocked by: N-08 · Falta: the operator-NIP notice (variante C); Configuración → Privacidad to withdraw consent; self-service deletion; routing requests from a merchant's customers to the merchant; PRIV-GEO-01, PRIV-IA-01/02, PRIV-OPS-01. The texts are drafts with `[BRACKET]` gaps until counsel signs off (O-17). Hosted apply done 2026-09-25: `db:migrate:hosted` applied data-pg `0034`–`0042` and console `0017`–`0019` (12 files; the first production signup had failed with 42883 on `privacy_consent_record`); dry run reports 0 pending. Progress: 2026-09-23 · **The aviso is reachable from every surface.** xangarro.mx gets `/privacidad` (the aviso integral) and `/privacidad/arco` (section A of the procedure; the internal annex B is not published), rendered at build time from `docs/legal/aviso/*.md` with every `>` note dropped, as the drafts say; the prerender refuses to publish «BORRADOR», «Nota:» or «Anexo interno». Links: the landing footer, the portal sidebar (beside Ayuda), the login screen, the signup consent (already), and the device-linking notice. · `09-next-features.md:866`
- [ ] `⛔ bloquea prod` `Alta` **O-7** Check the Vercel plan allows 4 cron jobs and pinned regions · `11-pre-launch-and-deferred.md:32`
- [ ] `⛔ bloquea prod` `Alta` **O-31** Functions run in `iad1`, not `pdx1`. The 2026-09-27 smoke check read `x-vercel-id: …::iad1::…` although O-4 p… · `11-pre-launch-and-deferred.md:38`
- [ ] `⛔ bloquea prod` `Alta` **O-22** Staging (X-01) before the first paying customer · `11-pre-launch-and-deferred.md:68`
- [ ] `⛔ bloquea prod` `Alta` Configuración → Privacidad: show accepted version, toggle novedades (writes a · `../launch/production-readiness.md:52`
- [ ] `⛔ bloquea prod` `Alta` In-app "Desvincular y borrar los datos de este dispositivo" (aviso §7 currently admits · `../launch/production-readiness.md:62`
- [ ] `⛔ bloquea prod` `Alta` ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day · `../launch/production-readiness.md:64`
- [ ] `⛔ bloquea prod` `Alta` Breach protocol with the Reglamento art. 65 field list, a named person, and the 72 h clause to · `../launch/production-readiness.md:68`
- [ ] `⛔ bloquea prod` `Alta` Verify Sentry server-side captures no PII before the aviso says so. · `../launch/production-readiness.md:70`
- [ ] `⛔ bloquea prod` `Alta` Recurring-charge consent screen at checkout: frequency, amount, date, express acceptance. · `../launch/production-readiness.md:83`
- [ ] `⛔ bloquea prod` `Alta` Address, phone and complaint channel visible before contracting (landing + checkout). · `../launch/production-readiness.md:85`
- [ ] `⛔ bloquea prod` `Alta` Legal links (aviso, términos) in the landing footer, the portal footer, e-mail footers. · `../launch/production-readiness.md:86`
- [ ] `⛔ bloquea prod` `Alta` Signed DPAs: Supabase, Vercel, Sentry, Stripe, mail provider, PAC, Microsoft (Foundry), · `../launch/production-readiness.md:104`
- [ ] `⛔ bloquea prod` `Alta` Receipt (`comprobante`) carries "Este comprobante no es un CFDI" and the negocio's name as · `../launch/production-readiness.md:115`

### Media (1) — Se necesita poco después de salir, o su disparador ya es cierto.

- [ ] `⛔ bloquea prod` `Media` **X-09** ROADMAP.md reset — Blocked by: X-02 · `07-launch.md:114`

## Papeleo del dueño (7)

Sólo el dueño las mueve: cuentas, llaves, DNS, KYC, firmas. Ninguna se destraba escribiendo código.

### Lanzamiento (7)

- [ ] `⛔ bloquea prod` `Crítica` **O-12** Needs you (manual, 2026-09-23): Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLI… · `11-pre-launch-and-deferred.md:44`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — IMPI trademark search and filing for "Xangarro" (classes 9, 35, 36, 42) before · `../launch/production-readiness.md:124`
- [ ] `Media` Licences recorded for hero images/illustrations/fonts (assets beyond sounds and map data). · `../launch/production-readiness.md:126`
- [ ] `Baja` **O-10** Archive `z3r0maker/CachinkLanding` on GitHub (do not delete) · `11-pre-launch-and-deferred.md:35`
- [ ] `Baja` **O-11** `gh auth login` on the dev machine · `11-pre-launch-and-deferred.md:36`
- [ ] `Baja` Cyber-liability insurance — business decision. · `../launch/production-readiness.md:127`
- [ ] `Baja` INDAUTOR software registration — optional. · `../launch/production-readiness.md:128`

## Legal y cumplimiento (17)

Textos, consentimiento y los derechos que el aviso promete. Varias esperan al abogado.

### Lanzamiento (17)

- [ ] `⛔ bloquea prod` `Crítica` **O-17** Counsel review of `docs/legal/aviso/*` (16 open questions in its README), incl. whether ADR-064's 6-year dorm… · `11-pre-launch-and-deferred.md:54`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Legal entity named. `[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[RFC]`, `[TELÉFONO]`, · `../launch/production-readiness.md:10`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Lawyer's review of the five texts + the five confirmations in · `../launch/production-readiness.md:23`
- [~] `⛔ bloquea prod` `Alta` **N-34** Aviso de privacidad + ARCO requests `[LAUNCH]` — Blocked by: N-08 · Falta: the operator-NIP notice (variante C); Configuración → Privacidad to withdraw consent; self-service deletion; routing requests from a merchant's customers to the merchant; PRIV-GEO-01, PRIV-IA-01/02, PRIV-OPS-01. The texts are drafts with `[BRACKET]` gaps until counsel signs off (O-17). Hosted apply done 2026-09-25: `db:migrate:hosted` applied data-pg `0034`–`0042` and console `0017`–`0019` (12 files; the first production signup had failed with 42883 on `privacy_consent_record`); dry run reports 0 pending. Progress: 2026-09-23 · **The aviso is reachable from every surface.** xangarro.mx gets `/privacidad` (the aviso integral) and `/privacidad/arco` (section A of the procedure; the internal annex B is not published), rendered at build time from `docs/legal/aviso/*.md` with every `>` note dropped, as the drafts say; the prerender refuses to publish «BORRADOR», «Nota:» or «Anexo interno». Links: the landing footer, the portal sidebar (beside Ayuda), the login screen, the signup consent (already), and the device-linking notice. · `09-next-features.md:866`
- [ ] `Alta` **O-14** Contador sign-off on CFDI questions: PUE vs PPD for SPEI paid-on-receipt; ClaveProdServ `81112106` / unit `E4… · `11-pre-launch-and-deferred.md:51`
- [ ] `Alta` **O-15** Generate the CSD (Certificado de Sello Digital) in CertiSAT with the e.firma · `11-pre-launch-and-deferred.md:52`
- [ ] `Alta` **O-29** Counsel writes and approves an aviso de privacidad simplificado for signup. The signup page then shows it wit… · `11-pre-launch-and-deferred.md:56`
- [~] `Alta` Aviso de privacidad integral — `docs/legal/aviso/aviso-integral.md` (generic, category-based). · `../launch/production-readiness.md:18`
- [~] `Alta` Aviso simplificado (3 variantes) — `docs/legal/aviso/aviso-simplificado.md`. · `../launch/production-readiness.md:19`
- [~] `Alta` Términos y Condiciones — `docs/legal/aviso/terminos-borrador.md` (replaces `docs/legal/terms.md`). · `../launch/production-readiness.md:20`
- [~] `Alta` Anexo de encargado — `docs/legal/aviso/encargado-clausulas.md`. · `../launch/production-readiness.md:21`
- [~] `Alta` Procedimiento ARCO — `docs/legal/aviso/arco-procedimiento.md`. · `../launch/production-readiness.md:22`
- [ ] `Alta` Fill the three `[PAÍS]` cells in aviso §6.1 (error monitoring, mail, messaging) and the · `../launch/production-readiness.md:27`
- [ ] `Media` **O-16** Until `live`: issue CFDIs manually in the SAT portal from the backoffice "Pagos sin CFDI" list; mark each pay… · `11-pre-launch-and-deferred.md:53`
- [ ] `Media` **O-18** Counsel opinion: a platform that never holds funds and takes no fee is outside Ley Fintech / Banxico aggregat… · `11-pre-launch-and-deferred.md:55`
- [ ] `Media` Plantilla de aviso for the negocio's own customers (OQ-L16). · `../launch/production-readiness.md:25`
- [ ] `Baja` Retire `docs/legal/privacy.md` and `docs/legal/terms.md` once the above are approved. · `../launch/production-readiness.md:26`

## Infraestructura y operación (13)

Entornos, base de datos, regiones y respaldos. Se prueban en staging, no en local.

### Lanzamiento (11)

- [ ] `⛔ bloquea prod` `Crítica` **X-01** Staging environment (Q17 "A later") — Blocked by: B-01…B-10 · Falta: the repo is ready (`eas.json` splits preview/production env and entitlement keys; both `vercel.json` pin `pdx1`) but `docs/ops/provisioning.md` has no staging section and `scripts/hosted/*` targets one database; the `xangarro-staging` Supabase project, the Vercel Preview env, the Stripe test binding and the separate keypair are all outside the repo. · `07-launch.md:10`
- [ ] `⛔ bloquea prod` `Crítica` **O-2** Turn Data API off · `11-pre-launch-and-deferred.md:25`
- [ ] `⛔ bloquea prod` `Crítica` **O-3** Backups / PITR on a paid plan · `11-pre-launch-and-deferred.md:26`
- [ ] `⛔ bloquea prod` `Crítica` **O-8** Database URLs per role (Transaction pooler, port 6543) · `11-pre-launch-and-deferred.md:33`
- [ ] `⛔ bloquea prod` `Crítica` **O-9** Generate secrets: `DEVICE_TOKEN_SECRET`, `CRON_SECRET`, `ADMIN_INGEST_SECRET` (same in both apps), `ADMIN_TOT… · `11-pre-launch-and-deferred.md:34`
- [ ] `⛔ bloquea prod` `Crítica` **O-30** Set `CRON_SECRET` in Vercel (xangarro-web, Production, Sensitive) and redeploy. Found by the 2026-09-27 smoke… · `11-pre-launch-and-deferred.md:37`
- [ ] `⛔ bloquea prod` `Crítica` **O-33** Vercel deploys are refused unless HEAD's commit author may deploy. On 2026-09-26 a release sat `Blocked` — no… · `11-pre-launch-and-deferred.md:67`
- [ ] `⛔ bloquea prod` `Alta` **O-7** Check the Vercel plan allows 4 cron jobs and pinned regions · `11-pre-launch-and-deferred.md:32`
- [ ] `⛔ bloquea prod` `Alta` **O-31** Functions run in `iad1`, not `pdx1`. The 2026-09-27 smoke check read `x-vercel-id: …::iad1::…` although O-4 p… · `11-pre-launch-and-deferred.md:38`
- [ ] `⛔ bloquea prod` `Alta` **O-22** Staging (X-01) before the first paying customer · `11-pre-launch-and-deferred.md:68`
- [ ] `Media` **O-32** Note for the Azure move (owner, 2026-09-26): when Postgres moves to Azure (Flexible Server), review a balance… · `11-pre-launch-and-deferred.md:31`

### Post-lanzamiento (2)

- [ ] `Baja` **N-51** DB scaling — Stage 2 (ADR-068) — Trigger: any of DB > 25 GB · a table > 50 M rows · sync p95 > 800 ms (N-07 card). · `09-next-features.md:1205`
- [ ] `Baja` **N-52** DB scaling — Stage 3 (ADR-068) — Trigger: DB > 500 GB or > 10 000 active tenants. · `09-next-features.md:1211`

## Deuda técnica y auditorías (12)

Auditorías, cobertura, arneses y reescrituras de prueba. Nada de esto es función nueva.

### Lanzamiento (4)

- [~] `⛔ bloquea prod` `Alta` **N-26** Security audit `[LAUNCH]` — Blocked by: N-05, B-17 · Falta: 4 of 6 highs fixed (SEC-AUTH-01/02, SEC-SEC-01, SEC-DEV-01 — the oracle closed and the QR token built by C-14, 2026-09-23); SEC-DATA-01 is the owner switch O-2; SEC-PRIV-01 is N-34. Mediums in scope, 2026-09-23: **SEC-WEB-01 done** — the portal sends X-Frame-Options, an enforced `frame-ancestors 'none'`, nosniff, HSTS, a strict referrer and Permissions-Policy, `poweredByHeader` off, from one implementation shared with the console (`@xangarro/config/security`); its full nonce CSP (`src/proxy.ts`, with `'wasm-unsafe-eval'` and workers for the register) is served **report-only** to `/api/csp-report`, and the sweep found zero violations on 18 pages and every register/sync e2e flow after two fixes (Zod's eval probe set `jitless` in the head; every route rendered per request so every script gets the nonce). · `09-next-features.md:750`
- [~] `⛔ bloquea prod` `Alta` **N-27** Database audit `[LAUNCH]` — Blocked by: B-03, B-08, B-09 · Falta: round 2 re-checked the 25 first-round findings (9 fixed, 9 partial, 6 open, 1 obsolete; QRY-01 and MIG-01 were only partial, SYNC-02 was done) and measured 24 new DB2-\* findings at scale. Fixed on `perf/db-scale`: DB2-USE-01 (indexes + debounced recount), DB2-SYNC-01/-02 (batched push, ADR-120), DB2-QRY-01..04, DB2-EXP-01, DB2-DEV-01/-02, DB2-HOT-01, DB2-CONN-01, DB2-MIG-01 (no-transaction migrations, ADR-119; not the stale drizzle journal), DB2-IDX-01, DB2-RLS-01, DB2-CRON-01, DB2-PAGE-01. Open: DB-OPS-01/DB2-OPS-01 (PITR + drill = O-3), DB2-QRY-05 (`product_stock` rollup; the snapshot bootstrap is done, ADR-121), DB2-SYNC-03 (receipt/log retention, needs an ADR), DB2-CHK-01 (the never-created B-19), the drizzle journal half of B-20, DB2-KEY-01, DB2-PART-01 (S2 ADR), incremental usage counters; UI in `18-db-scale-design-changes.md`. Round 3 (`docs/audits/db-2026-09-26-r3.html`) audited the branch itself: 31 findings (7 high). Fixed on `perf/db-scale`: DB3-MIG-01, DB3-IDX-01, DB3-OPS-01, DB3-SYNC-01 (a)(c)/-02/-03/-04. Fixed on `perf/db-launch`: DB3-BOOT-01 (the bootstrap passed Vercel's 4.5 MB limit after about a month of a heavy tenant; now a paged snapshot — stock baseline + 90 days of movements, ≤ 2 MB a page — ADR-121, C-23; also the bootstrap half of DB2-QRY-05). DB3-EXP-01 (streamed exports), DB3-EST-01 (13-month cap, sums in SQL), DB3-SYNC-05 (503 + Retry-After instead of queueing), DB3-QRY-03 (summary), ADR-122. DB3-SYNC-01 (b) (a batch refused as a whole is halved to its row; row size limit), DB3-L-02/03/07. Also fixed on `perf/db-launch`: DB3-CAJA-01/02/03 (one tab owns the caja, one «por enviar», cierre with a banner, idle pulls; ADR-123) and DB3-CAJA-04 in part (queued OPFS writes; the VFS stays open). `pg_stat_statements` re-run still needs the hosted project. · `09-next-features.md:768`
- [ ] `⛔ bloquea prod` `Alta` **N-28** Performance audit `[LAUNCH]` — Blocked by: X-01 · `09-next-features.md:782`
- [ ] `⛔ bloquea prod` `Alta` **N-29** Deterministic full-stack E2E gate `[LAUNCH]` — Blocked by: P-17, A-16, N-22, N-25 · `09-next-features.md:790`

### Post-lanzamiento (2)

- [ ] `Media` **N-45** External penetration test — Trigger: N-42 and N-43 on staging. · `09-next-features.md:1158`
- [ ] `Baja` **N-49** GLM exploratory tester — Trigger: X-01 staging live and N-29 green. · `09-next-features.md:1192`

### Colas de tracks (6)

- [ ] `Alta` **P-35** Portal coverage to 95% (unit + E2E merged, ADR-102) — Blocked by: — · `04-portal.md:1626`
- [ ] `⛔ bloquea prod` `Alta` **A-16** Maestro suite for the new app — Blocked by: A-04…A-10, A-15 `[alta]` `[bloq]` · Falta: 133 flows exist (plan says 142). `login-operator-pin.yaml` not created; the eight pre-activation flows to delete are still present; `full-regression.sh` still buckets demo/wizard/fresh and calls `wizard-local-standalone`; the A-01/A-09 rework list is unaddressed; no green iPhone + iPad run recorded. Also owns A-15's «regression green» clause. · `05-app.md:194`
- [ ] `Media` **P-21** `pnpm design:compare` capture harness — Blocked by: P-18 · Falta: the whole harness. The one verified in `83ec5840` (2026-09-21) was never committed: the unanchored `.gitignore` pattern `design-compare/` also matched `scripts/design-compare/`, so the commit carried only the `package.json` script and the ignore line. The sources are on no disk (worktree and main checkout checked) and in no commit. Same day: the pattern is now `/design-compare/` and the dangling `design:compare` script is removed, so the Steps below are a rewrite, not a recovery. Restore the script entry when the harness lands. · `04-portal.md:187`
- [~] `Media` **P-23** Primitives + Storybook inventory + visual-regression baselines — Blocked by: P-22 · Falta: the `design:compare` acceptance clause waits on P-21, reopened the same day (the harness was never committed and exists on no disk; see P-21). No Storybook page in `apps/web`; Toast, gauge, nav item, switcher and user menu are unharnessed. 2026-09-22 doc audit: shipped except the `design:compare` gate in its Acceptance. In progress: 2026-09-17 · **core vocabulary built and rendering**, gate not yet closed. · `04-portal.md:253`
- [ ] `Media` **M-11** Maestro rework. · `19-movil-mostrador.md:34`
- [ ] `Media` **M-12** Leftovers from M-01. · `19-movil-mostrador.md:35`

## Tiendas (App Store / Play) (8)

Lo que Apple y Google exigen antes de la primera revisión.

### Lanzamiento (7)

- [ ] `⛔ bloquea prod` `Crítica` BEFORE-STORES — Apple Privacy Nutrition Label + privacy manifest; Play Data Safety form — · `../launch/production-readiness.md:92`
- [ ] `⛔ bloquea prod` `Crítica` BEFORE-STORES — Terms and privacy URLs live (`xangarro.mx/privacidad`, `/terminos`) and · `../launch/production-readiness.md:94`
- [ ] `⛔ bloquea prod` `Crítica` BEFORE-STORES — Reviewer notes explaining the device + NIP model (no in-app account, no · `../launch/production-readiness.md:96`
- [ ] `⛔ bloquea prod` `Alta` **X-05** Store listings + review readiness — Blocked by: F-01, A-15, X-07, B-04 · Falta: `app.json` is renamed (Xangarro!, `mx.xangarro.mobile`) and `store:screenshots` exists, but `docs/store/listing-*.md` still points support/privacy/terms at `cachink.mx`, the copy is pre-pivot (modo local, Director, LAN sync), there are no review notes (demo account, «no purchase flow»), and `eas.json` `submit.production` has no `ascAppId`. · `07-launch.md:38`
- [~] `⛔ bloquea prod` `Alta` **N-32** Store-compliance sweep `[LAUNCH]` — Blocked by: N-24, A-15 · Falta: reviewer checklist for X-05 in `docs/store/`. `pnpm lint:store` is green again and gated in `ci.yml` (see Progress). · `09-next-features.md:839`
- [ ] `Media` Open-source licence notices screen generated from `pnpm licenses list --prod` (1,184 pkgs, no · `../launch/production-readiness.md:98`
- [ ] `Baja` Never add Sign in with Apple/Google to the mobile app (would trigger 5.1.1(v)). · `../launch/production-readiness.md:100`

### Colas de tracks (1)

- [ ] `Alta` **L-05** Store badges + legal pages — Blocked by: X-05 (real store URLs) · Falta: `/privacidad/` and `/privacidad/arco/` exist on the landing, rendered from `docs/legal/aviso/*.md`, linked from the footer and carrying WebPage schema (N-34, L-07); · `06-landing.md:88`

## Terceros y alianzas (8)

Proveedores y alianzas: Clip, Mercado Pago, el PAC, los DPA.

### Lanzamiento (7)

- [ ] `⛔ bloquea prod` `Alta` Signed DPAs: Supabase, Vercel, Sentry, Stripe, mail provider, PAC, Microsoft (Foundry), · `../launch/production-readiness.md:104`
- [ ] `Alta` Foundry hosting option decided and configured (Hosted on Azure, US DataZone recommended); · `../launch/production-readiness.md:106`
- [ ] `Alta` `ASESOR_LLM_*` never pointed at a personal proxy with real tenant data (add a guard). · `../launch/production-readiness.md:108`
- [ ] `Media` **O-19** Contact Clip's partner team (sdk@payclip.com): OAuth/partner programme, a test device, bulk PinPad installs · `11-pre-launch-and-deferred.md:57`
- [ ] `Media` **O-27** Create a Mercado Pago developer app (Tus integraciones), copy its test access token and run `scripts/spikes/m… · `11-pre-launch-and-deferred.md:58`
- [ ] `Media` **O-28** Clip: finish KYC, check the reader model (Total 3 / Ultra / PinPad / Stand 2; not Plus), create production ke… · `11-pre-launch-and-deferred.md:59`
- [ ] `Media` Rule: the Asesor's model boundary stays the only module that knows a model exists; the IA · `../launch/production-readiness.md:109`

### Post-lanzamiento (1)

- [~] `Media` **N-40** Provider validation + Clip partnership + legal opinion — Trigger: N-30 exit criteria met. **The Clip conversation starts now** (owner action, not gated by the trigger). · `09-next-features.md:1026`

## Coordinación de lanzamiento (7)

Coordinación: integración de punta a punta, beta, dogfooding y la compuerta X-10.

### Lanzamiento (7)

- [ ] `⛔ bloquea prod` `Crítica` **X-10** Launch checklist gate — Blocked by: X-01…X-09 (except X-08) · `07-launch.md:120`
- [ ] `⛔ bloquea prod` `Alta` **X-02** End-to-end integration run (real app ↔ real backend) — Blocked by: X-01, P-03, P-04, P-05, P-06, P-11, A-04…A-10, L-03 · `07-launch.md:18`
- [ ] `⛔ bloquea prod` `Alta` **X-03** Partner migration — Blocked by: X-02 · `07-launch.md:24`
- [ ] `⛔ bloquea prod` `Alta` **X-04** Xangarro as tenant #1 (dogfooding) — Blocked by: X-02 · `07-launch.md:30`
- [ ] `⛔ bloquea prod` `Alta` **X-07** Brand masters + derivatives (ADR-054 §6) — Blocked by: logo work (external) · Falta: the icon kit is landed in `assets/brand/icons/` and wired into all four apps (mobile icon + adaptive + themed layers, portal/console favicons and touch icons, landing favicons + manifest + the OG image). Still missing: `logo.png`, `splash-mobile.png` (the shipped splash still reads «Cachink!»), and deleting the four `role-*.png`. · `07-launch.md:101`
- [ ] `⛔ bloquea prod` `Media` **X-09** ROADMAP.md reset — Blocked by: X-02 · `07-launch.md:114`
- [ ] `Baja` **X-08** Repo + directory rename (optional, coordinate) — Blocked by: A-15 · `07-launch.md:108`

## Producto (112)

Función nueva o por terminar, en el portal, la app, el backend o la consola.

### Lanzamiento (31)

- [ ] `⛔ bloquea prod` `Crítica` **N-30** Closed beta `[LAUNCH]` — Blocked by: X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29 · `09-next-features.md:800`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Self-service account deletion in the portal (export → confirm → cancel Stripe → · `../launch/production-readiness.md:59`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Cancel in one click from Configuración → Suscripción. · `../launch/production-readiness.md:74`
- [ ] `⛔ bloquea prod` `Crítica` BLOCKER — Renewal reminder e-mail ≥ 5 business days before each charge, with a one-click · `../launch/production-readiness.md:81`
- [~] `⛔ bloquea prod` `Alta` **N-03** Overage warnings and provider alerts `[LAUNCH]` — Blocked by: N-02, N-08, B-14 · Falta: no portal usage banner; no app banner driven by the pulled `usage` (`usageMessageCode` is never called; `PlanLimitSheet` counts locally); no contract test that a paid tenant at 150 % still syncs every row (the mock's `over-limit` scenario is unused). · `09-next-features.md:142`
- [~] `⛔ bloquea prod` `Alta` **N-12** "Platícanos de ti" wizard `[LAUNCH]` — Blocked by: N-11, N-19 · Falta: acceptance met (`suggested-plan-table.test.ts`, 535ceaa1). Business type and WhatsApp answers are never saved although `businesses.tipo_negocio` / `whatsapp` exist (`AplicarConfiguracionUseCase` writes only name + payment methods); step 6 records `hasLogo` with no upload (N-19); answers live in `business_onboarding`, not `businesses.onboarding` — documented, not ratified by an ADR. · `09-next-features.md:399`
- [~] `⛔ bloquea prod` `Alta` **N-19** Logo + brand colour `[LAUNCH]` — Blocked by: C-15 · Falta: the phone does not download or cache the logo (nothing fetches `/api/logos`; 73324085 only added the branding columns), so «renders offline» is unmet. The monthly-PDF logo (02b207da) is done — drop it from «still to do». · `09-next-features.md:561`
- [~] `⛔ bloquea prod` `Alta` **N-21** WhatsApp share `[LAUNCH]` — Blocked by: N-20 (done) · web half landed 2026-09-20 · Falta: phone half only. · `09-next-features.md:621`
- [ ] `⛔ bloquea prod` `Alta` **N-22** App sync banners `[LAUNCH]` — Blocked by: A-06, A-07 · `09-next-features.md:655`
- [ ] `⛔ bloquea prod` `Alta` **N-24** Phone app adopts the Track O operator design `[LAUNCH]` — Blocked by: — `[alta]` `[bloq]` · `09-next-features.md:701`
- [ ] `⛔ bloquea prod` `Alta` **N-25** QR device pairing `[LAUNCH]` — Blocked by: C-14, B-11, P-06, A-04, N-24 · Falta: the phone side only — verified App Links and Universal Links (`assetlinks.json`, AASA) for `app.xangarro.mx/activar`, reading the token from the fragment, the camera screen, the SEC-MOB-04 confirmation «¿Vincular a _negocio_?» before redeeming (needs a small preview that names the business for a token, not built), and the Maestro deep-link flow. The contract, the token, the portal QR, the WhatsApp share and the `/activar` fallback page exist. Still blocked by N-24. · `09-next-features.md:724`
- [ ] `Alta` Run the Playwright onboarding spec against a database (`apps/web/e2e/onboarding.spec.ts` gained · `../launch/production-readiness.md:46`
- [ ] `Alta` Archive the full text of every `AVISO_VERSION` (a hash without its text proves nothing) — · `../launch/production-readiness.md:50`
- [ ] `⛔ bloquea prod` `Alta` Configuración → Privacidad: show accepted version, toggle novedades (writes a · `../launch/production-readiness.md:52`
- [ ] `⛔ bloquea prod` `Alta` In-app "Desvincular y borrar los datos de este dispositivo" (aviso §7 currently admits · `../launch/production-readiness.md:62`
- [ ] `⛔ bloquea prod` `Alta` ARCO intake without a session (`/privacidad/solicitud`) + console handling with business-day · `../launch/production-readiness.md:64`
- [ ] `⛔ bloquea prod` `Alta` Breach protocol with the Reglamento art. 65 field list, a named person, and the 72 h clause to · `../launch/production-readiness.md:68`
- [ ] `⛔ bloquea prod` `Alta` Verify Sentry server-side captures no PII before the aviso says so. · `../launch/production-readiness.md:70`
- [ ] `⛔ bloquea prod` `Alta` Recurring-charge consent screen at checkout: frequency, amount, date, express acceptance. · `../launch/production-readiness.md:83`
- [ ] `⛔ bloquea prod` `Alta` Address, phone and complaint channel visible before contracting (landing + checkout). · `../launch/production-readiness.md:85`
- [ ] `⛔ bloquea prod` `Alta` Legal links (aviso, términos) in the landing footer, the portal footer, e-mail footers. · `../launch/production-readiness.md:86`
- [ ] `⛔ bloquea prod` `Alta` Receipt (`comprobante`) carries "Este comprobante no es un CFDI" and the negocio's name as · `../launch/production-readiness.md:115`
- [ ] `Alta` Advertising claims on the landing are demonstrable (LFPC art. 32). · `../launch/production-readiness.md:120`
- [ ] `Media` SOON — Nightly seal job: call `xangarro.privacy_consents_day_root(day)` and obtain a · `../launch/production-readiness.md:48`
- [ ] `Media` Re-consent gate on login when a version adds a finalidad (art. 11); banner otherwise. · `../launch/production-readiness.md:54`
- [ ] `Media` Decide checkbox vs. button-as-consent with the lawyer (OQ-N7); today: checkbox. · `../launch/production-readiness.md:55`
- [ ] `Media` Retention calendar implemented per table (OQ-L13 numbers once confirmed); 72-month rule for · `../launch/production-readiness.md:66`
- [ ] `Media` Price increases: 30-day notice + express re-acceptance flow. · `../launch/production-readiness.md:84`
- [ ] `Media` Attribution retention rule for `signup_attribution` (geo has 400 days; propose the same). · `../launch/production-readiness.md:117`
- [ ] `Media` Landing beacon disclosed in the aviso (done) and a footer link on `xangarro.mx` (open). · `../launch/production-readiness.md:118`
- [ ] `Media` Marketing e-mail: opt-out honoured within the 5-day window; REPEP if phone/SMS ever used. · `../launch/production-readiness.md:119`

### Post-lanzamiento (39)

- [ ] `Media` **Z-01** `ventasCredito` — first portal-delivered feature (Q10) — Trigger: launch done; ≥ 1 customer asks for fiado, or 30 days after launch. · `08-post-launch.md:9`
- [ ] `Media` **N-75** Reconciliation spike — can we see card payments from any reader? · `09-next-features.md:1046`
- [ ] `Media` **N-41** `PaymentProvider` port — read side + Mercado Pago adapter — Blocked by: N-75, ADR-109 · `09-next-features.md:1062`
- [ ] `Media` **N-43** Merchant account linking in Tipos de pago — Blocked by: N-41 · `09-next-features.md:1070`
- [ ] `Media` **N-46** Sync health and devices — Trigger: launch + 30 days, or the first cross-tenant sync incident. · `09-next-features.md:1165`
- [~] `Media` **N-58** Phase 4 — purchases + landing. · `09-next-features.md:1265`
- [~] `Media` **N-60** Phase 6 — ADR-092 + aviso. · `09-next-features.md:1280`
- [ ] `Media` **N-63** Negocio: MRR, churn, trial → paid — Blocked by: N-06 · Trigger: B-10 webhooks write `billing.subscriptions` for the first paying tenant (the N-06 stub is retired). · `09-next-features.md:1309`
- [ ] `Media` **N-64** Activation funnel and weekly cohorts — Blocked by: N-57 · Trigger: X-10 launch (real signups). · `09-next-features.md:1320`
- [ ] `Media` **N-65** Tenant timeline — Blocked by: N-08 · Trigger: now (every source table exists). · `09-next-features.md:1331`
- [ ] `Media` **N-66** Staff roles — Blocked by: N-05 · Trigger: the second staff member is added, or before N-68 / N-71 start — whichever is first. · `09-next-features.md:1340`
- [ ] `Media` **N-67** `/auditoria` — Blocked by: N-05 · Trigger: now. · `09-next-features.md:1350`
- [ ] `Media` **N-71** Cobros: dunning, expiring trials, extend / credit — Blocked by: N-06, N-66 · Trigger: first paying tenant. · `09-next-features.md:1392`
- [ ] `Baja` **Z-02** Portal group-2 screens — Trigger: Z-01 or customer demand. · `08-post-launch.md:15`
- [ ] `Baja` **Z-04** Extract `apps/api` — Trigger: sync p95 latency > 800 ms at the handler, or Vercel function limits hit, or a second client (e.g. a future POS) needs the API without the portal. · `08-post-launch.md:25`
- [ ] `Baja` **Z-05** Stripe payouts → ventas importer (dogfood) — Trigger: X-04 running for 2 months. · `08-post-launch.md:30`
- [ ] `Baja` **Z-07** Multi-sucursal — Trigger: first customer with two locations on Pro. · `08-post-launch.md:43`
- [ ] `Baja` **Z-08** Background sync (Android WorkManager / iOS BGTaskScheduler) — Trigger: telemetry shows > 10 % of sales reaching the cloud > 1 h after capture. · `08-post-launch.md:48`
- [ ] `Baja` **Z-11** Pro extras: audit history + per-operator permissions UI — Trigger: first Pro customer. · Falta: only the audit-history screen (from `sync_log` / `cancelacion_logs`); the per-operator permissions editor already exists as P-05 (`equipo/operador-actions.tsx`, plan-gated, single key `canCancelSales`). · `08-post-launch.md:63`
- [ ] `Baja` **Z-12** Sale-confirm sound: commission new audio (ADR-054 §7) — Trigger: brand work budget. · `08-post-launch.md:69`
- [ ] `Baja` **N-76** Conciliación de tarjeta — Blocked by: N-41, N-43 · `09-next-features.md:1083`
- [ ] `Baja` **N-77** Checklist step and invitations — Blocked by: N-43 · `09-next-features.md:1096`
- [ ] `Baja` **N-80** `PaymentProvider` write side + Mercado Pago Point — Blocked by: N-41, N-40 (MP go), C-13 · `09-next-features.md:1109`
- [ ] `Baja` **N-42** Payment intents backend — Blocked by: N-80, C-13 · `09-next-features.md:1117`
- [ ] `Baja` **N-79** Terminal per caja — Blocked by: N-80, N-43, ADR-109 (D-1) · `09-next-features.md:1127`
- [ ] `Baja` **N-44** Cobrar en terminal (phone and web caja) — Blocked by: N-42, N-79, N-45, N-24, N-53 · `09-next-features.md:1137`
- [ ] `Baja` **N-78** Terminal health at the caja — Blocked by: N-79 · `09-next-features.md:1148`
- [ ] `Baja` **N-47** Broadcast announcements — Trigger: the first planned maintenance window or feature launch after go-live. · `09-next-features.md:1171`
- [ ] `Baja` **N-48** Dormancy lifecycle (ADR-064) — Trigger: launch + 90 days (no tenant can be dormant earlier). · `09-next-features.md:1177`
- [ ] `Baja` **N-50** AI logo generation — Trigger: the ADR-059 production gate on model calls is lifted. · `09-next-features.md:1199`
- [ ] `Baja` **N-54** Facturación for merchants (white-label PAC reseller) — Trigger: N-33 `live` for 3 months, and ≥ 5 customers asking to invoice their own clients. · `09-next-features.md:1216`
- [ ] `Baja` **N-53** Clip adapter — Blocked by: N-41, N-40 (Clip go), N-75 (Clip go) · `09-next-features.md:1227`
- [ ] `Baja` **N-62** Cohort metrics from the fiscal address, not from IP. · `09-next-features.md:1288`
- [ ] `Baja` **N-68** "Ver como" — time-boxed, read-only impersonation — Blocked by: N-66, N-67 · Trigger: X-10 launch and the first inbox item that could not be resolved from `/tenants/[id]` + N-65. · `09-next-features.md:1359`
- [ ] `Baja` **N-69** Flag lifecycle and percentage rollout — Blocked by: N-09 · Trigger: N-09 `[x]`. · `09-next-features.md:1372`
- [ ] `Baja` **N-70** Decisiones — Blocked by: N-07, N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1382`
- [ ] `Baja` **N-72** Cost per tenant — Blocked by: N-63 · Trigger: N-63 `[x]`. · `09-next-features.md:1402`
- [ ] `Baja` **N-73** Account health and NPS micro-survey — Blocked by: N-64, N-47 · Trigger: 50 active tenants. · `09-next-features.md:1410`
- [ ] `Baja` **N-74** Promo and referral codes with attribution — Blocked by: N-64, N-01 · Trigger: X-10 launch. · `09-next-features.md:1420`

### Colas de tracks (42)

- [ ] `⛔ bloquea prod` `Crítica` **L-04** Domain + DNS + email domain — Blocked by: — (do early; ADR-054 follow-up) · Falta: owner-side only — registrar, DNS zone and Resend console (O-4 … O-6, O-13 in `11-pre-launch-and-deferred.md`); nothing in the repo can prove it. · `06-landing.md:59`
- [~] `Alta` **P-36** First production walkthrough: the owner's findings (2026-09-25) — Blocked by: ADR-105 landing (`feat/no-trial`, the billing session) for P-36.1; `feat/don-cuentas-portal` landing for P-36.7 Done: 2026-09-25 · items 2–6 on `main` (`feat/p36-walkthrough`): the guide with its required and optional lists, the D-2 gate (owner, wizard completed, required list open, no opt-out cookie) with «Ir a mi portal» as the escape, both onboarding paths ending on `/como-empiezo`; the wizard's answers applied before any Checkout and Crédito never stored as a method (parser tolerant of old rows); D-1's `BILLING_BETA_NO_CHARGE=1` (to set on `xangarro-web` in Vercel) keeps Checkout closed with the «Durante la beta no cobramos» notice; régimen «Ninguno por ahora» and the two one-line explanations; the edit bar on top; «Tu plan incluye» from the session's plan. Tests: domain 881, application 513, portal unit 522, portal E2E 489 passed (full local run). · Falta: P-36.1 and P-36.7 wait on their branches; the Inicio card's line reads «Listo para vender. N opcionales por hacer» once the required list is done. · `04-portal.md:1765`
- [ ] `Alta` **E-20** Tablero — Blocked by: E-01, OD-4, E-26 (card attachments) · `20-command-center.md:514`
- [ ] `Media` **C-13** Payment intents API — Trigger: N-40 go decision · `02-contracts.md:332`
- [ ] `Media` **C-21** Kill switches on the wire · `02-contracts.md:503`
- [~] `Media` **B-16** Back-office: Studio saved queries + support functions — Blocked by: B-03, B-11 · Falta: no «subscriptions by plan/status» saved query (unblocked now that `billing.subscriptions` exists); `billing.reissue_code` / `billing.resend_magic_link` do not exist. Studio-callable issuance is superseded by ADR-080 — drop that step. Runbook review is a human sign-off. 2026-09-17 · `supabase/studio/`: unresolved rejections, stale devices, codes expiring today, and a SQL sign-in unlock; `xangarro.security_prune()` and `xangarro.session_revoke_user()` (0006); runbook `docs/ops/back-office.md`. `support-tooling.integration.test.ts` runs every saved query on the seed and pins the SQL unlock to the app's throttle key. · `03-backend.md:292`
- [~] `Media` **P-28** Diagnóstico + estrategia — «Próximamente» in production — Blocked by: P-26, P-30 · Falta: only the tab and both gates exist (`asesor/screen.tsx`); the ten sections, month tiles, price table, estrategia list, six states, printable variant and the prompt-injection fixture are all unbuilt. 2026-09-22 doc audit: shipped except the ten report sections and the price table. In progress: 2026-09-17 · the tab and **both gates** are wired; the report itself is not built. Two gates compose in the right order via `resolveScreenState`: `capabilities.asesor === · `04-portal.md:1169`
- [~] `Media` **P-30** Asesor generation runtime — Blocked by: — · Falta: the **model call**, and only that. The fan-out landed — see below. The `notices` line in an earlier Remaining was already stale when it was written: ADR-088's materialise-on-read has written `source='asesor'` rows since `loadAsesorPage`. **Model call.** ADR-056 makes it the last step, prompted from the deterministic figures. Held until **P-28**: the Diagnóstico is `<p>Reporte completo del mes.</p>` behind two gates, so generated prose would land in a table no screen reads. The boundary stays the single module ADR-056 requires (`server/asesor/model.ts`) and `runtime.ts` names the seam. The Batches API and prompt caching ride with it — batching needs a ledger to collect results, which is its own table. 2026-09-26 · **The daily fan-out landed, and it needed no migration.** The open question was which role may enumerate tenants, between a new privileged function, the metering role, and the console's service role. · `04-portal.md:1353`
- [ ] `Media` **P-38** Don Cuentas explains a cash difference — Blocked by: — · `04-portal.md:1867`
- [ ] `Media` **M-10** The owner corrects a sale. · `19-movil-mostrador.md:33`
- [~] `Media` **E-02** Ledger core and Movimientos — Blocked by: E-01 · Falta: the recurring-template screen, the project and category filters, and the contador's código agrupador mapping. Done: the domain (`@xangarro/domain/corp`: chart, movement → balanced lines, reversal, period lock, USD at the day rate, the capture's IVA split and the month's bank summary), the use cases (`@xangarro/application/corp`: registrar and revertir, idempotent imports), corp storage (`entries`, `entry_lines`, `closed_periods`, `recurring_templates`; INSERT/SELECT only, plus deferred balance, has-lines and closed-month triggers) with its integration suite, and the screens: `/empresa/movimientos` (month navigation, Entradas / Salidas / Neto, type chips, the table), `/empresa/movimientos/registrar` (gasto in MXN or USD with the live peso equivalent, comisión bancaria) and the detail with its asiento and «Revertir movimiento». Both writes are founder-gated server actions with a `staff_audit_log` row (`empresa.movimiento_registrado`, `empresa.movimiento_revertido`); corp lives in another database, so the entry commits first and a form nonce as `sourceRef` makes a retry land on the same entry. Playwright: `e2e/empresa.spec.ts` records a USD expense, checks the row, the total and the asiento, reverses it and sees the month back at zero. · `20-command-center.md:261`
- [ ] `Media` **E-10** Ingresos y facturas emitidas — Blocked by: E-02, B-10 · `20-command-center.md:427`
- [ ] `Media` **E-11** Facturas recibidas — Blocked by: E-02, E-05 · `20-command-center.md:439`
- [ ] `Media` **E-12** Estado de resultados y Balance — Blocked by: E-02, OD-1 · `20-command-center.md:451`
- [ ] `Media` **E-13** Impuestos — Blocked by: E-12, the portal's RESICO persona moral fix (session task 2026-10-08) · `20-command-center.md:462`
- [ ] `Media` **E-14** Cierre del mes — Blocked by: E-10, E-11, E-13 · `20-command-center.md:473`
- [ ] `Media` **E-16** Resumen — Blocked by: E-12, E-04 · `20-command-center.md:499`
- [ ] `Media` **E-21** Acciones y cortes — Blocked by: E-20, E-03, E-06 · `20-command-center.md:525`
- [ ] `Media` **E-43** Exportación al contador — Blocked by: E-14 · `20-command-center.md:608`
- [ ] `Media` **E-26** Almacenamiento de documentos en Azure Blob — Blocked by: E-05 · `20-command-center.md:810`
- [ ] `Baja` **P-29** Catálogo desde una foto — «Próximamente» in production — Blocked by: P-07, P-30 · `04-portal.md:1343`
- [!] `Baja` **P-37** Ticket printing from the caja · `04-portal.md:1853`
- [ ] `Baja` **P-39** Don Cuentas conclusions in Estados financieros — Blocked by: P-30, P-28 · `04-portal.md:1882`
- [ ] `Baja` **P-40** First diagnóstico free at 90 days — Blocked by: P-28 · `04-portal.md:1898`
- [ ] `Baja` **P-41** Advanced inventory functions — Blocked by: — · `04-portal.md:1911`
- [ ] `Baja` **L-09** Comparison and alternatives pages against named competitors — Blocked by: owner — the competitor list and the facts about each that we are willing to publish · `06-landing.md:192`
- [ ] `Baja` **L-10** Off-site presence: Reddit and YouTube — Blocked by: owner — accounts and time · `06-landing.md:208`
- [ ] `Baja` **E-15** Límites — Blocked by: E-10 · `20-command-center.md:490`
- [ ] `Baja` **E-22** Presupuesto — Blocked by: E-12 · `20-command-center.md:534`
- [ ] `Baja` **E-23** Caja — Blocked by: E-12 · `20-command-center.md:542`
- [ ] `Baja` **E-30** `corp-tools` and the Claude Desktop MCP server — Blocked by: E-12, OD-3 · `20-command-center.md:552`
- [ ] `Baja` **E-31** Propuestas — Blocked by: E-30 · `20-command-center.md:561`
- [ ] `Baja` **E-32** The agents of §6 — Blocked by: E-31 · `20-command-center.md:570`
- [ ] `Baja` **E-33** Foundry runtime — Blocked by: E-32 · `20-command-center.md:579`
- [ ] `Baja` **E-40** KPIs SaaS — Blocked by: N-63, E-12 · `20-command-center.md:590`
- [ ] `Baja` **E-41** Second project and shared-cost allocation — Blocked by: OD-2, a second project · `20-command-center.md:596`
- [ ] `Baja` **E-42** Banco y tipo de cambio — Blocked by: E-23 · `20-command-center.md:602`
- [ ] `Baja` **E-44** Salida a otro sistema — Blocked by: E-01 · `20-command-center.md:614`
- [ ] `Baja` **E-17** Resumen del trimestre — Blocked by: E-12, E-20, E-04 · `20-command-center.md:703`
- [ ] `Baja` **E-24** Servicios — Blocked by: E-02 · `20-command-center.md:718`
- [ ] `Baja` **E-25** Lectura de estados de cuenta con IA — Blocked by: E-24, E-31, OD-3 · `20-command-center.md:735`
- [ ] `Baja` **E-27** Minutas — Blocked by: E-05, E-31 · `20-command-center.md:829`

## Por archivo

- `02-contracts.md` — 2 abiertos (0 en curso, 0 bloqueados, 21 hechos)
- `03-backend.md` — 1 abiertos (1 en curso, 0 bloqueados, 17 hechos)
- `04-portal.md` — 12 abiertos (4 en curso, 1 bloqueados, 29 hechos)
- `05-app.md` — 1 abiertos (0 en curso, 0 bloqueados, 17 hechos)
- `06-landing.md` — 4 abiertos (0 en curso, 0 bloqueados, 6 hechos)
- `07-launch.md` — 9 abiertos (0 en curso, 0 bloqueados, 2 hechos)
- `08-post-launch.md` — 8 abiertos (0 en curso, 0 bloqueados, 4 hechos)
- `09-next-features.md` — 50 abiertos (11 en curso, 0 bloqueados, 26 hechos)
- `11-pre-launch-and-deferred.md` — 22 abiertos (0 en curso, 0 bloqueados, 11 hechos)
- `16-design-conformance.md` — todo cerrado — archivar (0 en curso, 0 bloqueados, 8 hechos)
- `18-db-scale-design-changes.md` — todo cerrado — archivar (0 en curso, 0 bloqueados, 10 hechos)
- `19-movil-mostrador.md` — 3 abiertos (0 en curso, 0 bloqueados, 9 hechos)
- `20-command-center.md` — 26 abiertos (1 en curso, 0 bloqueados, 5 hechos)
- `../launch/production-readiness.md` — 46 abiertos (5 en curso, 0 bloqueados, 6 hechos)
