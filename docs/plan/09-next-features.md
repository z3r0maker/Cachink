# Track N — Next features (admin console, billing, limits, onboarding, payments, quality)

> **Origin:** the 2026-09-17 feature interview (the owner's "pendientes" list for Xangarro). Every
> decision below was asked one at a time with a recommendation and settled by the owner; the
> reasoning lives in **ADR-063 … ADR-068**. Read those before touching a task here.
>
> **Two lists.** §2 is **launch blockers**: they join the X-track gate — X-10 does not ship until
> every `[LAUNCH]` task is `[x]`. §3 is **post-launch**: each has a **Trigger**, and must not start
> before it is true (same rule as Track Z).
>
> **Research pass (2026-09-17, same day):** the interview's platform assumptions were checked
> against official docs (Stripe, Mercado Pago, Clip, WhatsApp, Apple, Google Play, CFF, LFPDPPP).
> Findings are in §6; five decisions changed as a result (rows 11, 12, 13, 25, 26 and ADR-069/070).
>
> Status rules, Done lines and "never renumber" are those of `00-README.md` §3. Contract changes are
> `C-` tasks in `02-contracts.md` (C-12 … C-15 were added for this track) and land on `main` first.

---

## 1. Decision summary

| #   | Topic                      | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | ADR |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | Domains                    | `xangarro.mx` = landing (separate Vite repo) · `app.xangarro.mx` = customer portal (login exists, P-02) · **`admin.xangarro.mx` = internal console (new)**. DNS in L-04.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 063 |
| 2   | Admin console              | Separate `apps/admin` (Next.js, own Vercel project). Staff allowlist + mandatory 2FA. The Supabase **service role lives only here**. Supersedes Q16 and Z-09.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 063 |
| 3   | Admin v1 modules           | Tenants + licences + Stripe · usage & limit alerts · inbox (support/escalations) · platform flags & kill switches — **launch**. Sync health & devices · broadcast announcements · dormancy lifecycle — **post-launch**. Not built: MRR dashboard (Stripe covers it), impersonation.                                                                                                                                                                                                                                                                                                                                                                 | 063 |
| 4   | Staff alerts               | Everything lands in the inbox; daily 08:00 digest email; urgent items (payment webhook failure, rejection spike, customer-marked urgent, security event) also go to a Slack/Discord webhook.                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 063 |
| 5   | Dormant accounts           | Free tier only. No portal login **and** no device sync for 90 d → dormant. Emails at d90 / d150 (with "descarga tus datos"). d180 → full export (Excel + JSON) to a private bucket, rows deleted from Postgres. Archive kept **6 y** (covers CFF art. 30's 5 years counted from the _annual return_, not from inactivity) then purged; held under LFPDPPP 2025 _bloqueo_. "Restaurar mis datos" re-imports. Paying tenants are never dormant. Amends Q9.                                                                                                                                                                                            | 064 |
| 6   | Limit metrics              | Two: **transactions / month** (venta tickets + gastos + manual inventory movements — see OQ-5) and **active catalog products**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 065 |
| 7   | Limit values               | xangarrito **300 tx / 50 products** · xangarro **10 000 / 1 000** · xangarrote **30 000 / 5 000**. Operators/devices unchanged (1/2/5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 065 |
| 8   | Overage                    | **Never block a transaction on any tier.** Warnings at 80 % and 100 % (app + portal banner, owner email). Provider alert (admin inbox) at 100 % and 150 %. Two consecutive months over → "sugerir upgrade" inbox task. Free tier: the **product** cap is hard (51st product refused in the portal). Replaces "block the 51st record".                                                                                                                                                                                                                                                                                                               | 065 |
| 9   | Usage counting             | Server-authoritative: computed on each push + a nightly job, sent down with the entitlement. The phone only estimates between syncs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 065 |
| 10  | DB scaling                 | Metric triggers reviewed monthly on the admin capacity card. **S1** now. **S2** when DB > 25 GB, or any table > 50 M rows, or sync p95 > 800 ms: monthly partitioning of transactional tables, read replica for portal reports/Asesor, bigger compute. **S3** when DB > 500 GB or > 10 000 active tenants: analytics read model, evaluate Citus / tenant sharding.                                                                                                                                                                                                                                                                                  | 068 |
| 11  | Subscription billing       | Stripe Billing (B-10 stands). **Monthly + annual** (annual = 10× monthly: $1 990 / $3 990). **Prices are plus IVA** (customer pays $230.84 / $462.84 monthly, $2 308.40 / $4 628.40 annual). **Card** (credit/debit) via Checkout on both intervals; **SPEI** (per-customer CLABE, `send_invoice`) as an option on **annual only**; **no OXXO** (Stripe doesn't support it for subscriptions/invoices, and OXXO prohibits MCC 6538 Software). **14-day trial on both paid tiers, no card up front** (`payment_method_collection=if_required`). Supersedes Z-10.                                                                                     | 067 |
| 12  | Merchant card payments     | **Both** dynamic QR / payment link **and** physical terminal. `PaymentProvider` port; **Mercado Pago first** (OAuth, sandbox, signed webhooks, Point Smart 1/2 via Orders API, dynamic QR), **Clip right after** in the same epic (merchant-pasted API keys, PinPad API on Total 3 / Ultra / PinPad / Stand 2 with per-device Clip install, payment links, unsigned webhooks → verify via API). Clip partnership conversation starts now. Capability `cobrosIntegrados` on xangarro + xangarrote, **no Xangarro fee**. Server holds provider tokens and the intent; **the device still writes the venta**. Post-launch, after the external pentest. | 066 |
| 13  | WhatsApp                   | No API, no unofficial automation. One "Enviar comprobante" button: **Android + known number** → targeted intent (`jid`) opens that chat with the **image** attached, auto-fallback to the share sheet; **iOS or no number** → share sheet with the image (merchant picks the chat — iOS never allows a preset recipient for images); secondary "Enviar como texto" → `wa.me/<número>` text receipt. "Ligar WhatsApp" = store the business number and print it on the receipt.                                                                                                                                                                       | —   |
| 14  | Receipts / branding        | Portal: logo upload (Supabase Storage), brand colour auto-extracted + editable, 4 designed templates with live preview, leyenda / dirección / WhatsApp / redes. Logo also in the portal shell and the monthly PDF. AI logo generation post-launch behind the ADR-059 gate.                                                                                                                                                                                                                                                                                                                                                                          | —   |
| 15  | Settings                   | Every business setting reaches **portal parity before A-01** removes it from the app.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | —   |
| 16  | Onboarding                 | **Signup → "Platícanos de ti" wizard (8 skippable steps) → "Tu plan ideal" → trial checkout or stay free.** Answers configure the tenant. The "¿Cómo empiezo?" checklist tracks the doing. Re-runnable from Configuración with a "esto cambiará" diff. Replaces P-04's steps; reorders P-03.                                                                                                                                                                                                                                                                                                                                                        | 067 |
| 17  | Import                     | Self-service: Productos (+ stock inicial), Clientes, Saldos iniciales. .xlsx / .csv, dry-run, one transaction, ≤ 5 000 rows. **No historical ventas/gastos** (ADR-058 §2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —   |
| 18  | "Lo hacemos por ti"        | Request form → admin inbox, SLA 3 business days, staff import on the tenant's behalf (audited, tenant approves the preview). Files auto-deleted 30 d after completion. Free (one migration) on paid tiers.                                                                                                                                                                                                                                                                                                                                                                                                                                          | —   |
| 19  | Offline — app              | Keep the A-07 pill; add **conditional** banners: amber (offline + pending), red (rejected → A-08), grey (> 72 h unsynced).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | —   |
| 20  | Offline — "own DB"         | ~~No web capture~~ — **superseded by ADR-071 (Track O, same day):** a linked browser is a capture _device_ (own outbox, `/sync/push`, «sin conexión se sigue cobrando»); the phone keeps its SQLite. The portal's Director surface stays online-only.                                                                                                                                                                                                                                                                                                                                                                                               | 071 |
| 21  | Audits                     | Three internal audits (security, DB, performance) are launch blockers. External pentest before `cobrosIntegrados` goes live, then yearly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | —   |
| 22  | E2E                        | Deterministic full-stack suite gates CI. A GLM agent explores staging nightly with synthetic data, files bugs to the inbox, never gates.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | —   |
| 23  | Beta                       | Closed, 10–20 businesses, 4 weeks, production with a Beta badge, free xangarrote then 50 % off 3 months, exit criteria in N-30.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —   |
| 24  | App phase 2                | The phone app **adopts the Track O operator design** (same screens and tokens, 375 px layout); native-only extras (scanner, WhatsApp image, notifications, camera pairing) are design amendments upstream. Free store app, no in-app purchase (row 25). **QR pairing** with typed-code fallback.                                                                                                                                                                                                                                                                                                                                                    | 071 |
| 25  | Store compliance           | The app is a **business-employee sign-in** tool (App Store 3.1.3(c) framing; Play "consumption-only"). Pairing is "Vincular este dispositivo a tu negocio" — a sign-in, never a "license key" (3.1.1). **Zero upsell in the app:** no plan names, prices, "mejora tu plan" or links to the portal; usage warnings on the phone are neutral and say the owner will be notified. All selling happens in the portal and email. Demo account for review (X-05).                                                                                                                                                                                         | 069 |
| 26  | CFDI for our subscriptions | **Every payment gets a CFDI** — individual when the customer gave fiscal data, otherwise in the monthly **global "público en general"** CFDI. **Automation is built and wired but switched by `CFDI_MODE = off \| test \| live`**: production starts `off` and the owner issues CFDIs **manually in the SAT portal** for the first customers, driven by an admin "pagos sin CFDI" list; staging runs `test` (Facturapi test keys, never reach SAT). `live` when manual work reaches ~10–15 CFDIs/month or the contador signs off. Supersedes Q15/Z-03.                                                                                              | 070 |

---

## 2. Launch blockers

### Billing

### N-01 Stripe: annual prices + trial on both paid tiers `[LAUNCH]`

- [~] Status · **Blocked by:** B-10, C-12 · **Blocks:** N-13, N-31
- **What:** second Stripe Price per paid plan. Lookup keys `plan_xangarro_monthly`,
  `plan_xangarro_annual`, `plan_xangarrote_monthly`, `plan_xangarrote_annual`. `trial_period_days: 14`
  on both tiers (B-10 had it on the top tier only), **no payment method collected at trial start**
  (`payment_method_collection: 'if_required'`); on day 11 and day 14 the owner is emailed to add a card
  or pay the annual by SPEI. **Payment methods:** card on both intervals via Checkout; **SPEI on annual
  only**, as an API-created subscription with `collection_method: 'send_invoice'` and
  `customer_balance` (Stripe issues a per-customer CLABE and auto-reconciles; not available in Checkout
  or the Customer Portal, so the Suscripción screen offers "Pagar por transferencia" itself).
  **No OXXO** — unsupported for subscriptions/invoices and MCC 6538 (Software) is on OXXO's prohibited
  list.
- **IVA:** prices are **plus 16 % IVA** — Stripe prices with `tax_behavior: 'exclusive'` and a 16 %
  IVA tax rate applied on Checkout and on SPEI invoices; totals in centavos: 23 084 / 46 284 monthly,
  230 840 / 462 840 annual. Every price display (portal, emails, landing) says "+ IVA" next to the
  amount and shows the total at checkout. The CFDI subtotal is the list price; IVA is its 16 %.
- **How:** extend B-10's price seeding script; Checkout session takes `interval`; the Suscripción
  screen (P-10) shows the current interval and "Cambiar a anual — 2 meses gratis" through the
  Customer Portal (proration is Stripe's).
- **Acceptance:** test-mode Checkout for all four prices; a no-card trial that converts by card and one
  that converts by SPEI (test-mode bank transfer); trial end without payment falls to xangarrito;
  Z-10 marked superseded.
- Progress: 2026-09-18 · 4a7df64…2528ca2 (branch `track-n/b10-stripe`, merged to main 302c95d 2026-09-18, also delivers **B-10**) · stripe
  22.6.2; four `plan_` prices with a flat **exclusive 16 % IVA tax rate** (not Stripe Tax: exact
  centavo totals, same on Checkout and SPEI invoices, no address prompt, no per-transaction fee);
  card-less 14-day trial on both tiers; SPEI annual via `send_invoice`; no OXXO; tables
  `billing_customers` / `subscriptions` / `stripe_events` (`0003_billing` + `0007_billing_grants.sql`,
  written only by `xangarro_billing`); idempotent signed webhook; state machine (trial counts from its
  end; a missed payment counts from the start of the unpaid period). `PLAN_FIXTURE` removed: activation,
  pull, `GET /entitlement`, session, operator limit and Funciones read the real subscription (no row →
  free plan). **Still to do:** a live test-mode run by the owner (env keys, Customer Portal config,
  `stripe:seed`, `stripe listen`), day-11/14 trial emails (B-14), P-10 buttons.

### Plan limits and usage

### N-02 Server usage metering `[LAUNCH]`

- [~] Status · **Blocked by:** C-12, B-08 · **Blocks:** N-03, N-04, N-07
- **What:** a portal-only `usage_counters (business_id, period 'YYYY-MM', transactions, products,
computed_at)` table (ADR-060 portal-only entity checklist).
- **How:** `/sync/push` increments `transactions` by accepted UP rows in the counted tables; a nightly
  Vercel Cron recomputes from source (drift-proof) and counts active products. `/sync/pull` and
  `/entitlement` carry `usage` (C-12). Counting happens in `packages/application` so the portal and
  cron share one use case.
- **Acceptance:** 1 happy + 3 unhappy use-case tests; nightly recompute corrects an injected drift;
  pull payload validates against the contract.
- Progress: 2026-09-17 · e7741c6 (branch `track-n/n02-usage-engine`, merged to main 2f04868 2026-09-18) · pure core in
  `@xangarro/domain/usage`: `countsTowardUsage` (OQ-5), `usagePeriod` (America/Mexico_City),
  `computeUsage`; limits accepted as `UsageLimits` until C-12. Rules settled while building: **every
  manual movement counts** (incl. muestra / uso en producción / otro), sale-generated and
  cancellation movements don't; a cancelled/soft-deleted counted row stays counted; rows are
  attributed to the month of their **capture date** (device `createdAt`, MX time) and the nightly
  recompute absorbs late pushes; active products are counted as of now. **Still to do:**
  `usage_counters` + use case in data-pg/application, push hook, nightly cron; `origen` column on
  inventory movements (C-12 step 7) to replace the motivo/nota heuristic.

### N-03 Overage warnings and provider alerts `[LAUNCH]`

- [~] Status · **Blocked by:** N-02, N-08, B-14 · **Blocks:** N-30
- **What:** thresholds 80 % / 100 % per metric → owner email (once per threshold per month), portal
  banner, app banner (from the pulled `usage`). **App copy is neutral** (ADR-069): "Este negocio está
  cerca de su límite mensual. Avisamos al dueño." — no plan names, prices or upgrade prompts on the
  phone; the upsell lives in the portal banner and the email. 100 % and 150 % → admin inbox item `kind=limite`.
  Two consecutive months ≥ 100 % → inbox item "sugerir upgrade".
- **How:** threshold crossing detected by the N-02 use case, idempotent per `(business, period,
metric, threshold)`. Copy: never punitive ("Tu negocio está creciendo 🎉").
- **Acceptance:** crossing each threshold fires exactly once; a paid tenant at 150 % still syncs
  every row (contract test).
- Progress: 2026-09-17 · a80a4ef (branch `track-n/n02-usage-engine`, merged to main 2f04868 2026-09-18) · `crossedThresholds` (80 → owner,
  100 → owner + provider, 150 → provider; idempotency key `business:period:metric:threshold`),
  `consecutiveMonthsOver`, `canCreateProduct` (free tier from `FALLBACK_PLAN`, typed result with
  `excess` for the import dry-run), neutral phone codes `USAGE_NEAR_LIMIT` / `USAGE_AT_LIMIT`. 53 tests.
  **Still to do:** emails (B-14), inbox items (N-08 ingestion), portal and app banners.

### N-04 Free-tier product cap `[LAUNCH]`

- [ ] Status · **Blocked by:** N-02, P-07 · **Blocks:** N-30
- **What:** xangarrito cannot create the 51st **active** product.
- **How:** enforced in the portal (create, import dry-run shows "excede tu plan por N") and in the
  app's quick-add using the last-known count (app copy: "Este negocio alcanzó su máximo de productos.
  El dueño puede administrarlo desde el portal." — no plan or upgrade wording, ADR-069). **The server still accepts** a product that arrives over
  the cap from an offline phone (rows are never dropped, ADR-053 Q4) and raises a `limite` inbox item.
  Archiving a product frees a slot. Replaces the A-10 "block the 51st record" behaviour.
- **Acceptance:** portal refuses #51 with the upsell; app quick-add refuses when known; offline
  overflow is accepted and flagged.

### Admin console

### N-05 `apps/admin` scaffold + staff auth `[LAUNCH]`

- [~] Status · **Blocked by:** B-01, P-22 · **Blocks:** N-06 … N-10, N-46 … N-48
- **What:** Next.js App Router app at `admin.xangarro.mx`, its own Vercel project, reusing
  `@xangarro/tokens`, `data-pg`, `contracts`, `application`.
- **How:** Supabase Auth with a `staff_members` allowlist; **TOTP 2FA mandatory** (AAL2 required by
  middleware); every mutating action writes `staff_audit_log (staff_id, action, business_id, payload,
at)`; `robots: noindex`; strict CSP. The service-role key is an env var of this project only — a CI
  check fails if `SUPABASE_SERVICE_ROLE_KEY` is referenced under `apps/portal`.
- **Acceptance:** non-allowlisted user → 403; allowlisted without 2FA → forced enrolment; audit row
  per mutation; CI guard green.
- Progress: 2026-09-17 · d6e83d7…6119ef0 (branch `worktree-agent-a9df007511aecbb56`, merged to main 907a08f, in-house auth `track-n/n05-inhouse-auth` 4d524f4 2026-09-18) ·
  `apps/admin` (Next 16, :3200): Supabase Auth + `staff_members` allowlist + mandatory TOTP/AAL2 via
  `proxy.ts` + `resolveGate` (re-checked in layout and every action); `auditedMutation` →
  `recordStaffAction` in one tx; nonce CSP; noindex ×3; service-role guard in admin `lint`. 31 tests.
  **Still to do:** Playwright against a real Supabase (403, forced MFA, audit row); move staff SQL from
  `apps/admin/src/server/db/` into `data-pg` + `db-local.sh`; provision the `xangarro_admin` role.

### N-06 Tenants, licences and Stripe `[LAUNCH]`

- [~] Status · **Blocked by:** N-05, B-10, B-06 · **Blocks:** N-30
- **What:** tenant list (plan, Stripe status active/trialing/past_due/lapsed, next charge, interval,
  devices, last sync, last login) and detail with a link to the Stripe customer.
- **How:** Stripe stays the source of truth (webhooks). Overrides, each audited and each with an
  expiry: **extend trial**, **comp plan** (e.g. beta testers, N-30), **re-issue entitlement**
  (forces a fresh signed token on the next pull).
- **Acceptance:** an override changes the next pulled entitlement; expiry reverts it; audit row.
- Progress: 2026-09-17 · cb03934…7aec8da (branch `track-n/n06-admin-tenants`, merged to main 907a08f 2026-09-18, on top of N-08)
  · tenant list (keyset pagination, search by name/owner email/id, "sin sincronizar > 7 días" from
  `devices.last_push_at`/`last_pull_at`) and detail (members, devices, inbox link); append-only,
  audited, expiring `PlanOverride` (extend_trial / comp_plan / reissue_entitlement) +
  `effectivePlan` (13 tests); read-only cross-tenant SQL for `xangarro_admin`, verified on a
  throwaway PG17. Billing fields come from a `BillingStatusSource` stub ("Sin datos") until B-10. No
  RFC column exists yet on main, so no RFC search. **Still to do:** B-10 adapter; B-06's
  `computeEntitlement` (`compute-entitlement.ts:83-99`) must consume `effectivePlan` (comp before the
  free fallback, trial extension on `currentPeriodEnd`, reissue invalidates older cached tokens) —
  a Track B change; last-login grant; Playwright.

### N-07 Usage, limits and capacity `[LAUNCH]`

- [~] Status · **Blocked by:** N-05, N-02 · **Blocks:** N-51
- **What:** per-tenant usage vs limits with an "over limit" filter; a **capacity card** — DB size,
  largest tables by rows, sync p95 (B-18) — each against its N-51 / N-52 trigger, reviewed monthly.
- **Acceptance:** the capacity card goes amber at 80 % of a trigger and red at the trigger.
- Progress: 2026-09-17 · 46f8a75…(renumber) (branch `track-n/n07-usage-capacity`, N-06 + N-02 merged in; merged to main 907a08f 2026-09-18) · `admin_tenant_usage()` read-only SQL (`0006_admin_usage_read.sql`, counts OQ-5 rules;
  0 mismatches vs `computeUsage` over 15 tenant-months on a throwaway PG17, 200 tenants / 600k rows:
  ~120 ms all tenants, ~43 ms with `(business_id, created_at)` indexes); `/uso` (80/100/150 bands,
  "sobre el límite", "2 meses seguidos", keyset); capacity card with ADR-068 triggers (`capacityStatus`,
  amber 80 %, red at trigger; p95 "sin datos" until B-18). **Still to do:** switch to `usage_counters`
  (N-02) and C-12 limits; count tickets once the ADR-073 table is on main; movement origin via
  `origen` (C-12 step 7) instead of the motivo/nota heuristic; the indexes (DB-IDX-01, Track B).
- 2026-09-18 · sync p95 stays "sin datos": B-18 logs per-call timing to stdout only. Needs a queryable
  per-call timing table (endpoint, duration, at) from Track B — see
  `apps/admin/docs/b18-b16-integration.md`. Noted overlap: the "last seen" rule exists in three
  places (B-16 Studio query, two N-06 files) — consolidate when data-pg gains a shared query.

### N-08 Inbox (support and escalations) `[LAUNCH]`

- [~] Status · **Blocked by:** N-05 · **Blocks:** N-03, N-10, N-18, N-49
- **What:** portal-only `support_items (kind ∈ bug | factura | migracion | escalacion | limite |
explorador | sistema, status ∈ nuevo | en_curso | resuelto, urgent, owner_staff_id, business_id,
body, attachments)`.
- **Sources:** the existing `bug-report` function, a new portal **"Ayuda"** form (with "Es urgente"),
  the app's "Reportar problema", "Solicitar factura" (P-10), "Hazlo por mí" (N-18), N-03 alerts, the
  GLM explorer (N-49).
- **Acceptance:** each source creates an item; assignment and status changes are audited.
- Progress: 2026-09-17 · 7fd151d…b554e02 (branch `track-n/n08-admin-inbox`, merged to main 907a08f 2026-09-18, on top of N-05) ·
  `SupportItem` (factura needs a CFDI UUID to resolve), `support_items` (no DELETE grant),
  create/assign/status/list use cases with tests, inbox list + detail with «Pagos sin CFDI», audited
  mutations, `POST /api/internal/support-items` (shared secret). 96 admin tests. **Still to do:** wire
  each source (bug-report, Ayuda, P-10, N-18, N-03, Stripe → factura), move tables to `data-pg`, real
  DB test for the Postgres adapter.

### N-09 Platform flags and kill switches `[LAUNCH]`

- [~] Status · **Blocked by:** N-05, A-14 · **Blocks:** N-30
- **What:** UI over the **platform-availability** level of the three-level flags (ADR-053): global
  on/off per feature, plus a beta allowlist of tenants. Kill switches for the Asesor LLM, receipts
  share, card collection (once built).
- **Acceptance:** flipping a flag reaches a device on its next pull; audited.
- **Decision (2026-09-17):** platform availability moves from the `PLATFORM_AVAILABLE` constant to an
  admin-editable table; a key with no row uses the code default; devices still receive flags only
  through the signed entitlement (no contract change); the ADR-059 LLM gate becomes the `asesorLlm`
  kill switch.
- Progress: 2026-09-17 · 45acd01…7784fe7 (branch `track-n/n09-platform-flags`, merged to main 907a08f 2026-09-18, on top of N-06)
  · `PlatformFlag` + `isPlatformAvailable` / `resolvePlatformFlags` (domain, TDD); `0005_platform_flags.sql`
  — append-only `platform_flag_events`, latest-state view, narrow portal view (no reason/author,
  allowlist cut to the caller's business); `/flags` with allowlist, "afecta a N negocios"
  confirmation, history; integration note `apps/admin/docs/platform-flags-integration.md`.
  **Still to do (Track B/A):** `computeEntitlement` (`compute-entitlement.ts:68,83`) and
  `entitlementFor` (`bootstrap.ts:71`) read the portal view; the app must take platform availability
  from `entitlement.features`, not the compiled constant (A-10/A-14); a C- task so `comprobanteShare`
  and `cobrosIntegrados` can reach devices.

### N-10 Staff alerts `[LAUNCH]`

- [~] Status · **Blocked by:** N-08, B-14, B-18
- **What:** daily 08:00 (America/Mexico_City) digest to `soporte@xangarro.mx` — new inbox items, over
  limit tenants, dormancy candidates, B-18 rejection summary. Urgent items also POST to a Slack/Discord
  incoming webhook (URL in env).
- **Acceptance:** digest renders with zero and with many items; urgent items arrive within 1 minute.
- Progress: 2026-09-17 · ad53bdc, 16ed374 (branch `track-n/n08-admin-inbox`, merged to main 907a08f 2026-09-18) · `buildDailyDigest`,
  `GET /api/cron/digest` (CRON_SECRET, Vercel Cron `0 14 * * *` = 08:00 CDMX), Slack/Discord urgent
  webhook. **Still to do:** real email adapter (B-14; stub logs only), over-limit (N-07), dormancy and
  B-18 sections.
- Progress: 2026-09-18 · 94aee74 (branch `track-n/n10-b18-integration`, merged to main 907a08f 2026-09-18: N-07 + N-09 + main merged) ·
  digest section "Rechazos de sincronización (24 h)" reuses B-18's `rejectionDigest` from data-pg
  unchanged; admin migration 0007 grants the admin role four columns of `sync_rejections`
  (payload/message stay unreadable). Degrades to "No disponible". **Still to do:** B-14 mailer.

### Settings and onboarding

### N-11 Portal settings parity `[LAUNCH]`

- [ ] Status · **Blocked by:** P-08, P-15, C-15 · **Blocks:** A-01, N-12
- **What:** every business setting editable in the portal before the app loses it:
  régimen + **ISR rates with the confirm dialog**; **tipos de pago** switches; atributos de producto;
  **contacto y comprobantes** (new `businesses` columns, C-15); preferencias; **Funciones switches
  write** (P-15 is read-only today); RFC validation.
- **How:** reuse the application use cases through Postgres repositories (ADR-062); DOWN writes go
  through `sync_log`.
- **Acceptance:** a checklist of every mobile Settings entry (`packages/ui/src/screens/Settings/*`),
  each mapped to "portal", "device (A-12)" or "dropped (why)"; each portal item has a Playwright spec.

### N-12 "Platícanos de ti" wizard `[LAUNCH]`

- [~] Status · **Blocked by:** N-11, N-19 · **Blocks:** N-13, N-15
- **What:** replaces P-04's steps. "Paso N de 8", one question per step, icon + description cards
  (CLAUDE.md §6), every step skippable:
  1. nombre + tipo de negocio · 2. ¿cómo cobras? (Efectivo / Tarjeta / Transferencia / QR / Crédito)
     · 3. ¿manejas inventario? · 4. ¿manejas caja de efectivo? · 5. ¿vendes a crédito? · 6. WhatsApp +
     logo · 7. datos fiscales · 8. ¿cuántas personas cobran?
- **How:** a pure domain function `answersToConfiguration(answers) → { toggles, paymentTypes,
suggestedPlan, reasons[] }` (TDD) — the wizard UI only renders and submits. Answers stored in
  `businesses.onboarding` JSONB alongside the checklist.
- **Acceptance:** domain tests cover every answer combination that changes the suggested plan.
- Progress: 2026-09-17 · 535ceaa (branch `worktree-agent-ae32577e7f3c1c8b5`, merged to main 0546038 2026-09-18) · domain core:
  `WizardAnswersSchema`, `answersToConfiguration` / `diffConfiguration` / `applyConfiguration` in
  `@xangarro/domain/onboarding`; plan = cheapest `PLAN_IDS` entry whose `PLAN_LIMITS` satisfy
  stock / ventasCredito / operators; paid-only answers returned as pending; 102 tests incl. a 72-case
  plan table. **Still to do:** portal wizard UI, persistence in `businesses.onboarding`.
- Progress: 2026-09-18 · b063d4b (branch `track-n/n13-signup-wizard`, merged to main 360678a 2026-09-18; also delivers P-03/P-04)
  · 8-step wizard at `/bienvenida`, saved per step to a **portal-only `business_onboarding` table**
  (migration `0003_business_onboarding`; deviation from `businesses.onboarding` — keeps it off the
  DOWN wire), contradictory answers prevented in the UI; Playwright happy path green. Answers with no
  write path yet: tipoNegocio (no field), WhatsApp (C-15), logo (N-19); crédito stays off (platform).

### N-13 Plan recommendation + signup reorder `[LAUNCH]`

- [~] Status · **Blocked by:** N-12, N-01 · **Blocks:** N-30, L-03
- **What:** signup (`?plan=` preselects) → wizard → **"Tu plan ideal: Xangarro — porque manejas
  inventario y vendes a crédito"** → [Probar 14 días] (Checkout) or [Seguir gratis].
- **How:** paid-only answers show an "Incluido en Xangarro" badge; if the tenant stays free they are
  stored as **pending** and applied automatically by the subscription webhook on upgrade.
- **Acceptance:** free path never touches Stripe; upgrade applies pending answers exactly once.
- Progress: 2026-09-18 · 8d430e6, ad8c3c0 (branch `track-n/n13-signup-wizard`, merged to main 360678a 2026-09-18) · `/signup` (ADR-080: in-house
  bcrypt cost 10 + `startSession`, throttled per email + IP) → wizard → "Tu plan ideal" with reasons,
  prices + IVA, pending paid answers stored. **Still to do:** B-10 replaces the stub
  `startTrialCheckout()` (`server/onboarding/checkout.ts`); the webhook applies pending answers.

### N-14 "¿Cómo empiezo?" checklist update `[LAUNCH]`

- [~] Status · **Blocked by:** N-12
- **What:** P-04's checklist keeps its items (operator, products/import, code, device activated,
  first sale synced) and adds "Sube tu logo". "Conecta Mercado Pago / Clip" appears only when
  `cobrosIntegrados` is platform-available (N-44).
- Progress: 2026-09-18 · b063d4b (merged to main 360678a 2026-09-18) · `/como-empiezo` checklist detected from data; MP/Clip item waits on N-44.

### N-15 Re-run the wizard `[LAUNCH]`

- [~] Status · **Blocked by:** N-12
- **What:** Configuración → "Volver a configurar mi negocio": pre-filled with current values; before
  applying, a summary "esto cambiará" (e.g. "Se desactivará Inventario — tus productos no se
  borran").
- **Acceptance:** applying with no changes is a no-op; every change is listed.
- Progress: 2026-09-18 · b063d4b (merged to main 360678a 2026-09-18) · `/bienvenida/revisar` with the "esto cambiará" summary; no change → no
  write. **Still to do:** a "Volver a configurar mi negocio" link on the Negocio screen (portal session);
  until then it lives on the checklist page.

### Import

### N-16 Import engine + Clientes template `[LAUNCH]`

- [ ] Status · **Blocked by:** P-07 · **Blocks:** N-17, N-18
- **Note (ADR-081, 2026-09-18):** portal-created products start at zero stock, the import template has no
  `stock_inicial` column, and **the import writes no movements**. Opening stock is N-17's job.
- **What:** generalise P-07's three steps (template → dry-run with row-level errors → one-transaction
  commit, ≤ 5 000 rows, .xlsx and .csv) into a template registry; add **Clientes** (nombre, teléfono,
  RFC optional).
- **Acceptance:** per template: a malformed-row test, a >5 000 test, a duplicate test, a happy path.

### N-17 Saldos iniciales template `[LAUNCH]`

- [ ] Status · **Blocked by:** N-16, C-20
- **Inventario inicial (owner decision 2026-09-18):** an explicit one-time step, "Captura tu inventario
  inicial" (grid or Excel: producto + cantidad + costo), writing portal inventory movements with
  `origen = apertura` (C-12 step 7). They are **not** counted toward the monthly limit, they feed the
  opening inventory valuation, and the step closes with the first period close. Products and the
  product import stay stock-free (ADR-081).
- **What:** opening balances so the Balance (NIF B-6) is right on day 1: caja, bancos, cuentas por
  cobrar per cliente, inventory valuation (from stock inicial × costo).
- **Acceptance:** after import, the portal Balance equals the imported figures; statements tests.

### N-18 "Hazlo por mí" migration service `[LAUNCH]`

- [ ] Status · **Blocked by:** N-08, N-16
- **What:** a card on the import screen → form (sistema actual, qué datos, archivos o respaldo) →
  inbox item `kind=migracion`, SLA 3 business days. Free (one migration) on xangarro / xangarrote;
  xangarrito sees "disponible en planes de pago".
- **How:** staff map the data to the N-16 templates and run the import **on behalf of** the tenant
  from `apps/admin` (audited); the tenant receives the dry-run preview and approves before commit.
  Uploads in a private bucket, **auto-deleted 30 days after the item is resolved** (LFPDPPP).
- **Acceptance:** commit is impossible without tenant approval; the purge job deletes files and logs.

### Receipts and WhatsApp

### N-19 Logo + brand colour `[LAUNCH]`

- [ ] Status · **Blocked by:** C-15 · **Blocks:** N-12, N-20
- **What:** upload PNG/JPG/SVG ≤ 2 MB to a Supabase Storage bucket (RLS by `business_id`; SVG
  sanitised); `businesses.logo_url` (exists, always null today) set; brand colour auto-extracted
  (dominant non-neutral colour) and editable. Logo shown in the portal sidebar/header, on receipts and
  on the monthly PDF.
- **How:** the device downloads the logo once per change and caches it for offline receipts.
- **Acceptance:** malicious SVG is neutralised (test); the app renders the logo offline.

### N-20 Receipt templates `[LAUNCH]`

- [ ] Status · **Blocked by:** N-19, app design (N-24)
- **What:** four designed templates — Clásico, Moderno, Ticket, Minimal — in
  `packages/domain/src/comprobante/` (one renderer, used by the portal live preview and the app).
  Fields: logo, colour, leyenda, dirección, WhatsApp, redes. PNG and PDF.
- **Acceptance:** snapshot tests per template; totals stay legible with any brand colour (contrast
  check picks the text colour).

### N-21 WhatsApp share `[LAUNCH]`

- [ ] Status · **Blocked by:** N-20
- **What:** "Enviar comprobante" after a sale. Customer phone optional, remembered per cliente.
  Wires the existing, unused `shareComprobanteAsImage` path.
- **How (verified 2026-09-17, §6):** `wa.me` / `whatsapp://send` carry **text only**.
  - **Android + known number:** `ACTION_SEND` with package `com.whatsapp` and extra
    `jid=<52…>@s.whatsapp.net` opens that chat with the image attached (what `react-native-share`'s
    `whatsAppNumber` does). **Undocumented by WhatsApp** — wrap it, detect failure, and fall back to
    the system share sheet automatically.
  - **iOS, or no number:** system share sheet with the image; WhatsApp shows its own chat picker (iOS
    never accepts a preset recipient for images).
  - **Secondary action** "Enviar como texto" (shown when a number is known): `wa.me/<52…>?text=` with
    the text receipt.
  - Never automate sending; the merchant always taps Send.
- **Acceptance:** Maestro flow on both platforms up to the WhatsApp hand-off; unit test for the
  Android fallback path.

### Offline

### N-22 App sync banners `[LAUNCH]`

- [ ] Status · **Blocked by:** A-06, A-07, N-24 · **Blocks:** N-29
- **What:** on top of the A-07 pill, conditional full-width banners:
  - amber — offline **and** pending > 0: "Trabajando sin conexión · 12 registros se enviarán al
    reconectar";
  - red — rejected > 0: "3 registros no se pudieron enviar · Revisar" → A-08;
  - grey — last successful sync > 72 h: "Sin sincronizar desde hace 3 días" (warns well before the
    30-day entitlement staleness).
    Tap → sync details + "Actualizar".
- **Acceptance:** Maestro flows for each banner (airplane mode, mock `flaky`, clock-advanced mock).

### N-23 Portal offline page `[LAUNCH]`

> **Note (ADR-071):** the offline page applies to the Director surface only; the operator register
> (Track O) has its own offline outbox and must never be replaced by this page.

- [ ] Status · **Blocked by:** P-24
- **What:** a minimal service worker that serves a branded "Sin conexión — tus ventas siguen
  guardándose en tus dispositivos" page when navigation fails. No data caching, no writes.

### App phase 2

### N-24 Phone app adopts the Track O operator design `[LAUNCH]`

> **Re-scoped 2026-09-17 (owner decision):** A-01…A-18 are already built on the unmerged branch
> `rename/xangarro-stored-ids`, and Track O (`10-operador.md`, ADR-071) already carries a finished
> operator design with 375 px layouts. No separate phone design pass: the phone reuses that design.

- [ ] Status · **Blocked by:** merge of `rename/xangarro-stored-ids`; each Track O screen closed
      (O-xx) before its phone counterpart starts · **Blocks:** N-20, N-22, N-25
- **What:** the native app's capture screens (activation, operator NIP, register/ventas, ticket,
  caja/turno, gastos, productos + quick-add, corte/cierre, sync pill + banners, receipt share,
  device Configuración) are rebuilt to match the Track O design and `@xangarro/tokens`, so an
  operator sees the same register on the phone and in the browser.
- **How:** `design-reference/operador/` is the spec at its 375 px width. Native-only surfaces not in
  the handoff — barcode scanner, WhatsApp image share (N-21), stock-low notification (A-13), camera
  activation (N-25) — are added upstream in the Claude Design project first as small amendments
  (ADR-058 governance: conflicts stop and ask). Screens stay presentational; one screen per task,
  compared side by side with the design before reporting.
- **Acceptance:** each phone screen matches its Track O counterpart at 375 px; Maestro flows updated
  (CLAUDE.md §6).

### N-25 QR device pairing `[LAUNCH]`

- [ ] Status · **Blocked by:** C-14, B-11, P-06, A-04, N-24
- **What:** the portal's "Agregar dispositivo" shows a QR next to the 8-character code. The QR and a
  "Compartir por WhatsApp" button carry an **https universal / app link**
  `https://app.xangarro.mx/activar?t=<qr-token>` (a ≥ 128-bit single-use token, never the typed code — C-14,
  SEC-DEV-01) (custom schemes aren't tappable in WhatsApp; the https
  link falls back to the store listing). The app's activation screen opens on the camera; a scan
  activates with no other input. "Escribir código" (email + code) remains the fallback.
- **Store framing (ADR-069):** all copy says **"Vincular este dispositivo a tu negocio"** — a sign-in
  to the business account, never "activar", "licencia" or "desbloquear" (App Store 3.1.1 names
  unlocking via "license keys… QR codes" as a rejection reason).
- **Security:** single-use, 48 h, device visible in the portal immediately and revocable (B-12).
- **Acceptance:** Maestro flow via deep link; expired / used code errors covered.

### Quality

### N-26 Security audit `[LAUNCH]`

- [~] Status · **Blocked by:** N-05, B-17 · **Blocks:** N-30
- **Scope:** OWASP ASVS L1 on portal, API and admin; RLS test for **every** table; device, portal and
  staff token handling; Stripe webhook signature; secrets and service-role isolation (N-05 guard);
  B-17 rate limits; dependency and secret scanning in CI; LFPDPPP aviso de privacidad and ARCO flow.
- **Output:** `docs/audits/security-YYYY-MM-DD.md`, findings ranked; each critical/high becomes a task
  and blocks launch until fixed.
- Progress: 2026-09-17 · 317de29 (branch `worktree-agent-a35a775587ea084ce`, merged to main 8e737b7 2026-09-18) · first pass
  `docs/audits/security-2026-09-17.md` (static, ASVS L1; main + N-05/N-33/app branches; `pnpm audit
--prod`; git-history secret scan clean): 0 critical, 6 high, 8 medium, 11 low. Decided from it:
  QR long token + `/activate` limiter (C-14, B-17), billing role instead of service role (B-10,
  ADR-063), aviso + ARCO (N-34). Backend highs (session expiry SEC-AUTH-01, login hardening
  SEC-AUTH-02, Data API exposure SEC-DATA-01) belong to Track B. **Still to do:** pre-launch re-run
  on hosted B-01 with the built sync, register and webhooks; live rate-limit and PostgREST tests.

### N-27 Database audit `[LAUNCH]`

- [~] Status · **Blocked by:** B-03, B-08, B-09 · **Blocks:** N-30
- **Scope:** Postgres (the 2026-05 reports cover the archived SQLite desktop DB): `pg_stat_statements`
  top queries and plans, `business_id`-leading indexes, RLS predicate cost, enum CHECK constraints
  (ADR-062 follow-up), migration safety, **a PITR restore drill** with a timed runbook.
- **Output:** `docs/audits/db-YYYY-MM-DD.md`.
- Progress: 2026-09-17 · d7ae514 (branch `worktree-agent-a820b032ab0f869b4`, merged to main 106ebc1 2026-09-18) · first pass
  `docs/audits/db-2026-09-17.md` (static + EXPLAIN on a disposable PG17, 200 tenants × 3k tx): 1
  critical (pull cursor loses rows — reproduced), 7 high, 12 medium, 3 low. **Still to do:** pre-beta
  re-run on hosted Supabase with `pg_stat_statements`, and the timed PITR restore drill.

### N-28 Performance audit `[LAUNCH]`

- [ ] Status · **Blocked by:** X-01 · **Blocks:** N-30
- **Scope:** k6 load test on staging at 10× the beta's projected load (push, pull, portal reports);
  budgets: API p95 < 300 ms, portal LCP < 2.5 s on throttled 4G, sale capture < 1 s on a low-end
  Android. Replace the broken `health-report-2026-04-30.md` with this report.
- **Output:** `docs/audits/performance-YYYY-MM-DD.md` + the k6 scripts in the repo.

### N-29 Deterministic full-stack E2E gate `[LAUNCH]`

- [ ] Status · **Blocked by:** P-17, A-16, N-22, N-25 · **Blocks:** N-30, X-02
- **What:** one scenario against a real local Supabase: signup → wizard → operator → import →
  device code (QR deep link) → activate → **sell in airplane mode** → reconnect → sale visible in the
  portal → export. Maestro drives the app, Playwright the portal, a small orchestrator script
  sequences them. Runs in CI and blocks merges (the mobile half on the nightly runner until a macOS
  runner is affordable per PR).
- **Acceptance:** green in CI; a deliberately broken push handler turns it red.

### N-30 Closed beta `[LAUNCH]`

- [ ] Status · **Blocked by:** X-01, N-03, N-04, N-06, N-09, N-13, N-26, N-27, N-28, N-29
- **Who:** 10–20 businesses — prebeta partners, 2–3 each of taquería / tiendita / servicios, and
  Xangarro itself (tenant #1).
- **How:** production, "Beta" badge, comp xangarrote via N-06 (then 50 % off for 3 months), "Enviar
  comentario" → inbox, weekly 15-minute check-in, 4 weeks.
- **Exit criteria:** zero open P0/P1 · ≥ 70 % weekly active · sync rejection rate < 0.1 % · ≥ 80 % of
  beta tenants completed the checklist.

### N-31 Landing copy for this track `[LAUNCH]`

- [ ] Status · **Blocked by:** N-01, C-12 · **Blocks:** X-10
- **What:** pricing table with the new limits and annual toggle, every price marked **"+ IVA"** with the
  total on hover/footnote; "Tu negocio sigue aunque se vaya el
  internet" (decision 20); fix L-03's stale `freelancer/emprendedor/mipyme_pro` slugs (ADR-059).
  Payment-method line: "Tarjeta de crédito o débito · Transferencia SPEI en plan anual" (no OXXO).

### N-32 Store-compliance sweep `[LAUNCH]`

- [~] Status · **Blocked by:** N-24, A-15 · **Blocks:** X-05
- **What:** make the app reviewable as a business-employee tool (ADR-069).
- **How:** grep the app bundle's strings (i18n `es-mx.ts`, hard-coded text) for plan names
  (`xangarrito|xangarro plan|xangarrote`), prices, `mejora|upgrade|suscr|plan|precio|pagar` and any
  `app.xangarro.mx` link, and remove or neutralise each; a CI check (`scripts/store-compliance.ts`)
  keeps it at zero. Review notes for Apple: "Xangarro is sold to businesses on the web for use by their
  employees (3.1.3(c)); operators sign in with a code issued by their employer; no digital content is
  sold in the app." Demo account `DEMOK7M3` kept live (2.1). Play: declare no in-app purchases.
- **Acceptance:** the CI check is green; a reviewer checklist is attached to X-05.
- Progress: 2026-09-17 · 682a48a (branch `track-n/n32-store-compliance`, merged to main 331f784 2026-09-18) · `pnpm lint:store`
  (TypeScript-AST string extraction over the app bundle + `es-mx.ts`, 52 tests, one allowlist entry:
  "Suscripción" as a sale category, 3.1.3(e)). **main: 0 violations. App branch
  `rename/xangarro-stored-ids`: 20** — mostly `es-mx.ts`: `planBanner.fellBack` / `planLimit.*`
  (plan names + "Renueva/Cambia tu plan en app.xangarro.mx"), `settings.plans.*`, portal URLs in
  hints (`productos.editInPortal`, `nuevoProducto.portalHint`, `settings.portalHint`,
  `login.noOperatorsBody`, `activate.noCode`), "Activar" / "Código de activación" wording, and
  `activate.errors.noSlots`. **Still to do:** neutralise that copy on the app branch (e.g. "Pídele al
  dueño del negocio que lo haga desde su cuenta" — no URL, no plan), wire into CI after the branch
  merges, reviewer checklist for X-05.

### N-34 Aviso de privacidad + ARCO requests `[LAUNCH]`

- [~] Status · **Surfaced by:** N-26 (SEC-PRIV-01) · **Blocked by:** N-08 · **Blocks:** N-30
- **What:** LFPDPPP (DOF 2025-03-20; authority: Secretaría Anticorrupción y Buen Gobierno) compliance:
  an aviso de privacidad (integral on the landing and portal footer, simplified at signup and in the
  app's sign-in) covering purposes, transfers (Supabase, Vercel, Stripe, PAC, Sentry), the ADR-064
  dormancy archive and 6-year _bloqueo_, and ARCO rights; an ARCO request form in the portal that files
  an inbox item (`kind=arco`) with the legal clock (answer in 20 days, execute within 15 more); consent
  capture versioned per aviso version. Text reviewed by counsel.
- **Acceptance:** aviso reachable from every surface; an ARCO request creates an inbox item with its
  due dates; consent version stored per user.
- Progress: 2026-09-17 · 8fae254 (branch `track-n/n34-aviso-draft`, merged to main 0c91ff2 2026-09-18) · Spanish drafts for
  counsel in `docs/legal/aviso/`: aviso integral, three simplified avisos (signup, device linking,
  operator NIP), encargado clauses (for the merchant's own customers' data), ARCO procedure plus an
  internal annex, and a README with 16 questions for counsel and verified citations (LFPDPPP DOF
  2025-03-20 / reform 2025-11-14; Reglamento 2011; CFF art. 30).
- **Product requirements the law implies (added to this task's scope; confirm with counsel):**
  self-service "eliminar mi cuenta / negocio"; a public ARCO form for people without an account;
  separate blocked-data storage with scheduled deletion; notify the person when a cancellation is
  complete (art. 24); Configuración → Privacidad to withdraw consent; ARCO deadlines in business days
  with a holiday calendar; delete overdue-receivable data after 72 months (art. 10); pass requests from
  a merchant's customers on to the merchant (Xangarro acts as encargado); a data-processing agreement
  with each provider; a separate, unticked consent for datos patrimoniales (art. 7) pending counsel.
- **Open with counsel:** whether ADR-064's 6-year archive is _bloqueo_ (the law allows only settling
  liabilities) or a stated purpose (restore + support for the owner's CFF duty), which is how it's
  drafted; responsable vs encargado for a persona física owner's books; whether the 2013 Lineamientos
  still apply.

### N-33 CFDI automation for Xangarro's own subscriptions `[LAUNCH]`

- [~] Status · **Blocked by:** B-10, P-10, N-08 · **Blocks:** N-30
- **What:** a CFDI 4.0 for every subscription payment (ADR-070). **Launch scope:** the automation is
  wired to the Stripe webhook behind `CFDI_MODE = off | test | live` (production `off`, staging
  `test`), plus an admin **"Pagos sin CFDI"** list (N-08 inbox kind `factura`) so the owner issues
  CFDIs manually in the SAT portal — individual ones for customers with fiscal data, one monthly
  global "público en general" CFDI for the rest — and marks each payment with its folio fiscal (UUID).
  Switching to `live` needs a paid PAC plan, the owner's CSD (CertiSAT) and contador sign-off; it is
  a config change, not a code task.
- **How:** Stripe `invoice.paid` webhook → PAC API adapter (Facturapi/Facturama class, chosen in the
  task by price and SDK quality — verify current pricing then) → if the tenant has RFC/razón
  social/régimen/uso/CP: stamp an individual CFDI (PUE for card; PPD + complemento de pago for SPEI
  invoices), email PDF + XML, attach to the Suscripción screen's history; else accumulate into a
  monthly **"público en general"** global CFDI. Refund → CFDI cancellation (motivo 02/03). Idempotent
  per Stripe invoice id. PAC credentials in env; CSD in the PAC's vault.
- **Acceptance:** with `CFDI_MODE=off` a paid invoice creates a "pago sin CFDI" item and nothing
  else; marking it with a UUID clears it; with `test`, sandbox stamps for each path (individual,
  global, SPEI complemento, cancellation); duplicate webhook → one CFDI; the monthly global close
  lists every un-invoiced payment of the period.
- Progress: 2026-09-17 · ee74233…b7f68ad (branch `worktree-agent-a190a4834b0fffb88`, merged to main d533928 2026-09-18) · core:
  `PacProvider` port, use cases (issue for payment, close monthly global, cancel for refund),
  Facturapi adapter over injected `fetch` (vendor rationale in `docs/spikes/pac-vendor.md`), 71 tests
  on mocked HTTP, exported as `@xangarro/application/cfdi` (not the root barrel). **Still to do:**
  B-10 webhook + cron wiring, Postgres repository, sandbox stamps per path, egreso (partial refunds),
  and **contador sign-off** on: PUE vs PPD for SPEI paid-on-receipt, ClaveProdServ 81112106 / E48,
  forma de pago mapping, global CFDI periodicity/deadline, cancellation motivo defaults.

---

## 3. Post-launch

### Merchant card payments (ADR-066)

### N-40 Provider validation + Clip partnership + legal opinion

- [ ] Status · **Trigger:** N-30 exit criteria met. **The Clip conversation starts now** (owner action,
      not gated by the trigger).
- **Already verified from docs (2026-09-17, §6):** MP — Orders API for Point in MX (Point Smart 1/2,
  terminal in PDV mode, store + POS setup), dynamic QR, OAuth with 180-day tokens + refresh,
  `x-signature` HMAC webhooks. Clip — PinPad API (Total 3 / Ultra / PinPad / Stand 2, **not Plus**;
  Clip installs its PinPad app per device on request to sdk@payclip.com with the serial; production
  only, no sandbox; ≥ 10 Mbps Wi-Fi), payment-link API, Basic-auth API keys created by the merchant,
  **unsigned** `PINPAD_INTENT_STATUS_CHANGED` webhook.
- **What remains:** hands-on sandbox proof for MP (Point order + QR + OAuth + webhook); ask Clip for a
  partner/OAuth program, a test device, and bulk PinPad installs; **a written opinion from Mexican
  counsel** that a platform which never holds funds and takes no fee is outside Ley Fintech / Banxico
  aggregator rules. Output: `docs/spikes/payments-mercadopago.md`, `docs/spikes/payments-clip.md`.
- **Acceptance:** go / no-go per provider per mode; legal opinion filed.

### N-41 `PaymentProvider` port + Mercado Pago adapter

- [ ] Status · **Blocked by:** N-40, C-13 · **Blocks:** N-42, N-53
- **What:** port in `packages/application` (`createIntent`, `getIntent`, `cancelIntent`,
  `verifyWebhook`, `refund`, `listTerminals`), first adapter `mercadopago` (Orders API for Point and
  QR), backend only. A shared adapter contract suite that N-53 must also pass. The port must not assume
  signed webhooks (Clip's aren't): `verifyWebhook` may return "unverified — fetch to confirm".

### N-42 Payment intents backend + reconciliation

- [ ] Status · **Blocked by:** N-41, C-13
- **What:** `POST /api/v1/payments/intents` (device token; amount in centavos, mode `qr|terminal`,
  terminal id) → provider intent; `GET …/intents/:id` (polled every 2 s); provider webhooks →
  `payment_intents.status` — **a webhook is only a signal; status is always confirmed by fetching the
  payment from the provider API** (mandatory for Clip, defence in depth for MP). Nightly reconciliation matches approved intents to synced ventas by
  `payment_ref`; unmatched approved intents → portal aviso + inbox item.
- **Invariant:** the server never writes the venta (ADR-058 §2, ADR-066).

### N-43 Merchant account linking in the portal

- [ ] Status · **Blocked by:** N-41
- **What:** Configuración → Cobros. **Mercado Pago:** "Conectar" (OAuth), refresh before the 180-day
  expiry, list the account's Point terminals, switch one to PDV mode per caja, name it ("Caja 1").
  **Clip (N-53):** guided paste of an API key + secret created in dashboard.clip.mx (secret shown
  once — explain it), register terminals by serial, and a "Solicitar activación con Clip" step that
  files the PinPad-install request. Disconnect for both. Tokens encrypted at rest (Supabase Vault), never sent to
  devices. Gated by `cobrosIntegrados`.

### N-44 App "Cobrar con tarjeta"

- [ ] Status · **Blocked by:** N-42, N-43, N-45, N-24, N-53
- **What:** at checkout: [Mostrar QR] or [Cobrar en terminal: Caja 1]. Approved → the device writes
  the venta (método Tarjeta, `payment_ref`) and syncs as usual. Declined → retry / cambiar método.
  Offline → disabled with "Sin conexión: cobra en tu terminal y registra como Tarjeta". On launch,
  the app lists approved-but-unclaimed intents for this device and offers to register them.
- **Acceptance:** Maestro flows for approve, decline, timeout, phone-killed-after-approval.

### N-45 External penetration test

- [ ] Status · **Trigger:** N-42 and N-43 on staging. **Blocks:** turning `cobrosIntegrados` on in
      production. Then yearly.

### Admin — second wave

### N-46 Sync health and devices

- [ ] Status · **Trigger:** launch + 30 days, or the first cross-tenant sync incident.
- **What:** rejected rows across tenants by code; devices not seen in N days; force-revoke (B-12).
  Replaces the B-16 Studio saved queries for day-to-day use.

### N-47 Broadcast announcements

- [ ] Status · **Trigger:** the first planned maintenance window or feature launch after go-live.
- **What:** compose an aviso to all tenants or a filter (plan, tipo de negocio, beta allowlist);
  delivered through the ADR-060 `notices` table to the portal's Avisos and the app.

### N-48 Dormancy lifecycle (ADR-064)

- [ ] Status · **Trigger:** launch + 90 days (no tenant can be dormant earlier).
- **What:** nightly job marks free tenants with no login and no device sync for 90 days as dormant;
  emails at d90 and d150 with a one-click "sigo aquí"; at d180 writes the full export (reuses P-34:
  Excel + JSON) to a private, encrypted bucket, verifies it (row counts), then deletes the tenant's
  rows. Archive retained **6 years** (covers CFF art. 30's five years counted from the annual return
  for the last archived year), then purged. The d90/d150 emails and the aviso de privacidad say so and
  offer "Descarga tus datos"; the archive is held under LFPDPPP (2025) _bloqueo_ — no use other than
  restore or an authority's request. "Restaurar mis datos" on login re-imports it.
- **Acceptance:** export→delete→restore round-trip test with row-count equality; a paying tenant is
  never selected; any activity resets the clock.

### Other

### N-49 GLM exploratory tester

- [ ] Status · **Trigger:** X-01 staging live and N-29 green.
- **What:** nightly agent driven by a GLM model on staging, **synthetic data only** (third-party model
  provider), with personas ("taquero con prisa", "contador revisando el mes") and goals. Findings →
  inbox `kind=explorador` with screenshots and reproduction steps. Never a CI gate.

### N-50 AI logo generation

- [ ] Status · **Trigger:** the ADR-059 production gate on model calls is lifted.
- **What:** "Genera un logo con IA" in N-19 for businesses without one: style picker + name → 4
  options → pick → becomes the logo. Image model provider chosen at trigger time.

### N-51 DB scaling — Stage 2 (ADR-068)

- [ ] Status · **Trigger:** any of DB > 25 GB · a table > 50 M rows · sync p95 > 800 ms (N-07 card).
- **What:** monthly range partitioning of transactional tables (migration with old→new test,
  CLAUDE.md §2.9), a read replica for portal reports and the Asesor, next Supabase compute size.

### N-52 DB scaling — Stage 3 (ADR-068)

- [ ] Status · **Trigger:** DB > 500 GB or > 10 000 active tenants.
- **What:** separate analytics read model; evaluate Citus or tenant sharding (new ADR).

### N-54 Facturación for merchants (white-label PAC reseller)

- [ ] Status · **Trigger:** N-33 `live` for 3 months, and ≥ 5 customers asking to invoice their own
      clients.
- **What:** let tenants issue CFDI to _their_ customers from a venta ("Facturar esta venta") and a
  self-invoicing page for their clients. **Not** by becoming a PAC (needs a persona moral with
  MX$10 M paid-in capital, a TESOFE bond, SAT technical validation and ongoing audits — RMF 2.7.2.1 /
  Anexo 1-A); instead through a PAC reseller / white-label programme (e.g. one PAC organization per
  tenant, stamps bought in bulk and resold). Needs each tenant's CSD upload, a new ADR, and pricing
  (per-stamp packs as an add-on).

### N-53 Clip adapter

- [ ] Status · **Blocked by:** N-41, N-40 (Clip go) · **Blocks:** N-44 going public
- **What:** `clip` adapter for the N-41 port: payment links (`createnewpaymentlink` v2) and PinPad
  API terminal push; Basic auth from the merchant's keys (encrypted, Supabase Vault); webhooks treated
  as unsigned signals → fetch to confirm. Passes the shared adapter contract suite. Production-only
  testing with a real device and a low-amount charge + refund script.

---

## 4. Open questions (not decided in the interview)

- ~~OQ-1 Saldos iniciales shape~~ — **closed 2026-09-17:** a new **DOWN** entity `opening_balances`
  (header: fecha de apertura, caja, bancos; lines: saldo inicial per cliente; inventory valuation =
  stock inicial × costo), written only by the portal, synced to devices so ADR-074's single
  receivables calculator adds the cliente's opening balance as a third fact. Statements use it as the
  starting Balance. Editable until the first period closes. Contract task C-20.
- ~~OQ-2 WhatsApp on iOS~~ — **closed 2026-09-17:** verified, decided in row 13 / N-21.
- ~~OQ-3 Clip terminal API~~ — **closed 2026-09-17:** public PinPad API exists, with per-device install
  and no OAuth (row 12, N-40, N-53).
- ~~OQ-4 Mercado Pago Point in Mexico~~ — **closed 2026-09-17:** Orders API supports Point Smart 1/2
  in MX (row 12, N-40).
- **OQ-6 Apple review outcome.** ADR-069 is our most defensible reading, not a guarantee; a rejection
  would force the StoreKit option. Mitigation: submit a TestFlight external build early (X-05) to get a
  review signal before launch week.
- ~~OQ-5 Transactions definition~~ — **closed 2026-09-17:** one per **venta ticket** (ADR-073 header,
  not per line), one per **gasto**, one per **manual inventory movement** (entrada / ajuste / merma).
  Not counted: cancellations, corte de día, caja movements and turnos, abonos, operator messages,
  stock changes generated by a sale. Applies to N-02 and C-12.

---

## 5. Dependency sketch

```
C-12 limits/usage/capabilities ──► N-01, N-02, N-31
C-13 payment intents ──► N-41, N-42
C-14 QR activation ──► N-25
C-15 business branding columns ──► N-11, N-19

B-10 ──► N-01 ──► N-13 ──► N-30
N-02 ──► N-03, N-04, N-07
N-05 admin ──► N-06 … N-10, N-18, N-46 … N-48
N-11 parity ──► A-01, N-12 ──► N-13, N-14, N-15
P-07 ──► N-16 ──► N-17, N-18
N-19 ──► N-20 ──► N-21
app-branch merge + Track O screens ──► N-24 ──► N-20, N-22, N-25
N-26, N-27, N-28, N-29 ──► N-30 beta ──► X-10
N-24, A-15 ──► N-32 ──► X-05 · B-10 ──► N-33 ──► N-30
N-30 ──► N-40 ──► N-41 ──► N-42, N-43, N-53 ──► N-45 ──► N-44
```

---

## 6. Research findings (2026-09-17)

Checked against official docs on the day of the interview; re-verify anything older than 6 months
before acting on it.

| Topic                    | Finding                                                                                                                                                                                        | Source                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Stripe MX fees           | Card 3.6 % + MX$3 · OXXO 4 % + MX$3 · SPEI MX$7/transfer · Billing +0.7 % · all + IVA                                                                                                          | stripe.com/en-mx/pricing, /pricing/local-payment-methods, /billing/pricing |
| Stripe OXXO              | Not supported for Subscriptions, Invoicing or Checkout subscription mode; single-use; MX$10–10 000; MCC 6538 Software prohibited                                                               | docs.stripe.com/payments/oxxo; /payment-methods/payment-method-support     |
| Stripe SPEI              | Subscriptions/invoices via `customer_balance` with `send_invoice` only; per-customer CLABE; not in Checkout subscription mode or Customer Portal                                               | docs.stripe.com/invoicing/bank-transfer                                    |
| Stripe trial             | Checkout trial needs a card, or `payment_method_collection=if_required`                                                                                                                        | docs.stripe.com payment-method-support                                     |
| Stripe Terminal MX       | Public preview: S710 (Wi-Fi), WisePad 3, Tap to Pay iPhone/Android                                                                                                                             | support.stripe.com/questions/terminal-in-mexico                            |
| MP Point                 | Orders API in MX (2025-07); Point Smart 1/2; PDV mode; store + POS required                                                                                                                    | mercadopago.com.mx/developers …/mp-point/overview                          |
| MP QR / OAuth / webhooks | Dynamic QR endpoint (EMVCo `qr_data`); OAuth 180-day tokens + refresh, `marketplace_fee` optional; `x-signature` HMAC-SHA256                                                                   | MP MX reference; Go SDK webhook pkg                                        |
| Clip                     | PinPad API (Total 3/Ultra/PinPad/Stand 2, not Plus; per-device install via sdk@payclip.com; prod only); payment links API; merchant-created Basic-auth keys; unsigned webhook; ~3.6 % + IVA    | developer.clip.mx                                                          |
| WhatsApp                 | `wa.me`/`whatsapp://` text only; iOS image share always shows WhatsApp's picker; Android `jid` extra undocumented; Cloud API priced per template message since 2025-07 (MX utility ≈ US$0.008) | react-native-share source; developers.facebook.com pricing                 |
| CFF art. 30              | Keep contabilidad 5 years from the return's filing/due date; obligation on the taxpayer                                                                                                        | leyes-mx.com CFF 30                                                        |
| LFPDPPP                  | New law DOF 2025-03-20 (reformed 2025-11-14); INAI dissolved → Secretaría Anticorrupción y Buen Gobierno; _bloqueo_ before deletion; ARCO 20 + 15 days                                         | diputados.gob.mx LFPDPPP.pdf                                               |
| App Store                | 3.1.1 bans unlocking via license keys/QR codes; link-out exception is US storefront only; 3.1.3(c) enterprise, 3.1.3(f) free companion (no purchase CTAs); 2.1 demo account                    | developer.apple.com/app-store/review/guidelines                            |
| Google Play              | Consumption-only apps allowed with no steering; MX not in user-choice billing                                                                                                                  | support.google.com/googleplay/android-developer 10281818                   |
| CFDI                     | CFDI required per payment received; Stripe invoice has no SAT validity; "público en general" global CFDI for non-requesters                                                                    | CFF art. 29; vendor guides (confirm with contador)                         |
