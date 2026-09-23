# Track N (cont.) — the console as a growth and operations instrument

> **Origin:** the owner's question of 2026-09-22 — "what else should the backoffice do so it
> helps us grow the app (MKT), review operations and infra, and see when we have to make decisions
> to grow?" — answered with a code inventory of `apps/backoffice` and a research pass over current
> SaaS admin-panel, founder-metrics, feature-flag and ops-runbook guidance (§6). The tasks are
> **N-63 … N-74** in `09-next-features.md` §3 (same numbering, same status rules); this file holds
> the reasoning, the priority order and the decision-trigger table they implement. ADR-096 records
> the two amendments to ADR-063 this plan needs.
>
> Read `09-next-features.md` §1 rows 2–4 and 10 and ADR-063/ADR-068 before touching a task here.

---

## 1. What the console already is (2026-09-22)

Built and on `main`, all under `apps/backoffice/src/app/(consola)/`:

| Route                       | Shows                                                                                           | Task        |
| --------------------------- | ----------------------------------------------------------------------------------------------- | ----------- |
| `/`                         | DB capacity card, measured live (S1/S2/S3 triggers of ADR-068)                                  | N-07        |
| `/tenants`, `/tenants/[id]` | every business, plan, Stripe state, devices, last sync; members, entitlement, audited overrides | N-06        |
| `/uso`                      | usage this month vs plan limits (ADR-065)                                                       | N-07        |
| `/inbox`, `/inbox/[id]`     | support and escalation queue with assign/status                                                 | N-08        |
| `/flags`                    | platform flags, business allowlist, "afecta a N negocios", history                              | N-09        |
| `/mapa`, `/campanas`        | accesos/visitas/checkouts by state; signups per campaign                                        | N-55 … N-59 |
| `/migraciones`              | "Lo hacemos por ti" requests                                                                    | N-18        |

Auth is console-owned (ADR-080): password → server session → mandatory TOTP. Every mutation is
audited (`staff_audit_log`). **Staff is binary** — one allowlist, no roles.

Half-done and prerequisite to this plan: **N-09** (the portal still reads the compiled
`PLATFORM_AVAILABLE` constant, so a flag flip does not yet reach a device) and **N-10** (over-limit
and dormancy candidates are placeholders in the digest). Billing is a stub: `billing/port.ts`
answers `unknown` for everyone until B-10 writes `billing.subscriptions`.

## 2. What it cannot answer today

1. **Is the business working?** No MRR, churn, trial→paid, or activation anywhere. `/campanas`
   stops at signups. Row 3 of ADR-063 deferred an MRR dashboard to "Stripe covers it"; Stripe
   covers revenue, not revenue joined to activation, plan, state and campaign.
2. **What happened to this tenant?** The events exist (signup, devices, overrides, inbox items,
   rejections, payments) but live in seven tables and no view.
3. **When do we act?** ADR-068's S2/S3 thresholds are reviewed "monthly on the capacity card";
   nothing projects _when_ they will be crossed, and no other threshold (support load, infra cost
   share, conversion) is written down as a trigger with a current value.
4. **Who did what?** The audit log has no reader. Support cannot see a tenant's screen.
5. **Flag debt.** Flags have history but no owner, expiry or rollout percentage.

## 3. Priority order

The Yaro Labs rule fits CLAUDE.md §2.1: **build the view that replaces a query or engineering
request someone is already making; defer the rest.** In that order:

| Rank | Task       | Title                                            | Why first                                                |
| ---- | ---------- | ------------------------------------------------ | -------------------------------------------------------- |
| 0    | N-09, N-10 | finish the two half-done launch tasks            | N-69 and N-70 depend on them                             |
| 1    | N-63       | Negocio: MRR, churn, trial→paid                  | the question every other screen exists to serve          |
| 2    | N-64       | Activation funnel and weekly cohorts             | strongest pre-PMF signal; completes `/campanas`          |
| 3    | N-65       | Tenant timeline                                  | all data exists; replaces seven queries per support item |
| 4    | N-66       | Staff roles (lector / operador / admin)          | precondition for N-68 and N-71 writes                    |
| 5    | N-67       | `/auditoria` reader                              | the log exists; LFPDPPP posture                          |
| 6    | N-68       | "Ver como" (time-boxed, read-only impersonation) | fastest inbox resolution; amends ADR-063                 |
| 7    | N-69       | Flag lifecycle and percentage rollout            | flag debt is cheap now, expensive at 50 flags            |
| 8    | N-70       | Decisiones: threshold → current → trend → date   | the "when do we decide" ask, in one table                |
| 9    | N-71       | Cobros: dunning, expiring trials, extend/credit  | what makes a founder open Stripe by hand                 |
| 10   | N-72       | Cost per tenant                                  | feeds the infra-share trigger in N-70                    |
| 11   | N-73       | Account health + NPS micro-survey                | needs volume to mean anything                            |
| 12   | N-74       | Promo / referral codes with attribution          | growth lever once N-64 can measure it                    |

Already planned, unchanged, and slotted between them by their own triggers: **N-46** sync health,
**N-47** broadcasts, **N-48** dormancy, **N-62** cohorts by fiscal address.

## 4. Decision triggers (what N-70 renders)

Each row: the signal, its source, the threshold, and the decision it forces. The page shows the
current value, the 8-week trend, and the projected crossing date. A trigger fires on **trend**,
not only on breach.

| Signal                                      | Source                     | Threshold                          | Decision                                  |
| ------------------------------------------- | -------------------------- | ---------------------------------- | ----------------------------------------- |
| DB size, largest table, sync p95            | N-07 capacity card         | ADR-068 S2 (25 GB / 50 M / 800 ms) | start N-51                                |
| DB size or active tenants                   | N-07                       | ADR-068 S3 (500 GB / 10 000)       | start N-52                                |
| Infra cost ÷ MRR                            | N-72 ÷ N-63                | > 30 % for 2 months                | pricing, pooling or tier change           |
| Inbox items per 100 active tenants per week | N-08 counts                | rising 3 weeks, or > 5             | hire support or ship the self-serve fix   |
| Sync rejection rate                         | N-46 / B-18 summary        | > 1 % of pushed rows               | pause the current rollout (N-69 kill)     |
| Trial → paid                                | N-63                       | < 15 % for 2 cohorts               | onboarding work (N-16 wizard)             |
| Activation (first venta within 7 days)      | N-64                       | < 40 % for 2 cohorts               | onboarding / import work                  |
| Manual CFDIs per month                      | N-33 "pagos sin CFDI" list | ≥ 10–15                            | `CFDI_MODE = live` (ADR-070)              |
| Tenants over limit two months running       | N-10 digest                | any                                | "sugerir upgrade" task (ADR-065, already) |

**Owner decision 2026-09-22:** these research defaults (§6) are the starting thresholds for N-70.
The owner adjusts them in the page itself and every change is audited.

## 5. Constraints that apply to every task here

- **Read-heavy.** A console screen is a view over data the platform already produces. Every write
  action (extend trial, credit, impersonate, flip a flag) is role-gated (N-66) and audited.
- **Never query Stripe live.** N-63 and N-71 read webhook-derived tables (ADR-063). The webhook
  writer is B-10's `xangarro_billing` role.
- **Server-side evaluation only.** Flags keep reaching devices through the signed entitlement
  (ADR-053); rollout percentages are hashed on the server from the business id.
- **Zero upsell leaks.** Nothing here changes what the phone shows (ADR-069).
- **Small surface.** New routes: `/negocio`, `/decisiones`, `/auditoria`, `/cobros`. Everything
  else lands on an existing screen.

## 6. Research findings (2026-09-22)

- **Admin-panel scope.** MVP guidance converges on: account search and profile, plan changes,
  trial extensions and credits, account pause/close, a complete audit log — with per-account flags,
  support-ticket context and trial-conversion analytics deferred. Named anti-patterns: a single
  admin role, skipping audit logging, replicating the customer UI instead of showing operational
  data. (Yaro Labs, WorkOS.)
- **Impersonation.** Time-boxed (≤ 30 min), reason required, a visible banner, every action logged
  with both identities, never raw tokens or shared sessions. (WorkOS, LoginRadius.)
- **Audit entries** carry five fields: actor, action, resource, timestamp, origin. (Yaro Labs.)
- **Founder metrics.** For pre-PMF ($0–500 K ARR) lean on activation rate, time-to-value and
  feature adoption; MRR, logo churn and trial→paid weekly; NRR and CAC only once cohorts have
  history. Cohort views expose what blended churn hides. (Statspresso, Emilytics, ParallelHQ.)
- **Feature flags.** Keep flags short-lived with an owner and expiry; unique names; evaluate
  server-side; hash the user (here: business) for a consistent side; kill switches are a distinct
  kind from release flags; archive rather than delete. (Unleash, Statsig, LaunchDarkly.)
- **Infra cost.** 15–30 % of revenue is the healthy band for infra; cost-per-tenant next to
  revenue-per-tenant finds the unprofitable ones; alert on trend, not only breach. (AWS SaaS Lens,
  GainHQ.)
- **Billing ops.** Failed payments, dunning state, trials expiring in 7 days, and one-click
  extension/credit are the actions that otherwise happen in the Stripe Dashboard by hand.
  (Yaro Labs, Churnbuster.)
- **Support tooling.** A single account timeline (events, changes, tickets) and a health score
  from usage trend + payment health + support load. (Accoil, Pylon, Custify.)
- **Growth loop.** Changelog / in-app announcements (N-47), NPS micro-surveys, and promo or
  referral codes tied to attribution. (AnnounceKit, Userpilot, Rewardful.)

Sources: yaro-labs.com/blog/saas-admin-panel · workos.com/blog/user-management-for-b2b-saas ·
yaro-labs.com/blog/audit-logs-for-saas · statspresso.com/blog/b-2-b-saa-s-north-star-metrics-list ·
emilytics.com/articles/saas-startup-analytics/saas-metrics-to-track ·
parallelhq.com/blog/saas-metrics · docs.getunleash.io/guides/feature-flag-best-practices ·
statsig.com/perspectives/kill-switches-rollouts-feature-flags-overkill-techniques ·
aws.amazon.com/blogs/apn/optimizing-the-cost-of-your-saas-environment-with-the-aws-well-architected-saas-lens ·
gainhq.com/blog/saas-infrastructure-cost · yaro-labs.com/blog/stripe-subscription-management ·
churnbuster.io/articles/stripe-dunning · accoil.com/blog/customer-health-score ·
supportbench.com/saas-customer-support · announcekit.app · userpilot.com/blog/in-app-nps-survey
