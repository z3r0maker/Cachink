# Track B — Backend / Supabase (session "Backend+Portal", part 1)

> Owns the cloud: Postgres schema, RLS, auth, the `/api/v1/*` handlers, Stripe, entitlement signing,
> activation codes, email. The handlers physically live in `apps/portal` (Next route handlers, Q13)
> but are **thin adapters** over `packages/application` + `packages/data-pg`, so they can move to
> `apps/api` later (Z-04) without a rewrite.
>
> Prereqs: Track F and Track C merged to `main`. Read `02-contracts.md` fully — the handlers must
> pass its conformance suite (C-10). Tests: Vitest; DB tests run against local Supabase (`supabase start`).

---

### B-01 Provision Supabase (local + one hosted project) and secrets layout

- [ ] Status · **Blocked by:** F-04 · **Blocks:** B-03, P-01
- **Context:** No hosted project exists; `supabase/README.md` is placeholders. Q17: local Docker + one hosted project now; staging is X-01.
- **Steps:**
  1. `supabase init` at repo root if `supabase/config.toml` is missing; `supabase start`; commit `config.toml` (no secrets).
  2. Create hosted project `xangarro-prod` in `us-east-1`. Record project ref in `supabase/README.md` (ref is not secret; keys are).
  3. Secrets layout: `apps/portal/.env.local` (gitignored) with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `ENTITLEMENT_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` (or SMTP). Commit `apps/portal/.env.example` with every key and a one-line meaning.
  4. Enable Auth providers: email (magic link + password). Set site URL + redirect allow-list for `http://localhost:3000/**`.
- **Acceptance:** `supabase status` shows local stack; hosted project reachable; `.env.example` complete; nothing secret in git (`git grep -n "sb_secret\|sk_live\|sk_test"` → 0).
- **How to test:** commands above.

### B-02 `packages/data-pg`: Postgres Drizzle schema + drift test

- [~] Status · **Blocked by:** F-04, F-07 · **Blocks:** B-03, B-08, B-09, P-\*
  - 2026-09-17 · data-pg is used by the portal for every read and write. Integration suite 48 tests, run in CI by the new `db` job with `REQUIRE_DB=1` so it can no longer silently skip. **Still to do:** point it at a hosted project (B-01).
  - In progress: 2026-09-17 · `packages/data-pg` exists with the schema and the drift test.
    **Needs no Supabase instance** — Drizzle table definitions are ordinary code, which is why this
    could land before B-01.
  - **18 synced tables** across `tenant.ts` / `catalog.ts` / `ledger.ts` / `caja.ts`, bootstrapped
    from the device's SQLite schema so column names match **by construction**, then maintained by
    hand. `app_config` and `director_alerts` are deliberately absent: they are in
    `NEVER_SYNCED_TABLES`.
  - **7 portal-only tables** in `portal.ts` — `notices` (one table, two surfaces, ADR-060),
    `metas`, `business_members`, `devices`, `activation_codes`, `sync_rejections`, `sync_log` with
    its identity cursor. None appears in `scope.ts`, so none crosses the wire.
  - Types diverge where Postgres is better — `timestamptz` for audit stamps, real `bigint` for
    centavos — but **never the names**.
  - **The drift test is the point, and it was verified to fail.** 22 assertions: a cloud table for
    every contract table and vice versa, identical column names per table, no device-only table
    mirrored into Postgres, and a pinned list of the portal-only tables so adding one to
    `scope.ts` breaks the build and forces the full §11 checklist. Renaming a single column made
    four tables fail, which is the behaviour that matters: **the wire format addresses columns by
    name, so a silent rename writes a row with a missing field rather than rejecting it** — the
    worst failure mode this system has, and one both sides would otherwise compile through.
  - **Still to do:** the migrations themselves and RLS (B-03), which do need a database, plus
    repositories and the `sync_log` write-through the portal screens will call.
- **Context:** All 21 local schema files are `sqlite-core`; the portal needs `pg-core`. Authored once, kept in lockstep by a test. Two Postgres **schemas**: `tenant` (synced tables + `sync_log`, `sync_rejections`, `devices`) and `billing` (`business_members`, `activation_codes`, `subscriptions`, `fiscal_profiles`, `factura_requests`, `plans`). `businesses` lives in `tenant` (it syncs down) but is created by billing code.
- **Files:** `packages/data-pg/{package.json,drizzle.config.ts,src/schema/tenant/*.ts,src/schema/billing/*.ts,src/index.ts,tests/drift.test.ts}`.
- **Steps:**
  1. Scaffold like `packages/data` (name `@xangarro/data-pg`). deps: `drizzle-orm`, `postgres` (or `pg`) — latest.
  2. Mirror every **synced** table from `packages/data/src/schema` (per `02-contracts.md` §8) in `pg-core`: same column names (`snake_case`), same nullability, `TEXT` for ULIDs/ISO timestamps (keep string timestamps to match SQLite semantics; add a `server_seq BIGINT` + `received_at TIMESTAMPTZ` on every synced table, server-managed). `numeric(...bigint)` centavos → `BIGINT`. `users` mirrors the **contract** shape (`02-contracts.md` §5: `pin_hash`, `active`, no `email`, no role) — F-07 left `role`/`must_change_pin`/`recovery_password_hash`/`email` in the SQLite schema until A-17, so the drift test must carry an explicit, documented allow-list for those four columns that A-17 removes.
  3. `tenant.devices {id, business_id, name, platform, app_version, os_version, status active|revoked, activated_at, last_seen_at, last_push_at, last_pull_at, revoked_at}`.
  4. `tenant.sync_log` — append-only `{server_seq BIGSERIAL, business_id, table_name, row_id, op, device_id, received_at}`; `tenant.sync_rejections {id, business_id, device_id, table_name, row_id, client_seq, code, message, payload JSONB, received_at, resolved_at}`.
  5. `billing.plans {id, name, price_mxn_centavos, operators, devices, records_per_month, features JSONB, stripe_price_id, trial_days}` seeded from `PLAN_LIMITS`; `billing.subscriptions {id, business_id UNIQUE, plan_id, status trialing|active|past_due|grace|lapsed|free, stripe_customer_id, stripe_subscription_id, current_period_end, grace_until, cancel_at, updated_at}`; `billing.business_members {user_id UUID (auth.users), business_id, role owner|admin|viewer, PK(user_id,business_id)}`; `billing.activation_codes {code PK, business_id, issued_by UUID, issued_at, expires_at, redeemed_at, redeemed_device_id UNIQUE NULL, email}`; `billing.fiscal_profiles {business_id PK, rfc, razon_social, regimen_fiscal, uso_cfdi, codigo_postal, email_facturacion}`; `billing.factura_requests {id, business_id, stripe_invoice_id, status pending|issued|cancelled, xml_url, pdf_url, requested_at, issued_at}`.
  6. Drift test: import both schema barrels; for each synced table assert the **column name set** is equal (allowing the pg-only `server_seq`, `received_at`) and nullability matches. Fails with a diff.
- **Acceptance:** `pnpm --filter @xangarro/data-pg typecheck test` green; drift test fails if you add a column to `packages/data/src/schema/sales.ts` without mirroring it (prove it once in the Done line).
- **How to test:** as above.

### B-03 Migrations + RLS (replace hand-written SQL)

- [~] Status · **Blocked by:** B-02 · **Blocks:** B-05, B-08, B-09, P-02
  - 2026-09-17 · Local Supabase compat layer (`local/0000_supabase_compat.sql`, ADR-061); `NULLIF` fix for the 22P02 that made an empty `request.jwt.claims` error every RLS query; `CREATE ROLE … PASSWORD` moved out of `drizzle/`; `0002_membership_lookup.sql` SECURITY DEFINER function. **Still to do:** the hosted posture — `0001_rls.sql` is not pushable as written (grants name `xangarro_app`, policies have no `TO` clause), pinned by `supabase-compat.integration.test.ts`.
  - In progress: 2026-09-17 · migrations and RLS are written, **applied to a real Postgres 17, and
    proven**. `pnpm --filter @xangarro/data-pg db:up && pnpm --filter @xangarro/data-pg test:db`
    goes from nothing to 25 tables, 25 policies and 30 green tests.
  - **Unblocked from B-01.** Supabase is not needed to develop against the real schema — a plain
    `postgres:17-alpine` container applies the same SQL. Supabase adds auth, storage and the
    hosted project; it does not change the DDL.
  - `drizzle/0000_*.sql` is **generated** from the schema (`db:generate`), per CLAUDE.md §6's "no
    hand-written SQL". `drizzle/0001_rls.sql` is the documented exception: Drizzle Kit does not
    model policies.
  - RLS on all 25 tables with `FORCE`, one `tenant_isolation` policy each, keyed on
    `xangarro.current_business_id()` — a `STABLE` function reading the `business_id` JWT claim,
    with a `current_setting` fallback for tests. One function rather than twenty-five inlined
    claims, so a claim rename is one edit.
  - **The test found a defect that reading the SQL would never have shown: superusers bypass RLS
    entirely, and `FORCE` does not apply to them.** Run as `postgres`, every isolation assertion
    passed while protecting nothing. The migration now creates a non-superuser `xangarro_app` role
    (Supabase's `authenticated` plays this part in production) and the suite asserts
    `rolsuper = false AND rolbypassrls = false` **before** trusting any other assertion.
  - 8 RLS assertions: a tenant sees only its own rows, the other tenant sees only its own, a
    portal-only table isolates identically, a write claiming another tenant is **rejected rather
    than silently dropped**, an absent claim yields **no rows rather than all rows**, `FORCE` is
    on, and no table in `public` is left unprotected. Disabling RLS on one table fails four of
    them — verified.
  - **Still to do:** the seed (B-04), wiring `DATABASE_URL` into the portal so the screens read
    real rows instead of fixtures, and pointing this at a hosted Supabase project (B-01).
- **Context:** `supabase/migrations/0001_schema.sql` is hand-written (violates CLAUDE.md §6) and PowerSync-specific. Replace with `drizzle-kit generate` output committed into `supabase/migrations/` (so `supabase db push`/`db reset` still drive it) + a hand-written **policies** migration (RLS is not expressible in Drizzle schema).
- **Steps:**
  1. Delete `0001_schema.sql`'s PowerSync publication; regenerate the schema migration from `data-pg`. Keep `0002_bug_database.sql`.
  2. Policies migration: enable RLS on every `tenant.*` and `billing.*` table. Policies:
     - **Device**: `USING (business_id = (auth.jwt()->>'business_id') AND (auth.jwt()->>'kind') = 'device')` for SELECT/INSERT/UPDATE on UP + HYBRID tables; SELECT only on DOWN tables; nothing on `billing.*`.
     - **Portal member**: `USING (EXISTS (SELECT 1 FROM billing.business_members m WHERE m.business_id = <table>.business_id AND m.user_id = auth.uid()))` for SELECT on all tenant tables; INSERT/UPDATE on DOWN + HYBRID tables (edits) and `devices`, `sync_rejections.resolved_at`; `viewer` role is read-only (check `m.role <> 'viewer'` in WITH CHECK).
     - `billing.subscriptions`, `fiscal_profiles`, `factura_requests`: SELECT for members; writes only via service role (webhooks/server actions).
     - `billing.activation_codes`: no client access at all (service role only).
  3. Service-role bypass is used **only** in server code paths listed in B-07/B-10/B-11/B-13; document each in `apps/portal/src/server/README.md`.
  4. Indexes: `(business_id, server_seq)` on every synced table; `(business_id, updated_at)`; `sync_log(business_id, server_seq)`; `activation_codes(expires_at)`.
- **Acceptance:** `supabase db reset` applies cleanly; RLS tests in `packages/data-pg/tests/rls.test.ts`: device token can read own business rows and not another's; viewer cannot update a product; anon gets nothing. (Use `supabase-js` with hand-minted JWTs signed by the local JWT secret.)
- **How to test:** `supabase db reset && pnpm --filter @xangarro/data-pg test -- rls`.

### B-04 Seed + demo business for local dev and App Review

- [~] Status · **Blocked by:** B-03 · **Blocks:** P-\*, X-05
  - 2026-09-17 · Seed rewritten to satisfy its own domain schemas — ULID ids (was `p-tac`, `s1`), `'producto'`/`'semanal'` casing, two portal members (owner + viewer). `seed-contract.integration.test.ts` enforces it. **Still to do:** App Review data.
  - In progress: 2026-09-17 · `pnpm --filter @xangarro/data-pg db:seed` populates Taquería Don
    Pedro — the business every design file uses — with 6 ventas, 5 gastos, 6 productos, their
    inventory movements and one corte.
  - **Seeds through the app role**, so every insert passes the same RLS policy a request does.
    Seeding as a superuser would prove nothing about the policies.
  - Two schema rules the seed had to learn, and that the queries now honour: `cantidad` on
    `inventory_movements` is **always positive** with the direction carried by `tipo`, and
    `motivo` is required. The first mattered — summing `cantidad` raw would have counted every
    sale as a restock, so `lowStock` signs by `tipo`.
  - **Still to do:** an App Review demo tenant distinct from the dev seed, and employees/operators.
- **Steps:** `pnpm --filter @xangarro/data-pg seed` creates: auth user `demo@xangarro.mx` (password from `.env.example`), business "Tacos La Esquina", emprendedor subscription, 2 operators (PINs `1234`, `5678` — bcrypt), 20 products with icons, 3 clients, 1 active activation code `DEMOK7M3` (codes must match `^[A-HJ-NP-Z2-9]{8}$` — no 0/O/1/I; `DEMO0001` would be rejected by `ActivationCodeSchema`), 30 days of sales/expenses. Idempotent (re-run wipes and recreates that business only).
- **Acceptance:** seed runs in < 10 s; portal login as demo works (after P-02); code `DEMOK7M3` activates the app (after B-07).

### B-05 Auth: Supabase Auth config, membership claims hook, device-JWT minting

- [~] Status · **Blocked by:** B-03 · **Blocks:** B-07, P-02
  - 2026-09-17 · **Portal slice only**, provider-neutral (ADR-061): HMAC-signed session carrying the Supabase claim shape, `requireSession`/`requireMember`, `withSession` writing `request.jwt.claims`. **Still to do:** device-JWT minting and `requireDevice` (phone-side), and GoTrue if chosen.
- **Steps:**
  1. Custom Access Token Hook (Postgres function) adds `memberships` array from `billing.business_members` to portal JWTs.
  2. `apps/portal/src/server/auth/mint-device-token.ts`: signs `02-contracts.md` §2 claims with `SUPABASE_JWT_SECRET`, `exp` 365 d. Unit test: token verifies with the secret and PostgREST accepts it (integration test against local).
  3. `requireDevice(req)` middleware: verifies JWT, loads `tenant.devices` row, `401 DEVICE_REVOKED` if revoked, updates `last_seen_at` (throttled to once/min).
  4. `requireMember(req, businessId, minRole)` for server actions.
- **Acceptance:** tests: valid token passes; revoked → 401 with the contract error envelope; wrong `kind` → 401; membership hook shows in a decoded portal JWT.

### B-06 Entitlement signer + computation

- [~] Status · **Blocked by:** F-06, C-05, B-02 · **Blocks:** B-07, B-09, A-10 (public key hand-off)
  - 2026-09-17 · `computeEntitlement(businessId, subscription, now)` in `@xangarro/application`
    (8 tests: active, trialing, past_due inside and past grace, lapsed/none → free plan, unknown
    plan → `UNKNOWN_PLAN`, paid status without a period end → `MISSING_PERIOD_END`). The signer is
    `signEntitlement` in `server/device/credentials.ts`; `tests/entitlement-signer.test.ts` pins it
    byte-for-byte to the contract vector (shown to fail when it signs `JSON.stringify`).
    `GET /api/v1/entitlement` passes the contract's `GET /entitlement` conformance block against
    the real portal, and `devices.spec.ts` shows a validly signed token for a **revoked** device
    gets `401 DEVICE_REVOKED`. **Still to do:** step 1's production keypair (an ops step, with
    B-03), and the subscription is the fixture until B-10 writes `billing.subscriptions`.
- **Steps:**
  1. Generate Ed25519 keypair (`node -e` with `crypto.generateKeyPairSync('ed25519')`); private → `ENTITLEMENT_PRIVATE_KEY` env; public → `apps/mobile` env `EXPO_PUBLIC_ENTITLEMENT_PUBKEY` (hand to Track A via `02-contracts.md` — append the prod public key under a "Keys" note; dev key is the mock's).
  2. `computeEntitlement(subscription, plans, now)` in `packages/application` (pure): status `active|trialing` → plan limits; `past_due|grace` → same plan with `grace_until`; `lapsed|free` → **freelancer** (Q14). `valid_until = current_period_end`, `grace_until = valid_until + 7 d`.
  3. `signEntitlement(payload)` in `apps/portal/src/server/entitlement.ts` using `canonicalize` from contracts; must reproduce the C-05 test vector with the dev key.
- **Acceptance:** application tests (1 happy + 3 unhappy: past_due inside grace, lapsed, unknown plan → throws typed error); signature test vector passes.

### B-07 `POST /api/v1/activate`

- [~] Status · **Blocked by:** C-02, C-10, B-04, B-05, B-06, B-11 · **Blocks:** A-04 (real), X-02
  - 2026-09-17 · `POST /api/v1/activate` passes the **contract's own conformance suite run against the real portal** (`pnpm --filter @xangarro/portal test:conformance`, and in CI) — the same 4 assertions the mock satisfies. Redemption is one atomic UPDATE in `xangarro.redeem_activation_code` (SECURITY DEFINER, ADR-061 pattern); the concurrent-race test held 15/15, and a deliberate check-then-write version let one code bind two phones, so the test is shown to discriminate. The server parses its own response through `ActivateResponseSchema` rather than casting. **Still to do:** device-slot enforcement (`NO_DEVICE_SLOTS`, with B-12), `BUSINESS_SUSPENDED`, and the plan comes from the fixture until B-10.
- **Files:** `apps/portal/src/app/api/v1/activate/route.ts` (adapter) → `packages/application/src/use-cases/activate-device.ts` (logic, testable with in-memory repos in `packages/testing`).
- **Steps:** validate with `ActivateRequest`; in one transaction with `SELECT … FOR UPDATE` on the code: check exists/not expired/not redeemed/email matches (case-insensitive) → count active devices vs plan `devices` → insert `tenant.devices` → set `redeemed_at`, `redeemed_device_id` → mint token → compute+sign entitlement → bootstrap payload (`/sync/pull?since=0` internals, reuse B-09's query). Error mapping per §3.
- **Acceptance:** application tests: happy; expired; used; slots full; email mismatch. Conformance suite (C-10) green against the dev server incl. the **concurrent redemption** test (exactly one 200).
- **How to test:** `pnpm --filter @xangarro/application test -- activate-device`; `API_BASE=http://localhost:3000 pnpm --filter @xangarro/contracts test -- conformance/activate`.

### B-08 `POST /api/v1/sync/push`

- [x] Status · **Blocked by:** C-03, C-06, C-10, B-03, B-05 · **Blocks:** A-06 (real), P-11, X-02
  - Done 2026-09-17 (ADR-078). The rules are `ApplyPushUseCase` in `@xangarro/application` (12
    tests over an in-memory store that, like Postgres, refuses writes outside the row's savepoint);
    Postgres is `server/sync/pg-push-store.ts`. The contract's `sync.test.ts` passes **in full
    against the real portal**, and `e2e/sync.spec.ts` covers what conformance cannot: money stored
    in centavos, a rejection shown on Sincronización, a HYBRID client reaching a second phone, and
    both cross-tenant paths → `DUPLICATE_CONFLICT` (audit DB-SYNC-05).
  - Found on the way: with postgres-js a savepoint only isolates statements run on **its own**
    handle — the first run lost a whole batch to one bad row. And the cloud keyed `monto_centavos`
    as `montoCentavos` on `sales`/`expenses` while the device says `monto`; drift now compares
    property keys, not only column names.
  - Push's top-level `serverSeq` is the tenant cursor at commit and is **informational**: UP rows
    are not in the pull stream, so A-06 must take its pull cursor from pull responses only.
- **Files:** `apps/portal/src/app/api/v1/sync/push/route.ts` → `packages/application/src/use-cases/apply-push.ts` + `packages/data-pg/src/repositories/sync-push-repository.ts`.
- **Steps:** per delta: scope check (`isPushable`), zod row validation, `business_id === token.business_id`, FK checks (product/user/client exist in that business) → upsert `ON CONFLICT (id) DO UPDATE` **only if** existing `business_id` matches (else `DUPLICATE_CONFLICT`) → append `sync_log` → collect `server_seq`. Rejections → `sync_rejections` (upsert by `(device_id, table_name, row_id)` so a retry updates instead of duplicating) and returned. Process in one transaction per batch but **never** abort the batch for a per-row failure (use savepoints per row). Update `devices.last_push_at`.
- **Acceptance:** application tests: all accepted; one FK missing → that row rejected, others accepted; hybrid update → rejected; business mismatch → rejected non-retryable; re-push same rows → same `server_seq`. Conformance green.

### B-09 `GET /api/v1/sync/pull`

- [x] Status · **Blocked by:** C-04, C-06, B-03, B-05, B-06 · **Blocks:** A-06 (real), X-02
  - Done 2026-09-17 (ADR-078). Serves the **committed** per-tenant cursor, read before the tables
    (DB-SYNC-01; `/activate` no longer serves `max(seq)`). Pages **one ordered stream** of
    `sync_log` rather than 5 000 per table (DB-SYNC-04); a truncated page's `serverSeq` is its last
    seq, shown by a 5 050-entry backlog arriving in two pulls. `acknowledgedThrough` is stored on
    the device row. **Still open:** a `hasMore` flag needs a C-04 amendment; until then the phone
    pulls again while a pull returns rows.
- **Steps:** for each DOWN + HYBRID table: rows where `business_id = token.business_id AND server_seq > since` (limit 5 000 per table; if truncated set `server_seq` to the max returned so the app pages). `acknowledged_through` = `MAX(server_seq) FROM sync_log WHERE device_id = token.device_id`. Include current signed entitlement and tenant `feature_flags` (from `businesses.feature_flags JSONB`). Update `devices.last_pull_at`.
- **Acceptance:** tests: since=0 returns everything; since=N returns only newer incl. tombstones; `acknowledged_through` correct after a push; paging when > 5 000. Conformance green.

### B-10 Stripe: products/prices, Checkout session, webhook, subscription state machine

> **Amended 2026-09-17 by Track N:** the webhook connects as a dedicated least-privilege Postgres role `xangarro_billing` (billing tables +
> one SECURITY DEFINER entitlement function) — **never the service-role key in the portal** (ADR-063,
> N-26 SEC-SEC-01; also amends B-01's env list). Annual prices and a 14-day trial on **both** paid tiers
> with no card up front; card on both intervals, SPEI on annual only, **no OXXO** (unsupported by Stripe for subscriptions) — see N-01 (ADR-067). CFDI per payment is automated by N-33 (ADR-070).

- [ ] Status · **Blocked by:** B-02, B-03 · **Blocks:** P-03, P-10, X-02
- **Steps:**
  1. Stripe test mode: 1 product "Xangarro" with 2 recurring prices (Emprendedor 19900 MXN, MiPyME Pro 39900 MXN; `trial_period_days: 14` applied at Checkout for Pro only). Enable payment methods: card, **OXXO**, **SPEI** (customer balance / bank transfer for MX). Record price IDs in `billing.plans`.
  2. `createCheckoutSession(businessId, planId)` server action: mode `subscription`, `customer_email`, `client_reference_id = business_id`, `success_url = /onboarding?session_id=…`, `cancel_url = /suscripcion`.
  3. Webhook `POST /api/stripe/webhook` (raw body, signature verified): `checkout.session.completed` → set `stripe_customer_id`, `stripe_subscription_id`, status; `invoice.paid` → `active`, `current_period_end`; `invoice.payment_failed` → `past_due`, `grace_until = now + 7 d`; `customer.subscription.updated/deleted` → map status; when `now > grace_until` and unpaid → `lapsed` (also a daily cron/`pg_cron` job to flip `past_due` → `lapsed`). Idempotent by `event.id` (store processed ids).
  4. OXXO/SPEI: payment may be `processing` for hours/days → keep `active` until `payment_failed`/expiry; that is what the grace period exists for.
  5. Customer Portal (Stripe-hosted) link for plan change / cancel / payment method.
- **Acceptance:** `stripe listen --forward-to localhost:3000/api/stripe/webhook` + `stripe trigger invoice.paid` etc. update `billing.subscriptions` as specified; unit tests for the state machine (1 happy + 3 unhappy: duplicate event ignored, unknown subscription, failed payment inside grace keeps entitlement plan).

### B-11 Activation code issuance (portal + Studio-callable)

- [~] Status · **Blocked by:** B-03 · **Blocks:** B-07, P-06
  - 2026-09-17 · **Portal half:** `generarCodigo` mints from `crypto.randomInt` with the alphabet derived from `ACTIVATION_CODE_REGEX`; regenerating expires every other unredeemed code (E2E asserts exactly one live code — verified it fails with two). **Still to do:** Studio-callable issuance, redemption (B-07).
- **Steps:** Postgres function `billing.issue_activation_code(business_id, email, issued_by)` → generates 8 chars from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, `expires_at = now() + 48 h`, returns the code; security definer, executable by members with role ≠ viewer and by service role. Server action wrapper + email (B-14). Also `billing.revoke_device(device_id)` (sets status, `revoked_at`; frees the slot).
- **Acceptance:** SQL tests: alphabet has no `0 O 1 I`; uniqueness under 10 000 generations; viewer call → permission error.

### B-12 Device revocation + slot accounting

- [x] Status · **Blocked by:** B-11, B-05
  - Done: 2026-09-17 · Slot enforcement in `/activate` (`NO_DEVICE_SLOTS`, 402) and revocation from the portal (Revocar, behind a confirmation carrying the plan's copy). The task's acceptance is an E2E: at the limit a new phone is refused, Revocar frees a slot, and **the same code** then succeeds — proving the refusal rolled the claim back rather than burning it. Two races, both shown to discriminate: the same code redeemed twice (atomic UPDATE, B-07), and two _different_ codes competing for the last slot, closed by locking the business row — without the lock it failed 12/12, two phones taking one slot every time. `requireDevice`/`401 DEVICE_REVOKED` is phone-side and stays with B-05.
- **Steps:** `activeDeviceCount(business_id)` = devices with status `active`; used by B-07 and P-06. Revoked device's next API call → `401 DEVICE_REVOKED` (B-05). Its unsynced rows: lost on that phone unless re-activated — document in P-06 UI copy ("Revocar borra el acceso, no los datos ya sincronizados").
- **Acceptance:** application test: activate → revoke → activate again with a new code succeeds and slot count is unchanged.

### B-13 Operator management writes (users) + plan limit

- [x] Status · **Blocked by:** F-07, B-03 · **Blocks:** P-05
  - Done 2026-09-17: `CrearOperador` / `RestablecerPinOperador` / `DesactivarOperador` in
    `@xangarro/application` (13 tests), `users.active` via `0001_users_active.sql` with its
    old → new test, `pgUsersRepository` appending to `sync_log`, and the `/equipo` dialogs.
    `operatorLimit` still comes from `PLAN_FIXTURE` until B-10 gives each business its plan.
  - **Amended (ADR-072):** the NIP is exactly 4 digits, not 4–6.
- **Steps:** server actions `createOperator(businessId, {nombre, pin})` → bcrypt (cost 10) server-side, `active=true`, bumps `server_seq` (insert into `sync_log`); `setOperatorPin`; `deactivateOperator`; enforce `count(active) < plan.operators` → typed error `OPERATOR_LIMIT`. Every write appends to `sync_log` so devices pull it.
- **Acceptance:** application tests: happy; limit reached; PIN not 4–6 digits; deactivating the last active operator is allowed but returns a warning flag (portal shows it).

### B-14 Transactional email

- [ ] Status · **Blocked by:** B-01 · **Blocks:** P-03, P-06
- **Steps:** Resend (or Supabase SMTP) with templates: `activation-code` (code, expiry, 3-step how-to), `welcome`, `payment-failed` (grace explanation), `factura-issued`. Spanish (es-MX). From `hola@xangarro.mx` (domain verification in L-04).
- **Acceptance:** dev sends land in Resend test inbox; templates snapshot-tested.

### B-15 Retention acknowledgment support

- [ ] Status · **Blocked by:** B-08, B-09
- **Context:** Q9 — the phone may purge only rows the server has durably stored. `acknowledged_through` in pull (B-09) + `server_seq` per accepted row in push (B-08) already give this. This task adds the **integration test** proving a row acknowledged in push is ≤ `acknowledged_through` on the next pull, and that a row rejected is never acknowledged.
- **Acceptance:** that test, green.

### B-16 Back-office: Studio saved queries + support functions

- [ ] Status · **Blocked by:** B-03, B-11
- **Steps:** commit `supabase/studio/*.sql` (copied into Studio's saved queries manually): subscriptions by plan/status; businesses with unresolved rejections; devices not seen in 7 days; activation codes expiring today. Functions: `billing.reissue_code(business_id)`, `billing.resend_magic_link(email)` (calls Auth admin API via edge function). README `docs/ops/back-office.md` with the runbook (Q16).
- **Acceptance:** each query runs on the seed DB; runbook reviewed.

### B-17 Rate limiting + protocol check middleware

> **Amended 2026-09-17 (N-26 audit, SEC-DEV-01):** `/activate` is rate-limited per IP and per
> code/QR token **before** any device token exists (5 failures / 15 min → 15-min lockout), with one
> generic error. See C-14.

- [ ] Status · **Blocked by:** B-05
- **Steps:** `X-Xangarro-Protocol` check → `426`; per-device token bucket (60/min) in Postgres or Upstash (prefer Postgres `billing.rate_limits` to avoid a new vendor at this size); `429` + `Retry-After`.
- **Acceptance:** conformance tests for 426 and 429.

### B-18 Backend observability

- [ ] Status · **Blocked by:** B-07…B-09
- **Steps:** Sentry (already used by the app via `EXPO_PUBLIC_SENTRY_DSN`) for the portal + API; structured logs per request `{device_id, business_id, endpoint, ms, accepted, rejected}`; a daily digest query for rejection codes. No PII in logs (no emails, no PINs).
- **Acceptance:** a forced error appears in Sentry with `business_id` tag; a push logs one line.
