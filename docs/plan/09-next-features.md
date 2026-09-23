# Track N — Next features (admin console, billing, limits, onboarding, payments, quality)

> **Console growth pass 2026-09-22:** N-63 … N-74 (§3) — rationale and triggers in
> `17-consola-crecimiento.md`, amendments in ADR-096.

> **Handoff 2026-09-18** (archived 2026-09-22 → `../archive/12-glm-handoff.md`; the open board is now `PENDIENTES.md`): pending/partial work → `12-glm-handoff.md`; owner pre-launch actions and
> trigger-gated deferred items → `11-pre-launch-and-deferred.md`.

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
| 2   | Admin console              | Separate `apps/backoffice` (Next.js, own Vercel project). Staff allowlist + mandatory 2FA. The Supabase **service role lives only here**. Supersedes Q16 and Z-09.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 063 |
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

- [x] Status · **Blocked by:** B-10, C-12 · **Blocks:** N-13, N-31
      Done: 2026-09-23 · code side complete; the live test-mode run of the Acceptance is the owner's O-12. The Suscripción screen has a Mensual / «Anual — 2 meses gratis» switch; the cards read their price from the catalogue's subtotal with «+ IVA» (`precioDePlan`, `planes-precio.test.ts`); Checkout takes the chosen interval; «Pagar por transferencia (SPEI)» calls `pagarAnualPorSpei` on annual, paid, non-current plans only; a monthly active or trialing owner gets «Cambiar a anual — 2 meses gratis», which opens the Customer Portal (proration is Stripe's). `suscripcion.spec.ts` covers the switch, the prices and the SPEI button. O-12 must save a Customer Portal configuration that allows switching between the monthly and annual prices.

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
- Progress: 2026-09-18 · branch `track-n/b14-email` · day-11/14 trial emails: daily portal cron
  `/api/cron/trial-emails` (09:00 CDMX), idempotent per (business, kind, trial-end date),
  recipient = the Stripe customer's email; no email for a business already paying.

### Plan limits and usage

### N-02 Server usage metering `[LAUNCH]`

- [x] Status · **Blocked by:** C-12, B-08 · **Blocks:** N-03, N-04, N-07
      Done: 2026-09-23 · push-time counting is a **recount, not an increment** (deviation from How): after a push with accepted rows, `/sync/push` schedules `RefreshUsageUseCase` with `after()`, which recounts only that business's open month through the same `xangarro.usage_counts()` and saves it. An increment would be a second counting rule beside the SQL one; the recount cannot drift. It is skipped when `METERING_DATABASE_URL` is unset, and a failure is reported, never returned to the phone. `refresh-usage.test.ts` (1 happy + 3 unhappy) and the drift test in `recompute-usage.test.ts` (an injected wrong counter is corrected by the nightly run) close the Acceptance; the `sync` e2e project was checked to write `usage_counters` for Taquería.
      **Remaining (2026-09-23, verified against the code):** nothing counts at push time (push route and `pg-push-store.ts` never touch usage — build it or amend How to «nightly recount is enough»); no drift-injection test. **Bug:** `xangarro.usage_counts()` (0029) counts every `sales` row, but ADR-073 counts one per ticket (`counts-toward-usage.ts`) — multi-line tickets are over-counted and the integration test (one sale per ticket) never catches it. Built: `usage_counters`, nightly cron, `usage` in pull/entitlement, `origen` column.
      **Fixed 2026-09-23:** the ticket over-count — `0035_usage_counts_tickets.sql` replaces the body to count one transaction per ticket (distinct `sales.ticket_id`) plus ticketless lines, the rule in `counts-toward-usage.ts`; the integration test now seeds a three-line ticket beside a ticketless line and asserts 2. The nightly recompute corrects stored counters on its next run.

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
- Progress: 2026-09-18 · branch `track-n/n33-n02-wiring` · data-pg `0008_metering_cfdi` (`usage_counters`, `usage_notices`),
  `0009` grants (new `xangarro_metering` role, no DELETE), `0010` **`xangarro.usage_counts()` — the one
  SQL count** (OQ-5 + portal movements: `device_id = PORTAL_DEVICE_ID` → `portal`, counted; heuristic
  on device rows only), held equal to `computeUsage` on a throwaway PG17; admin `0009` makes
  `admin_tenant_usage()` call it (no second definition). `RecomputeUsageUseCase`
  (`@xangarro/application/usage`) + `GET /api/cron/usage` (`0 9 * * *` = 03:00 CDMX) recount the open
  and previous MX month for every tenant. `usageLimitsOf` / `previousUsagePeriod` /
  `PORTAL_DEVICE_ID` now live in `@xangarro/domain/usage`. **Still to do:** the push-time increment
  (`/sync/push` belongs to Track B — the nightly recompute covers it within a day); `usage` in
  pull/entitlement once C-12's field exists (`usageFor()` in `apps/web/src/server/usage/live.ts`
  is ready); C-12 limits (the `usageLimitsOf` mapper stays until then); `origen` column (C-12 step 7).

### N-03 Overage warnings and provider alerts `[LAUNCH]`

- [~] Status · **Blocked by:** N-02, N-08, B-14 · **Blocks:** N-30
  **Remaining (2026-09-23, verified against the code):** no portal usage banner; no app banner driven by the pulled `usage` (`usageMessageCode` is never called; `PlanLimitSheet` counts locally); no contract test that a paid tenant at 150 % still syncs every row (the mock's `over-limit` scenario is unused).

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
- Progress: 2026-09-18 · branch `track-n/b14-email` · owner email ready as
  `notifyUsageThreshold(notice)` (`apps/web/src/server/email/usage.ts`; 80/100 % template,
  prices + IVA, never punitive); the N-02 wiring calls it per owner crossing. Businesses with no
  Stripe customer have no reachable owner address yet (`docs/ops/email.md` §6).
- Progress: 2026-09-18 · branch `track-n/n33-n02-wiring` · the nightly recompute fires `crossedThresholds` once each (ledger
  `usage_notices`, key `business:period:metric:threshold` + recipient, retried if a send failed):
  owner → B-14's `notifyUsageThreshold()` addressed via `xangarro.owner_email()` (data-pg `0011`,
  SECURITY DEFINER, EXECUTE only to `xangarro_metering` — free businesses without a Stripe customer
  are reached); provider → inbox `kind=limite` at 100/150 %; `consecutiveMonthsOver` → one
  "sugerir upgrade" item per period. **Still to do:** portal and app banners (need C-12's `usage`).

### N-04 Free-tier product cap `[LAUNCH]`

- [x] Status
- Progress: 2026-09-21 · `track-n/c12-n04-uso` · **Done with C-12.** Transactions are
  advisory on every tier — `PlanRecordQuota.assertCanCreate` never throws
  and `warning()` feeds the neutral PlanLimitSheet after a successful capture
  (egreso, movimiento); the xangarrito quick-add enforces the 50-active-products
  cap client-side via `PlanLimitError` → the same sheet. · **Blocked by:** N-02, P-07 · **Blocks:** N-30
- **What:** xangarrito cannot create the 51st **active** product.
- **How:** enforced in the portal (create, import dry-run shows "excede tu plan por N") and in the
  app's quick-add using the last-known count (app copy: "Este negocio alcanzó su máximo de productos.
  El dueño puede administrarlo desde el portal." — no plan or upgrade wording, ADR-069). **The server still accepts** a product that arrives over
  the cap from an offline phone (rows are never dropped, ADR-053 Q4) and raises a `limite` inbox item.
  Archiving a product frees a slot. Replaces the A-10 "block the 51st record" behaviour.
- **Acceptance:** portal refuses #51 with the upsell; app quick-add refuses when known; offline
  overflow is accepted and flagged.

### Admin console

### N-05 `apps/backoffice` scaffold + staff auth `[LAUNCH]`

- [x] Status · **Blocked by:** B-01, P-22 · **Blocks:** N-06 … N-10, N-46 … N-48
      Done: 2026-09-20 · 0c20104b · staff allowlist + mandatory TOTP/AAL2 gate (in-house auth, 4d524f4), audited mutations, nonce CSP + noindex, service-role CI guard, real-DB Playwright suite + `backoffice-e2e` CI job. Follow-ups outside the acceptance: staff SQL still under `src/server/db/migrations/`; add `backoffice-e2e` to branch protection.

- **What:** Next.js App Router app at `admin.xangarro.mx`, its own Vercel project, reusing
  `@xangarro/tokens`, `data-pg`, `contracts`, `application`.
- **How:** Supabase Auth with a `staff_members` allowlist; **TOTP 2FA mandatory** (AAL2 required by
  middleware); every mutating action writes `staff_audit_log (staff_id, action, business_id, payload,
at)`; `robots: noindex`; strict CSP. The service-role key is an env var of this project only — a CI
  check fails if `SUPABASE_SERVICE_ROLE_KEY` is referenced under `apps/web`.
- **Acceptance:** non-allowlisted user → 403; allowlisted without 2FA → forced enrolment; audit row
  per mutation; CI guard green.
- Progress: 2026-09-17 · d6e83d7…6119ef0 (branch `worktree-agent-a9df007511aecbb56`, merged to main 907a08f, in-house auth `track-n/n05-inhouse-auth` 4d524f4 2026-09-18) ·
  `apps/backoffice` (Next 16, :3200): Supabase Auth + `staff_members` allowlist + mandatory TOTP/AAL2 via
  `proxy.ts` + `resolveGate` (re-checked in layout and every action); `auditedMutation` →
  `recordStaffAction` in one tx; nonce CSP; noindex ×3; service-role guard in admin `lint`. 31 tests.
  **Still to do:** Playwright against a real Supabase (403, forced MFA, audit row); move staff SQL from
  `apps/backoffice/src/server/db/` into `data-pg` + `db-local.sh`; provision the `xangarro_admin` role.
- Progress: 2026-09-20 · `track-n/backoffice-followups` · the browser suite exists and is green:
  `apps/backoffice/e2e/` (7 specs — no session → /login, revoked-mid-session loses the console,
  first sign-in forces TOTP enrolment with the seed read off the page the way a human without a
  camera reads it, sign-out ends the session, five wrong passwords lock 15 min, an inbox
  assignment writes its audit row) + a playwright config that refuses to run without a DB and a
  global-setup staff fixture (superuser INSERT; TOTP deliberately enrolled through the page).
  CI job **`backoffice-e2e`** added to `ci.yml` (pg service, db:apply + db:seed + the admin
  migrations psql'd, build, e2e, report artifact) — **the owner must add `backoffice-e2e` to
  branch protection** alongside ci/db/portal-e2e. Local: `pnpm --filter @xangarro/backoffice
test:e2e:db` (db reset + both migration sets + suite).

### N-06 Tenants, licences and Stripe `[LAUNCH]`

- [x] Status · **Blocked by:** N-05, B-10, B-06 · **Blocks:** N-30
      Done: 2026-09-23 · overrides reach the entitlement through `xangarro.tenant_plan_overrides()` (data-pg 0039, tenant-scoped, no reason or author) and `entitlementFromBilling`: the highest active comp lifts — never lowers — the plan until it expires, **with no grace** (a gift has a date; expiry reverts on the next pull); `extend_trial` moves the trial's end, **even after Stripe lapsed the trial** (staff's word; Stripe's own trial end is N-71's); `reissue_entitlement` needs nothing, since every entitlement is signed per request. Verified on real rows: a comp to Xangarrote shows as `xangarrote` until its expiry. The console's billing columns are real: backoffice migration `0017_admin_billing_read.sql` (column-level SELECT and an admin read policy on `subscriptions`, no write) and `db/billing.ts` over `billingStatusSnapshot`, the portal's own rule; no subscription is now a known «free», not «Sin datos». Tests: application `billing-entitlement-inputs.test.ts` (comp, expiry, never lowers, extension after lapse, no trial), backoffice `billing-snapshot.test.ts`.

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
- Progress: 2026-09-20 · `track-n/backoffice-followups` · **"Último acceso del dueño" is real
  data**: `xangarro.owner_last_login()` (admin **migration 0013**, SECURITY DEFINER over the
  portal's own `portal_sessions` — live rows only, returns nothing but business_id + timestamp)
  joined into the tenants summary. **The "last seen" rule now lives once**: data-pg's
  `deviceLastSeen` / `deviceStaleBefore` (`src/queries/device-last-seen.ts`) feed both N-06
  readers (tenants list aggregate, tenant detail per-device); the Studio doc query carries a
  pointer comment. Playwright: the console suite above (auth + audit) — the tenants/usage
  surfaces remain unit-covered.

### N-07 Usage, limits and capacity `[LAUNCH]`

- [~] Status · **Blocked by:** N-05, N-02 · **Blocks:** N-51
  **Remaining (2026-09-23, verified against the code):** acceptance met; sync p95 shows «sin datos» (no per-call timing table in Track B). The ticket over-count is fixed (data-pg 0035). **Fixed 2026-09-23:** `/uso` failed with «permission denied for table inventory_movements» on any database past data-pg 0029, because `usage_counts` reads `origen` and the admin role had no grant on it (console migration 0018); and a lapsed tenant is now judged by the free plan it is entitled to, not the paid plan Stripe last billed (`plan-view.ts`).

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
- Progress: 2026-09-18 · branch `track-n/n33-n02-wiring` · `/uso` now counts through data-pg's shared
  `xangarro.usage_counts()` (admin migration `0009_admin_usage_shared_count.sql`; same rows), which
  also counts portal-written movements.
- 2026-09-18 · sync p95 stays "sin datos": B-18 logs per-call timing to stdout only. Needs a queryable
  per-call timing table (endpoint, duration, at) from Track B — see
  `apps/backoffice/docs/b18-b16-integration.md`. Noted overlap: the "last seen" rule exists in three
  places (B-16 Studio query, two N-06 files) — consolidate when data-pg gains a shared query.

### N-08 Inbox (support and escalations) `[LAUNCH]`

- [x] Status · **Blocked by:** N-05 · **Blocks:** N-03, N-10, N-18, N-49
      Done: 2026-09-20 · 0c20104b · `support_items` with audited assign/status; sources wired: bug-report function, portal Ayuda («Es urgente»), P-10 factura, Stripe webhook, CFDI monthly close, N-03 límite, N-18 Hazlo por mí (cf3feaaa). The N-49 source arrives with N-49.

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
- Progress: 2026-09-18 · branch `track-n/n33-n02-wiring` · sources wired: Stripe → `factura` (webhook, `stripe-webhook`), CFDI
  monthly close (`cfdi-cron`), N-03 `limite` (`usage-cron`), through
  `@xangarro/application/support-inbox`'s HTTP client (`ADMIN_INGEST_URL` + `ADMIN_INGEST_SECRET`).

### N-09 Platform flags and kill switches `[LAUNCH]`

- [x] Status · **Blocked by:** N-05, A-14 · **Blocks:** N-30
      Done: 2026-09-23 · a flag flipped in `/flags` reaches the portal on its next request and a device on its next pull. data-pg `0039_entitlement_inputs.sql` gives the portal `xangarro.tenant_platform_flags()` (tenant-scoped, allowlists cut to the caller, «no rows» where the console's tables are absent); `entitlementFromBilling` (application `billing/entitlement.ts`) makes `features` = plan ∩ platform; the portal's single choke point `tenantAccess` (`server/billing/plan.ts`) reads it for every entitlement, and the session carries the resolved `platform`. The phone takes platform availability from the signed `features` (`use-feature-flags.ts`, `ResolvedEntitlement.features`), the compiled constant only when nothing verifies. Kill switches: `asesorLlm` gates the Asesor's Diagnóstico (off in production until staff switch it on, on locally — ADR-059's env gate is gone); `comprobanteShare` pauses both server-rendered receipt routes (verified live: 200 → 503 → 200). Tests: application `billing-entitlement-inputs.test.ts`, data-pg `entitlement-inputs.integration.test.ts`, ui `use-feature-flags.test.tsx`, web `platform-defaults.test.ts`; conformance green against the built portal. **Left, as its own contract task C-21:** carrying kill switches (`comprobanteShare`, `cobrosIntegrados`) to devices, so the register's local-canvas receipt and the phone honour them too.

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
  confirmation, history; integration note `apps/backoffice/docs/platform-flags-integration.md`.
  **Still to do (Track B/A):** `computeEntitlement` (`compute-entitlement.ts:68,83`) and
  `entitlementFor` (`bootstrap.ts:71`) read the portal view; the app must take platform availability
  from `entitlement.features`, not the compiled constant (A-10/A-14); a C- task so `comprobanteShare`
  and `cobrosIntegrados` can reach devices.

### N-10 Staff alerts `[LAUNCH]`

- [x] Status · **Blocked by:** N-08, B-14, B-18
      Done: 2026-09-23 · the digest's «Negocios sobre su límite» replaces its placeholder: tenants at or past 100 % of a plan limit this month, worst first, «2 meses seguidos» marked, a link to `/uso?filtro=sobre`, counted in the subject, «no disponible» when usage cannot be read (`alerts/over-limit.ts`, source `over-limit-source.ts` over `/uso`'s own `listUsage` filter). Verified on real rows: a lapsed Taquería with 58 products renders «Taquería Don Pedro · Xangarrito · 116 %». **Amended:** the dormancy section moves to N-48 — no tenant can be dormant before launch + 90 days. Urgent webhook delivery is built; it needs `ALERT_WEBHOOK_URL` in the console's Vercel env (owner, with O-5).

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
- Progress: 2026-09-20 · `track-n/backoffice-followups` · the digest also prunes expired
  `staff_sessions` (30-day horizon; grant in admin **migration 0012**; the count rides the 200
  reply as `prunedSessions`, a failure logs and never costs the email; integration test pins the
  rule).
- Progress: 2026-09-18 · branch `track-n/b14-email` · the digest cron sends through B-14's
  `transactionalMailer` (React Email staff-digest from the same sections; Resend with
  `RESEND_API_KEY`, dev outbox without), keyed per window so a re-run sends once.

### Settings and onboarding

### N-11 Portal settings parity `[LAUNCH]`

- [x] Status · **Blocked by:** P-08, P-15, C-15 · **Blocks:** A-01, N-12
      **Done 2026-09-23.** Every setting was already built; the mapping below closes the acceptance. A-01 finished 2026-09-16, so «blocks A-01» is moot.

  **Mapping of the old phone Settings (`packages/ui/src/screens/Settings/*` before A-01):**

  | Old entry (file)                                                                                      | Now                                                                                                            | Spec                                                        |
  | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
  | Negocio: nombre, régimen, RFC (`settings-negocio`, `edit-business-modal`)                             | portal `/negocio`                                                                                              | `negocio.sync.spec.ts` (RFC, régimen)                       |
  | Tasas ISR + confirm (`settings-tasas-isr`, `isr-defaults-card`)                                       | portal `/negocio`; the confirm became a switch (ADR-082)                                                       | `negocio.sync.spec.ts` (régimen → ISR)                      |
  | Tipos de pago (`tipos-de-pago-screen`)                                                                | portal `/negocio`                                                                                              | `negocio.sync.spec.ts` (payment methods, last one stays on) |
  | Atributos de producto (Negocio section)                                                               | portal `/negocio` (AtributosCard)                                                                              | `negocio.sync.spec.ts` (saved with payment methods)         |
  | Contacto y comprobantes (C-15)                                                                        | portal `/negocio/comprobantes`                                                                                 | `comprobantes.sync.spec.ts`                                 |
  | Funciones switches (P-15)                                                                             | portal `/negocio`, writes                                                                                      | `sync.spec.ts` (switch off reaches the phone)               |
  | Preferencias / avisos                                                                                 | portal avisos                                                                                                  | `avisos-configurar.spec.ts`                                 |
  | Empleados (`settings-empleados`, `edit-empleado-modal`, `empleado-*`)                                 | portal `/equipo`                                                                                               | `equipo-drawers.spec.ts`                                    |
  | Sonido de venta (`cachink-sound-toggle`)                                                              | device (A-12)                                                                                                  | Maestro                                                     |
  | Notificaciones (`notifications-toggle`)                                                               | device (A-12)                                                                                                  | Maestro                                                     |
  | Reportes de fallos (`crash-reporting-toggle`)                                                         | device (A-12)                                                                                                  | Maestro                                                     |
  | Buscar actualizaciones, Reportar un problema (`settings-tail`, `bug-report-sheet`, `feedback-action`) | device (A-12)                                                                                                  | Maestro                                                     |
  | Estado de sincronización, Actualizar, No enviados                                                     | device (A-12)                                                                                                  | `settings-desvincular.yaml` and sync flows                  |
  | Exportar datos (`exportar-datos-action`)                                                              | device (A-12)                                                                                                  | Maestro                                                     |
  | Nombre del negocio + aviso del portal, Desvincular                                                    | device (A-12), read-only name                                                                                  | `settings-desvincular.yaml`                                 |
  | Idioma (`settings-sistema`)                                                                           | dropped: es-MX is the only locale                                                                              | —                                                           |
  | LAN (`lan-details-card`, «Modo» in Negocio)                                                           | dropped: A-18 removed LAN sync                                                                                 | —                                                           |
  | Umbrales de Indicadores (`settings-indicadores`)                                                      | dropped: the portal's Indicadores use fixed health bands (`estados/indicadores.tsx`), no per-business override | —                                                           |
  | Volver a correr el asistente (`settings-tail`)                                                        | dropped from the device: onboarding is the portal's «¿Cómo empiezo?» and N-12                                  | —                                                           |

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
  **Remaining (2026-09-23, verified against the code):** acceptance met (`suggested-plan-table.test.ts`, 535ceaa1). Business type and WhatsApp answers are never saved although `businesses.tipo_negocio` / `whatsapp` exist (`AplicarConfiguracionUseCase` writes only name + payment methods); step 6 records `hasLogo` with no upload (N-19); answers live in `business_onboarding`, not `businesses.onboarding` — documented, not ratified by an ADR.

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

- [x] Status · **Blocked by:** N-12, N-01 · **Blocks:** N-30, L-03
      Done: 2026-09-18 · 302c95df · `/signup?plan=` → wizard → «Tu plan ideal»; «Probar 14 días» through B-10 Checkout; pending paid answers applied exactly once by the webhook's `EntitlementListener` (`aplicar-respuestas-pendientes-use-case.test.ts`). A live Checkout run is O-12.

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

- [x] Status · **Blocked by:** N-12
      Done: 2026-09-18 · b063d4b1 · `/como-empiezo` checklist detected from data, incl. «Sube tu logo» (reads `businesses.logo_url`); the Mercado Pago/Clip item arrives with N-44.

- **What:** P-04's checklist keeps its items (operator, products/import, code, device activated,
  first sale synced) and adds "Sube tu logo". "Conecta Mercado Pago / Clip" appears only when
  `cobrosIntegrados` is platform-available (N-44).
- Progress: 2026-09-18 · b063d4b (merged to main 360678a 2026-09-18) · `/como-empiezo` checklist detected from data; MP/Clip item waits on N-44.

### N-15 Re-run the wizard `[LAUNCH]`

- [x] Status · **Blocked by:** N-12
      Done: 2026-09-18 · f29f8fb0 · `/bienvenida/revisar` «esto cambiará» summary, no write when nothing changes, link on Negocio (`configuration.test.ts`, `aplicar-configuracion-use-case.test.ts`).

- **What:** Configuración → "Volver a configurar mi negocio": pre-filled with current values; before
  applying, a summary "esto cambiará" (e.g. "Se desactivará Inventario — tus productos no se
  borran").
- **Acceptance:** applying with no changes is a no-op; every change is listed.
- Progress: 2026-09-18 · b063d4b (merged to main 360678a 2026-09-18) · `/bienvenida/revisar` with the "esto cambiará" summary; no change → no
  write. **Still to do:** a "Volver a configurar mi negocio" link on the Negocio screen (portal session);
  until then it lives on the checklist page.

### Import

### N-16 Import engine + Clientes template `[LAUNCH]`

- [x] Status · **Blocked by:** P-07 · **Blocks:** N-17, N-18
- Progress/Done: 2026-09-18 · `track-n/n16-import` · P-07's three steps generalised into a template
  registry (`apps/web/src/server/import/templates.ts`) with the products flow byte-identical (same
  plan/apply path, 5 000-row cap, duplicate-SKU rule); actions renamed
  `previsualizarImportacion`/`importarDatos` around a `plantilla` form field that defaults to
  Productos. **Clientes template:** nombre/teléfono/RFC (RFC validated with
  `packages/domain/src/fiscal/rfc.ts`), matching by teléfono digits with a normalised-nombre
  fallback (Ñ is a letter, not an accent), matches become «actualizar» that overwrite telefono/rfc,
  an empty optional cell keeps what is stored, in-file duplicates are errors on both rows. **.csv
  support** beside .xlsx (`lib/csv.ts`). New `Client.rfc` (optional, normalised) on the domain
  schema → the wire; data-pg **0020** `clients.rfc` + integration test; the drift test's
  cloud-ahead rule now allows HYBRID tables whose wire field is optional (proven per column).
  `CrearClienteUseCase`/`EditarClienteUseCase` (+tests; application suite 459 green), pg
  `clients` repository (sync-log on every write). UI: unified **`/importar`** screen (template
  cards → the three steps; ADR-086 code-first) replacing the Productos drawer — the Productos
  button navigates to `?plantilla=productos`; the sidebar nav is untouched. Template download
  `/api/import/clientes`. E2E: the P-07 spec re-pointed at the page + a new
  `importar-clientes.sync.spec.ts` (3 rows → round-trip «3 sin cambios», one changed RFC → one
  update, malformed row skipped with error) — full web e2e 448 green. SQLite half of `rfc` waits
  for the app branch (C-15-style split, `CLOUD_AHEAD: clients: ['rfc']`).
- **Note (ADR-081, 2026-09-18):** portal-created products start at zero stock, the import template has no
  `stock_inicial` column, and **the import writes no movements**. Opening stock is N-17's job.
- **What:** generalise P-07's three steps (template → dry-run with row-level errors → one-transaction
  commit, ≤ 5 000 rows, .xlsx and .csv) into a template registry; add **Clientes** (nombre, teléfono,
  RFC optional).
- **Acceptance:** per template: a malformed-row test, a >5 000 test, a duplicate test, a happy path.

### N-17 Saldos iniciales template `[LAUNCH]`

- [x] Status · **Blocked by:** N-16, C-20
      Done: 2026-09-23 · «¿Cómo empiezo?» has a «Captura tus saldos iniciales» row, done once a live opening balance exists (`onboarding.test.ts`). `saldos-iniciales.spec.ts` captures caja 5 000 and bancos 12 000 on a new owner and sees $17,000.00 as the Balance's Efectivo, then the row ticks itself. The SQLite half landed in 23c7fd43.

- Progress: 2026-09-19 · `track-n/c20-n17-apertura` · **pg/web halves done.** **Saldos
  iniciales** — `/saldos-iniciales`: fecha de apertura, caja, bancos, and the per-cliente CxC
  lines (hand-edited or prefilled from a .csv of the Clientes-import shape + saldo column; a
  row whose cliente does not exist is reported, never invented), saved through
  `GuardarSaldosInicialesUseCase` (replace-style; refuses once locked), with the explicit
  **«Bloquear saldos iniciales»** typed confirm — `locked_at`, one-way, the v1 stand-in for the
  first period close (owner decision 2026-09-18). **Inventario inicial** —
  `/inventario-inicial`: an editable grid of the catalogue (cantidad + costo, live valuation
  total) prefillable from .csv (producto, cantidad, costo); `CapturarInventarioInicialUseCase`
  writes apertura movements in one transaction — **no egreso** (day-one stock is not a
  purchase) and **never counted** toward the monthly limit: `classifyMovementOrigin` and
  `xangarro.usage_counts()` (0025's body) both classify motivo `Apertura de inventario` as
  `apertura`, excluded (equality test seeds both). A second capture is refused, not merged.
  **Estados**: `loadEstadosModel` feeds the Balance the real apertura facts (efectivo =
  caja + bancos, CxC lines, capitalInicial = cash + CxC + Σ apertura movements' valuation) so
  Activo = Pasivo + Capital holds from statement one; a business without apertura is
  bit-identical to before. Entry points from Negocio. **Still to do:** the saldos iniciales
  row on the «¿Cómo empiezo?» checklist, and the SQLite half with the app branch.
- **Inventario inicial (owner decision 2026-09-18):** an explicit one-time step, "Captura tu inventario
  inicial" (grid or Excel: producto + cantidad + costo), writing portal inventory movements with
  `origen = apertura` (C-12 step 7). They are **not** counted toward the monthly limit, they feed the
  opening inventory valuation, and the step closes with the first period close. Products and the
  product import stay stock-free (ADR-081).
- **What:** opening balances so the Balance (NIF B-6) is right on day 1: caja, bancos, cuentas por
  cobrar per cliente, inventory valuation (from stock inicial × costo).
- **Acceptance:** after import, the portal Balance equals the imported figures; statements tests.

### N-18 "Hazlo por mí" migration service `[LAUNCH]`

- [x] Status · **Blocked by:** N-08, N-16
- Progress: 2026-09-20 · `track-n/n18-hazlo-por-mi` · **Done.** data-pg **0026**:
  `assisted_imports` + `assisted_import_files` — files as `bytea` in the tenant DB
  (the N-19 owner-ratified deviation from buckets; Supabase Storage REST needs a
  JWT the in-house auth never mints), tenant RLS, admin grants via backoffice
  migration **0014**. The state machine is guarded SQL, split across
  `queries/assisted-imports{,-files,-resolution}.ts`: `revision →
esperando_aprobacion → aplicada/rechazada/expirada`. Staff only _send_
  (`markForApproval` guarded on `revision`, audited `migracion.enviar` from
  /migraciones with the mapped .xlsx/.csv); **applying is the tenant's claim
  alone** — `claimForApproval` atomically flips `esperando_aprobacion` and
  returns the mapped file, and the claim + registry apply + row-count check run
  in ONE transaction (a failed apply rolls the claim back). Tenant side:
  `/importar` card — xangarrito sees the upsell, never the form; the request
  (sistema 1–120, notas ≤ 2000, 1–5 files ≤ 20 MB .xlsx/.csv, use case with
  plan gate + one-in-flight) lands in the inbox as `kind=migracion`
  (`sourceRef hazlo-por-mi:<id>`, idempotent); Aprobar/Rechazar buttons at
  `esperando_aprobacion`; a resolved request reopens the form. Sweeps ride the
  digest cron: 14-day expiry of unanswered requests, 30-day LFPDPPP purge
  (DELETE + `files_purged_at` stamp, idempotent, logged in the digest).
  Downloads staff-gated at `/api/staff/migraciones/archivos/<id>` (410 once
  purged). Tests: data-pg integration 6/6 (claim guards, isolation, sweeps),
  application 4/4, web e2e `hazlo-por-mi.spec.ts` 10 green ×2 runs,
  drift test lists both tables portal-only.
- **What:** a card on the import screen → form (sistema actual, qué datos, archivos o respaldo) →
  inbox item `kind=migracion`, SLA 3 business days. Free (one migration) on xangarro / xangarrote;
  xangarrito sees "disponible en planes de pago".
- **How:** staff map the data to the N-16 templates and run the import **on behalf of** the tenant
  from `apps/backoffice` (audited); the tenant receives the dry-run preview and approves before commit.
  Uploads in a private bucket, **auto-deleted 30 days after the item is resolved** (LFPDPPP).
- **Acceptance:** commit is impossible without tenant approval; the purge job deletes files and logs.

### Receipts and WhatsApp

### N-19 Logo + brand colour `[LAUNCH]`

- [~] Status · **Blocked by:** C-15 · **Blocks:** N-12, N-20
  **Remaining (2026-09-23, verified against the code):** the phone does not download or cache the logo (nothing fetches `/api/logos`; 73324085 only added the branding columns), so «renders offline» is unmet. The monthly-PDF logo (02b207da) is done — drop it from «still to do».

- Progress: 2026-09-18 · `track-n/c15-n19-branding` · **pg/web halves done.** Logos live in a
  portal-only `business_logos` table (0023) — **deviation from the interview's bucket, ratified
  by the owner 2026-09-18**: Supabase Storage's REST upload needs a Supabase JWT the in-house
  auth never mints and the service role is forbidden in apps/web (N-05); bytes in the DB, served
  publicly by `/api/logos/<businessId>` (ETag = bytes' hash) through SECURITY DEFINER
  `xangarro.logo_publico()` — public read, authed write, one stable **absolute** URL on the wire
  (phones fetch it). Upload (owner/admin, PNG/JPG/SVG ≤ 2 MB): SVG sanitised
  (`domain/comprobante/brand.ts`: script/foreignObject/handlers/js-URLs stripped, gate-checked —
  malicious-SVG tests green); raster decoded with sharp (0.35.4) and the brand colour extracted
  by a saturation-weighted histogram (`dominantColor`, SVG by `dominantSvgFill`); extraction
  never overwrites a chosen colour. UI: **Negocio → Comprobantes** (`/negocio/comprobantes`,
  ADR-086 code-first) — logo upload with preview, colour picker + hex, template cards, leyenda,
  WhatsApp, address switch; viewer reads without controls; link from Negocio. The sidebar brand
  block renders the logo when set (wordmark otherwise). e2e `comprobantes.spec.ts` (owner flow +
  viewer) green; full suite 454. **Still to do:** the monthly PDF's logo (with N-20's renderer)
  and the phone's download-and-cache half (app branch).
- **What:** upload PNG/JPG/SVG ≤ 2 MB to a Supabase Storage bucket (RLS by `business_id`; SVG
  sanitised); `businesses.logo_url` (exists, always null today) set; brand colour auto-extracted
  (dominant non-neutral colour) and editable. Logo shown in the portal sidebar/header, on receipts and
  on the monthly PDF.
- **How:** the device downloads the logo once per change and caches it for offline receipts.
- **Acceptance:** malicious SVG is neutralised (test); the app renders the logo offline.

### N-20 Receipt templates `[LAUNCH]`

- [x] Status · **Blocked by:** N-19, app design (N-24) · **designs mirrored 2026-09-20**
- Progress: 2026-09-20 · `track-n/n20-comprobantes` · **Done (pg/web halves).** The four
  templates live in `packages/domain/src/comprobante/svg/` as one SVG renderer
  per template behind `comprobanteSvg` (ADR-099): the `Comprobante` contract
  transcribed from `design-reference/comprobantes/*.dc.html` (artboards A/B/C
  - spec sheets), character-count wrapping, the 0.45-luminance contrast rule
    as one decision per receipt, per-template paper for print. PNG via sharp
    (1080 px WhatsApp; fonts vendored OFL — fontconfig conf generated at render
    time on Linux, `scripts/fuentes-comprobantes.sh` for macOS dev), PDF via
    `buildComprobantePdf` (application, page-of-raster, the informe pattern).
    Portal: live preview on `/negocio/comprobantes` through
    `/api/comprobantes/muestra` (branding over the business's last venta, or a
    demo one) with PNG/PDF downloads; per-venta salida at
    `/api/comprobantes/<ticketId>?formato=` (N-21's WhatsApp link target).
    Tests: 12 artboard snapshots + contrast/truncation/format/no-fiscal units
    (domain 51), full web e2e 551 green. **Inferred:** Tarjeta pill
    `#FFF8E1`. The phone renders from the same domain SVG (app branch).
- Progress: 2026-09-20 · `track-n/c15-direccion` · **the direccion block
  lives** — data-pg **0028** adds `businesses.direccion` (one free line, ≤
  140, cloud-ahead in the drift contract until the app branch mirrors it);
  the Comprobantes screen edits it above the `address_print` toggle, and
  the renderers print it only when the toggle is on AND a line exists.
  Old→new covered in `business-branding.integration.test.ts`; e2e rounds
  the field through save + reload.
- **What:** four designed templates — Clásico, Moderno, Ticket, Minimal — in
  `packages/domain/src/comprobante/` (one renderer, used by the portal live preview and the app).
  Fields: logo, colour, leyenda, dirección, WhatsApp, redes. PNG and PDF.
- **Acceptance:** snapshot tests per template; totals stay legible with any brand colour (contrast
  check picks the text colour).

### N-21 WhatsApp share `[LAUNCH]`

- [~] Status · **Blocked by:** N-20 (done) · web half landed 2026-09-20
  **Remaining (2026-09-23, verified against the code):** phone half only: no Android send to a preset number (`share-image.ts` opens the generic sheet), no «Enviar como texto», no Maestro flow to the hand-off, no Android-fallback unit test. Blocked on N-24.

- Progress: 2026-09-20 · `track-n/n21-informe-logo` · **the web half lives.** The
  register's share dialog (Track O's) now saves the **branded** comprobante: a
  device-token route `GET /api/v1/comprobante?ticketId=` renders the N-20
  pipeline in the business's chosen template (the register has no portal
  session, hence /api/v1); «Guardar imagen» fetches it when linked and online
  and falls back to the local canvas offline or pre-push (404). The client's
  phone is remembered per cliente (localStorage keyed by cliente, last-used
  fallback) and prefills the dialog. Caja keeps the canvas right after a sale
  — `registrar` returns no ticket id and changing the register-runtime
  protocol is Track O's call. **Left:** the phone half (ACTION_SEND with jid,
  iOS share sheet) on the app side. Also here: the informe mensual PDF now
  prints the business's logo beside the title (E3's noted tail).
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

- [x] Status · **Blocked by:** P-24 (shell landed; nothing in its remainder blocks this)
      Done: 2026-09-21 · ac61007b · module service worker (`public/sw.js`) precaches `/sin-conexion.html` and replaces failed Director navigations only (never `/operador` or `/api/*`); sw-rule unit tests 3/3; `offline-page.spec.ts` green on the seeded suite (ad774cbc).

- **What:** a minimal service worker that serves a branded "Sin conexión — tus ventas siguen
  guardándose en tus dispositivos" page when navigation fails. No data caching, no writes.
- Progress: 2026-09-21 · `public/sw.js` (a **module** worker so its one rule,
  `replaceableNavigation`, is exported and unit-tested from the file itself — the guard
  keeps a Node import inert) precaches exactly `/sin-conexion.html` and answers failed
  navigations with it; `/operador` and `/api/*` are never replaced (ADR-071). The page is
  self-contained inline CSS/SVG — no fonts, no network. Registration lives on the portal
  layout (`src/shell/offline-register.tsx`), production only; the register never installs
  it. Unit tests `tests/offline/sw-rule.test.ts` (3 green); e2e
  `offline-page.spec.ts` (offline → branded page, register not replaced) joins the seeded
  suite — **not yet run against the seeded DB**, which is all that keeps this `[~]`.

### App phase 2

### N-24 Phone app adopts the Track O operator design `[LAUNCH]`

> **Re-scoped 2026-09-17 (owner decision):** A-01…A-18 are already built on the unmerged branch
> `rename/xangarro-stored-ids`, and Track O (`../archive/10-operador.md`, ADR-071) already carries a finished
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
      **Remaining (2026-09-23, after C-14 and P-06 landed):** the phone side only — verified App Links and Universal Links (`assetlinks.json`, AASA) for `app.xangarro.mx/activar`, reading the token from the fragment, the camera screen, the SEC-MOB-04 confirmation «¿Vincular a _negocio_?» before redeeming (needs a small preview that names the business for a token, not built), and the Maestro deep-link flow. The contract, the token, the portal QR, the WhatsApp share and the `/activar` fallback page exist. Still blocked by N-24.
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
  **Remaining (2026-09-23, verified against the code):** 4 of 6 highs fixed (SEC-AUTH-01/02, SEC-SEC-01, SEC-DEV-01 — the oracle closed and the QR token built by C-14, 2026-09-23); SEC-DATA-01 is the owner switch O-2; SEC-PRIV-01 is N-34. Mediums in scope, 2026-09-23: **SEC-WEB-01 done** — the portal sends X-Frame-Options, an enforced `frame-ancestors 'none'`, nosniff, HSTS, a strict referrer and Permissions-Policy, `poweredByHeader` off, from one implementation shared with the console (`@xangarro/config/security`); its full nonce CSP (`src/proxy.ts`, with `'wasm-unsafe-eval'` and workers for the register) is served **report-only** to `/api/csp-report`, and the sweep found zero violations on 18 pages and every register/sync e2e flow after two fixes (Zod's eval probe set `jitless` in the head; every route rendered per request so every script gets the nonce). **Left:** flip `Content-Security-Policy-Report-Only` to enforcing in `src/proxy.ts` after a week of clean production logs. **SEC-SUP-01 done** — `permissions: contents: read` on every workflow, every action pinned to a commit SHA, a `supply-chain` job running `pnpm audit:gate` (fails on a high/critical advisory reachable at runtime; build-only routes and a dated allowlist in `security/audit-allowlist.json` are the only excuses; the two that shipped — `tmp`, `brace-expansion` under `exceljs` — are fixed by `pnpm.overrides`) and a gitleaks scan of each run's commits, plus a CodeQL workflow (the repo is public). The gitleaks step is unrun until CI's first pass. The hosted re-run needs X-01.

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
  **Remaining (2026-09-23, verified against the code):** fixed: DB-SYNC-01, DB-IDX-01 (8666e6ce), DB-QRY-01, DB-MIG-01, DB-RLS-01 and DB-MIG-02 (B-03, 2026-09-23). Open: DB-OPS-01 (PITR + drill = O-3), DB-SYNC-02 (unverified). `pg_stat_statements` re-run needs the hosted project.

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

- [x] Status · **Blocked by:** N-01, C-12 · **Blocks:** X-10
- **Where:** `apps/landing/` in this repo (ADR-084), not the old `CachinkLanding` repo.
- **What:** pricing table with the new limits and annual toggle, every price marked **"+ IVA"** with the
  total on hover/footnote; "Tu negocio sigue aunque se vaya el
  internet" (decision 20); fix L-03's stale `freelancer/emprendedor/mipyme_pro` slugs (ADR-059).
  Payment-method line: "Tarjeta de crédito o débito · Transferencia SPEI en plan anual" (no OXXO).
- Progress/Done: 2026-09-18 · `track-n/n31-landing` · full rebrand to Xangarro! plus the pricing
  rebuild — this **also delivers L-01, L-02 and L-03** (Done lines there). Pricing card from a new
  single source `apps/landing/landing/planes.js`: xangarrito $0 / xangarro $199 / xangarrote $399
  MXN·mes ("Recomendado" on xangarro), monthly/annual toggle (annual 10× monthly = "2 meses gratis"),
  **"+ IVA"** badge on paid prices with IVA-inclusive totals in the footnote (230.84 / 462.84 /
  2,308.40 / 4,628.40), limits 300/50 · 10k/1k · 30k/5k + operadores 1/2/5, exportación on every
  tier, "Multi-sucursal (próximamente)" on xangarrote. Payment line "Tarjeta de crédito o débito, o
  por transferencia SPEI en plan anual" (no OXXO); offline line "Tu negocio sigue aunque se vaya el
  internet" in the Precios intro, hero FAQ and llms files. All CTAs →
  `app.xangarro.mx/signup?plan=xangarrito|xangarro|xangarrote` with utm\_\* passthrough; the waitlist
  form and `VITE_WAITLIST_ENDPOINT` are gone. FAQ (14 answers), JSON-LD offers, `llms.txt` and
  `llms-full.txt` rewritten to the decided product facts (web portal today, apps próximamente,
  per-negocio accounts, CFDI answer now covers the subscription CFDI). Canonical domain switched to
  `xangarro.mx` everywhere (`.env.example`, vite.config, prerender, structured-data, robots,
  sitemap); brand assets are sharp-generated text-wordmark placeholders (`generate-og.mjs` now also
  emits favicon / apple-touch-icon / `site.webmanifest`). Verified: `grep -rni cachink apps/landing
docs/landing` → 0, prerender smoke tests green (titles updated in lockstep), screenshots at 360 px
  and 1440 px, annual toggle prices/cadence/aria-pressed/CTA params asserted in-DOM. **Deviation:**
  shipped without C-12 — the limit numbers are the decided constants (ADR-065), not read from any
  contract; if C-12 ever changes them, `planes.js` is the one place to update.

### N-32 Store-compliance sweep `[LAUNCH]`

- [~] Status · **Blocked by:** N-24, A-15 · **Blocks:** X-05
  **Remaining (2026-09-23, verified against the code):** reviewer checklist for X-05 in `docs/store/`. `pnpm lint:store` is green again and gated in `ci.yml` (see Progress).

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
  "Suscripción" as a sale category, 3.1.3(e)). The `rename/xangarro-stored-ids` merge brought 20
  violations onto `main` (`planLimit.*`, `planBanner.fellBack`, `settings.plans.*`, `activate.*`,
  portal URLs in hints).
- Progress: 2026-09-23 · the 20 strings rewritten to neutral copy in `es-mx.ts` — no plan name, price,
  "renueva/cambia tu plan" or URL; limits and slots say "Pide al dueño del negocio que revise su cuenta"
  (not "ya fue avisado": the N-03 owner e-mail is not built yet); pairing is "Vincular" / "Código de
  vinculación" per ADR-069, and `sync.errors.unauthenticated` says "vincularse de nuevo". The Settings
  "Plan" row (`settings.plan` / `settings.plans.*`) is gone rather than reworded — its only content was
  a plan name, and its keys never matched the `PlanId`s anyway. No allowlist entry added.
  `pnpm lint:store` gates in `ci.yml` (job `ci`, after Lint). `entitlement-freelancer-limit.yaml`
  asserts the new copy. **main: 0 violations.** Still to do: reviewer checklist for X-05.

### N-34 Aviso de privacidad + ARCO requests `[LAUNCH]`

- [~] Status · **Surfaced by:** N-26 (SEC-PRIV-01) · **Blocked by:** N-08 · **Blocks:** N-30
  **Remaining (2026-09-23, verified against the code):** the aviso integral is reachable from no surface (no route, footer or landing link); no ARCO form or `kind=arco` inbox item or due-date clock; consent captured only at signup (48bca19c, `privacy_consents`, migration 0034 — hosted apply pending), not for device linking or operator NIP; PRIV-GEO-01, PRIV-IA-01/02, PRIV-OPS-01 open; self-service deletion and consent withdrawal not built. Counsel review is O-17.

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

### N-35 Rename the web apps: `portal` → `web`, `admin` → `backoffice` `[LAUNCH]`

- [x] Status · **Owner decision 2026-09-18** · **Blocked by:** a quiet window agreed with the session that
      owns the customer web app (all its work pushed, pushes paused)
- **Done 2026-09-18:** one atomic commit — `git mv` of both app dirs, package names, `--filter`s, CI,
  launch.json, `.gitignore`, design-lint roots, service-role guard, store/lint-coverage tests, docs and
  plan paths. Env vars (`PORTAL_URL`, `PORTAL_TODAY`, `PORTAL_DEVICE_ID`) and code identifiers kept.
  Vercel Root Directory switch is still the owner's step below.
- **Why:** Director and Operador both live in the customer web app (ADR-071), and "admin" collides with the
  owner/admin member roles. The real split is customer web app vs internal staff console.
- **What:** `apps/{portal → web}` (`@xangarro/web`, Vercel project `xangarro-web`, still
  `app.xangarro.mx`); `apps/{admin → backoffice}` (`@xangarro/backoffice`, Vercel project
  `xangarro-backoffice`, still `admin.xangarro.mx`). One atomic commit: `git mv`, package names, every
  `--filter`, `.github/workflows/*`, turbo, scripts, design-lint paths, playwright, docs/plan paths, ops
  docs. Code identifiers and routes that merely say "portal" stay unless they are paths.
- **After merge (owner):** in Vercel, update each project's Root Directory to `apps/web` / `apps/backoffice`.
- **Acceptance:** `rg -n "apps/(portal|admin)|@xangarro/(portal|admin)"` → 0 outside ARCHITECTURE.md history and
  archives; typecheck/lint/test/e2e green; both Vercel projects build.

### N-33 CFDI automation for Xangarro's own subscriptions `[LAUNCH]`

- [~] Status · **Blocked by:** B-10, P-10, N-08 · **Blocks:** N-30
  **Remaining (2026-09-23, verified against the code):** refund → PAC cancellation not wired (`cancel-cfdi-for-refund.ts` exists, nothing calls it; refunds only file an inbox item); egreso for partial refunds not built. Off-mode, duplicate-webhook and monthly-close criteria have unit tests. Sandbox stamps need Facturapi test keys (O-15); fiscal defaults need O-14.

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
- Progress: 2026-09-18 · branch `track-n/n33-n02-wiring` · wired behind `CFDI_MODE` (default `off`; a Facturapi key that does not
  match the mode is refused): `invoice.paid` → `RecordPaymentForCfdiUseCase` always records the
  payment in `cfdi_payments` (data-pg `0008`, only `xangarro_billing`, no DELETE; Postgres
  `IssuedCfdiRepository` replaces the in-memory one); `off` → "pago sin CFDI" inbox item (amount incl.
  IVA, `sourceRef` = Stripe invoice id); `test`/`live` → Facturapi, item only on failure. Monthly
  close `GET /api/cron/cfdi-close` (`0 7 1 * *` = 01:00 CDMX on the 1st): `off` lists the period's
  un-invoiced payments in one item, `test`/`live` stamps the global CFDI. **Still to do:** sandbox
  stamps per path with real test keys; tenant fiscal data (no RFC fields on main → every payment
  routes global, P-10); marking a `factura` item with its UUID does not yet update `cfdi_payments`;
  refunds/egreso; contador sign-off.
- Progress: 2026-09-18 · branch `track-n/n33-facturas-list` · data side of the customer **Facturas** list
  (UI is P-10's). Migration `0019_facturas_del_negocio.sql`: `xangarro.facturas_del_negocio(business_id)`
  (SECURITY DEFINER, EXECUTE `xangarro_app` only, empty unless the id is the caller's tenant claim) maps
  `cfdi_payments` to `timbrada | en_global | pendiente | error` (stamped / pending_global+in_global /
  manual / claimed; refunded payments not listed); `xangarro.cfdi_marcar_emitido()` (EXECUTE
  `xangarro_admin`) — **resolving a `factura` inbox item with its UUID now marks the payment** (individual
  → `stamped` without PAC id = `emitidaManual`, global → `in_global`). Server functions for P-10 in
  `apps/web/src/server/billing/facturas.ts`: `listarFacturas()` (any member),
  `urlDescargaFactura(paymentId, 'pdf'|'xml')` (owner/admin; `data:` URL from the PAC; `NO_DISPONIBLE`
  with `CFDI_MODE=off`), `solicitarFacturaNominal(paymentId)` (owner; `en_global` + valid fiscal data →
  one inbox item per payment, else `NO_APLICA` / `DATOS_FISCALES_INCOMPLETOS`). Result types in
  `facturas-core.ts`. **Still to do:** the monthly close's own item (`cfdi-global:<period>`) marks nothing.
- Progress: 2026-09-18 · `track-n/n33-gaps` · the four handoff gaps closed (owner interview
  2026-09-18): data-pg **0022** — `claimed` shows as `pendiente` (still owed, not "error"), refunded
  payments (`excluded_from_global`/`cancel_requested`/`cancelled`) listed as **`reembolso`**, and
  `xangarro.cfdi_marcar_global(period, uuid)` so resolving the monthly-close item marks its
  `pending_global` payments `in_global` under one hand-stamped global (backoffice resolver wired);
  `charge.refunded` → `RecordRefundForCfdiUseCase` (status bookkeeping + `factura` inbox item
  «Reembolso recibido — dar de baja su CFDI», idempotent per refund id — **no PAC cancellation**,
  that waits for O-14); `local/0000` provisions `xangarro_admin` so "marcar UUID" and the grants
  tests run locally. Facturas estado union: `error` → `reembolso` (application + P-10's label).
  Remaining: sandbox stamps (owner Facturapi test keys, O-15) and the fiscal refund automation
  (O-14 contador sign-off).

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

### N-55 Analítica geográfica por estado (ADR-092)

Where users log in, where they are when they buy, and where marketing traffic comes from — one
console view, by Mexican state. **No raw IP is ever stored:** the state comes from Vercel's derived
`x-vercel-ip-country-region`, and the table is a daily counter, an aggregate from birth. A spike on
2026-09-22 confirmed the Hobby plan does receive the geo headers, and that the region arrives as the
bare ISO 3166-2 code (`CHH`), not `MX-CHH`.

- [x] **N-55 · Phase 1 — the pipe.** `xangarro.geo_counters` + `geo_record` (`0030`, `0031`), the
      pure `regionFromHeaders`, and the writer hooked into `signInUser` so the password path and both
      magic-link paths are covered by one call. Proved against real Postgres: the app role counts and
      cannot read back, an unknown source raises, an unusable region folds into "unknown".
      **The point is to steer marketing spend**, which sets the order below. Raw counts always favour big
      cities — a population artefact, not an insight — so the console is **metric-first**: the user picks
      what to shade by (accesos · visitas · checkouts · **conversión**), and the source is one input to
      that. Two rules the map must not break: a rate below a denominator floor renders as «datos
      insuficientes», never as a bright 100% from one visit; and a rate uses a diverging scale anchored on
      the national average, with that average stated as a number.

- [x] **N-56 · Phase 2 — the console as a sorted table**, plus the metric registry. Ships before the
      map on purpose: a choropleth over three days of data is an empty country. Build the metric
      abstraction here even though only `accesos` has data — retrofitting a second axis later is the
      expensive version.
- [x] **N-57 · Phase 3 — UTM attribution.** The cheapest item here and the one that makes the rest
      actionable. `apps/landing/src/App.jsx` already appends `utm_*` to every signup CTA and the
      portal **reads none of them** — no `utm` reference exists in `apps/web/src` or in any
      migration, so attribution dies at the door and no campaign can be evaluated, in any city.
      Store first-touch on the business at signup. Also move the rewrite out of `App.jsx` into the
      shared client entry: the `/recursos` article pages drop UTMs today, so content marketing is
      entirely unattributed.
- [~] **N-58 · Phase 4 — purchases + landing.** Checkout hook ✅ shipped; the pixel ✅ **is built but
  dark** — `VITE_GEO_PIXEL_URL` is empty, so the build emits nothing, exactly like
  `VITE_PLAUSIBLE_DOMAIN`. Setting that one variable is what turns measurement on, which keeps
  the decision a config change rather than a code change.
  ⚠️ **Do not set it until the legal half is done — blocked on legal, not engineering:**
  the aviso drafts are marked «BORRADOR v0.1 … No publicar», carry nine unfilled placeholders
  (`[RAZÓN SOCIAL]`, `[DOMICILIO]`, `[CORREO PRIVACIDAD]`, …), and have **no variante for a site
  visitor** — A is portal signup, B device linking, C operator PIN. A marketing-site visitor is
  not yet a customer, so none of them reaches one. See OQ Variante D in
  `docs/legal/aviso/README.md`. The checkout hook has no such blocker and can ship alone. Checkout hook in `probarGratis`; a portal-served 1×1
  pixel for the landing, so the marketing project needs no database secret. Ahead of the map,
  because `conversión` cannot exist until landing visits are counted. **Blocked by N-60.**
- [x] **N-59 · Phase 5 — the choropleth.** Natural Earth (CC0) geometry, pre-projected offline into
      SVG path strings so no map library, no tiles and no CSP change are needed. Two scale kinds:
      sequential for counts, diverging for rates.
- [~] **N-60 · Phase 6 — ADR-092 + aviso.** ADR-092 written; `aviso-integral.md` §3, §4.2 and §10
  updated (the «DESCRIBIR o eliminar» TODO is closed) and `privacy.md` gained its own section.
  **Remaining and not an engineering task:** variante D for site visitors, the placeholders, and
  the lawyer's review. Closes the open TODO at `docs/legal/aviso/aviso-integral.md:255`
  and publishes an aviso route on the landing. A consent banner is a legal judgement, not an
  engineering one — the cookie-less aggregate case is weak for one, but confirm.
- [x] **N-61 · Phase 7 — retention.** `geo_prune(400)` on the existing backoffice cron.
      Done: 2026-09-22 · 419bd02b · `xangarro.geo_prune` (`0033_geo_prune.sql`, SECURITY DEFINER, 90-day floor, execute only for `xangarro_admin`) called with `GEO_KEEP_DAYS = 400` from the digest cron. No test calls it yet; the `0033` prefix is shared with `0033_tenant_indexes.sql` (harmless, apply order sorts the full name).
- [ ] **N-62 · Cohort metrics from the fiscal address, not from IP.** For "which states retain best"
      or "where is LTV highest", use `businesses.codigo_postal` — already given by the tenant for
      fiscal purposes, already exposed through `xangarro.tenant_fiscal`. Self-declared, stable,
      better than an IP guess, and it adds no new collection.

**Not recommended without evidence:** "we see a trend in Zapopan, so buy ads in Zapopan." That
measures where we already won, favours big cities by construction, and at current volume cannot
distinguish signal from noise. The defensible loop is: attribution → conversion rate by state → a
matched-pair holdout test (advertise in one city, keep a comparable one dark) → then scale. Also
worth testing before geography: segmenting by **business type**, which likely predicts more for a
micro-POS than location does.

### N-63 … N-74 The console as a growth and operations instrument (2026-09-22)

> Rationale, priority order, the decision-trigger table and the research behind these live in
> `17-consola-crecimiento.md`; ADR-096 (accepted 2026-09-22) amends ADR-063 row 3 for N-63 and N-68. All post-launch:
> each has a **Trigger**. Surfaced by the owner's 2026-09-22 question on what the backoffice
> should do next.

### N-63 Negocio: MRR, churn, trial → paid

- [ ] Status · **Trigger:** B-10 webhooks write `billing.subscriptions` for the first paying tenant
      (the N-06 stub is retired). **Blocked by:** N-06 · **Blocks:** N-70, N-72
- **What:** `/negocio`. MRR (plus IVA excluded, centavos), MRR by plan, new / expansion /
  contraction / churned MRR per month, logo churn, trial → paid per weekly signup cohort, annual vs
  monthly mix. Read from a webhook-fed `billing_events` table — the console never calls Stripe.
- **Acceptance:** the four MRR movements reconcile to Stripe's own MRR for the month within one
  subscription; a cohort with zero trials renders "sin datos", not 0 %.
- **Amends** ADR-063 row 3 ("MRR dashboard not built — Stripe covers it"): see ADR-096.

### N-64 Activation funnel and weekly cohorts

- [ ] Status · **Trigger:** X-10 launch (real signups). **Blocked by:** N-57 · **Blocks:** N-70, N-74
- **What:** define **activated** as one product moment — first venta synced from a device or the
  operator view — and record `activated_at` on the business (server-side, from the first push).
  Funnel per weekly cohort: signup → wizard done → first venta (≤ 7 d) → active in week 2 → paid.
  `/campanas` gains the activation and paid columns, so a campaign is judged by what it converts,
  not by what it signs up. Shares the cohort query layer with N-62.
- **Acceptance:** a cohort younger than its window shows "aún no vence"; activation is computed
  from sync data, never from the phone's own estimate.

### N-65 Tenant timeline

- [ ] Status · **Trigger:** now (every source table exists). **Blocked by:** N-08
- **What:** on `/tenants/[id]`, one chronological feed: signup and wizard answers, devices linked
  and revoked, plan and override changes, flag allowlist changes, inbox items, B-18 rejections,
  billing events, migrations. Each entry links to its source screen. Read-only.
- **Acceptance:** a tenant with 500+ events pages by keyset (reuse `keyset.ts`); the feed is the
  union of existing tables — no new event table.

### N-66 Staff roles

- [ ] Status · **Trigger:** the second staff member is added, or before N-68 / N-71 start —
      whichever is first. **Blocked by:** N-05 · **Blocks:** N-68, N-71
- **What:** `staff_members.role ∈ { lector, operador, admin }`. Lector reads everything, writes
  nothing. Operador does inbox, migrations, overrides, trial extensions, "ver como". Admin also
  manages flags, staff and thresholds. Enforced in `requireStaff()` per action, not per page.
- **Acceptance:** every server action declares its minimum role; a lector calling a write action
  gets 403 and an audit row; `scripts/staff-cli.ts` sets the role.

### N-67 `/auditoria`

- [ ] Status · **Trigger:** now. **Blocked by:** N-05
- **What:** a reader over `staff_audit_log`: actor, action, tenant, before/after payload, at,
  origin. Filters by actor, action kind, tenant, date range; keyset paging; CSV export for an
  authority or the privacy audit (`docs/audits/privacidad-2026-09-22.md`).
- **Acceptance:** the log is append-only from this screen (no delete, no edit); an N-68 session
  shows as one row per action with both identities.

### N-68 "Ver como" — time-boxed, read-only impersonation

- [ ] Status · **Trigger:** X-10 launch and the first inbox item that could not be resolved from
      `/tenants/[id]` + N-65. **Blocked by:** N-66, N-67
- **What:** an operador opens the portal as a tenant's dueño in **read-only** mode for ≤ 30 min,
  with a reason (free text, required). The portal renders a persistent banner («Soporte de
  Xangarro está viendo tu cuenta»), refuses every write, and the tenant sees the session in
  Configuración → Seguridad afterwards. Implemented as a short-lived signed token minted by the
  console, never a shared session or raw credential.
- **Acceptance:** every page view during the session writes an audit row with both ids; a write
  attempted through the token is rejected server-side; the token dies at 30 min or on "salir".
- **Amends** ADR-063 row 3 ("impersonation not built"): see ADR-096.

### N-69 Flag lifecycle and percentage rollout

- [ ] Status · **Trigger:** N-09 `[x]`. **Blocked by:** N-09
- **What:** per flag: `kind ∈ { release, kill }`, `owner`, `expires_at`. A "flags vencidas" list on
  `/flags` and a line in the N-10 digest. Percentage rollout: `rollout_pct` evaluated server-side
  as `hash(business_id, flag_key) % 100 < pct`, so a business always lands on the same side;
  allowlist wins over percentage. Archived flags keep their history (append-only, as today).
- **Acceptance:** raising 10 % → 50 % never removes a business already in; a kill flag has no
  percentage and no expiry; a release flag past expiry is listed but keeps its last state.

### N-70 Decisiones

- [ ] Status · **Trigger:** N-63 `[x]`. **Blocked by:** N-07, N-63
- **What:** `/decisiones` renders the table in `17-consola-crecimiento.md` §4: signal, source,
  threshold, current value, 8-week trend, projected crossing date, and the decision it forces.
  Thresholds are rows in a `decision_thresholds` table, editable by admin, audited. A crossed or
  projected-within-30-days row also lands in the N-10 digest.
- **Acceptance:** the ADR-068 S2/S3 rows read the same numbers as the N-07 card; a signal with
  fewer than 4 weekly points shows "sin tendencia" instead of a date.

### N-71 Cobros: dunning, expiring trials, extend / credit

- [ ] Status · **Trigger:** first paying tenant. **Blocked by:** N-06, N-66
- **What:** `/cobros`: `past_due` and `grace` tenants with days remaining and last dunning email;
  trials ending in ≤ 7 days with activation state (N-64); pagos sin CFDI (N-33, moves here).
  Actions (operador): extend trial by N days, apply a one-time credit — both through the existing
  audited override path, both reflected in Stripe by B-10's writer, never by the console directly.
- **Acceptance:** an extension shows in Stripe within one webhook round-trip; the list is empty
  and says so when no tenant is past due.

### N-72 Cost per tenant

- [ ] Status · **Trigger:** N-63 `[x]`. **Blocked by:** N-63 · **Blocks:** N-70 infra-share row
- **What:** a monthly manual entry (admin) of the Vercel, Supabase, Resend and Facturapi invoices
  in centavos; the console divides by active tenants and by MRR. No vendor APIs in v1 — one form,
  one table, one line on `/negocio` and one row on `/decisiones`.
- **Acceptance:** a month with no entry shows "sin captura", never a stale ratio.

### N-73 Account health and NPS micro-survey

- [ ] Status · **Trigger:** 50 active tenants. **Blocked by:** N-64, N-47
- **What:** health = usage trend (N-07) + payment health (N-63) + support load (N-08) + last sync
  (N-46), bucketed verde / ámbar / rojo on `/tenants`. One-question NPS in the portal after the
  third corte de día, at most once per quarter, delivered through the ADR-060 `notices` channel;
  results and verbatims on `/negocio`, detractors as inbox items.
- **Acceptance:** the score is explainable — hovering shows the four inputs; the survey never
  shows on the phone (ADR-069).

### N-74 Promo and referral codes with attribution

- [ ] Status · **Trigger:** X-10 launch. **Blocked by:** N-64, N-01
- **What:** codes are Stripe promotion codes created from the console (admin), each tagged with a
  campaign; redemption lands in `/campanas` as its own origin and flows into N-64's funnel. A
  dueño's "recomienda Xangarro" link is a code with the referrer's business id, one month free for
  both once the referred tenant pays. Portal and email only — zero upsell in the app (ADR-069).
- **Acceptance:** a redeemed code shows its campaign, activation and paid state on `/campanas`; a
  referrer credit is applied through N-71's audited path.

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
N-06 + B-10 ──► N-63 ──► N-70, N-72 · N-57 ──► N-64 ──► N-73, N-74
N-05 ──► N-66 ──► N-68, N-71 · N-09 ──► N-69 · N-67 ──► N-68  (17-consola-crecimiento.md)
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
