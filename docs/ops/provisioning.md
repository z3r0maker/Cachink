# Hosted provisioning (B-01)

Step by step for the owner: from an empty Supabase project to the portal and
the admin console answering on their domains. Nothing here needs a Supabase
API key — auth is ours (ADR-079/080), the Data API is off (SEC-DATA-01), and
every app connects to Postgres with its **own restricted login role**.

| Fact             | Value                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase project | ref `jijggmddzacwcldwnmzj`, region **us-west-2 (Oregon)**, compute Nano                                                                                |
| Vercel functions | **pdx1** (Portland), both projects — pinned in each app's `vercel.json`                                                                                |
| Vercel projects  | repo `z3r0maker/Cachink`: **xangarro-web** (root `apps/web`, `app.xangarro.mx`), **xangarro-backoffice** (root `apps/backoffice`, `admin.xangarro.mx`) |
| Region decision  | Owner decision 2026-09-18: keep Oregon, pin Vercel to pdx1 (README Q17)                                                                                |

**Rule for every step:** secrets go from the terminal or password manager
straight into `packages/data-pg/.env.local` (gitignored) or the Vercel
dashboard. Never into chat, tickets, commits or screenshots.

## 1. Supabase project settings

1. **Connection strings** — Dashboard → **Connect**. You need three shapes of
   the same database:

   | Name                   | Host : port                                | User                            | Use                               |
   | ---------------------- | ------------------------------------------ | ------------------------------- | --------------------------------- |
   | Direct                 | `db.jijggmddzacwcldwnmzj.supabase.co:5432` | `postgres`                      | migrations (IPv6 only, see below) |
   | **Session pooler**     | `aws-0-us-west-2.pooler.supabase.com:5432` | `postgres.jijggmddzacwcldwnmzj` | migrations, `pnpm staff` (IPv4)   |
   | **Transaction pooler** | `aws-0-us-west-2.pooler.supabase.com:6543` | `<role>.jijggmddzacwcldwnmzj`   | app runtime only, never DDL       |

   Copy the host from the dashboard (it may read `aws-1-…`). The pooler
   username for a custom role is always `<role>.<ref>`, e.g.
   `xangarro_app.jijggmddzacwcldwnmzj`. The Direct host is **IPv6-only**
   unless the paid IPv4 add-on is on, and many home networks cannot reach it:
   if Direct fails to connect, use the Session pooler — it supports IPv4 and
   DDL. The Transaction pooler (6543) is for the apps only; the migrate script
   refuses it.

2. **Data API off** — Settings → **Data API** → disable it (or at least remove
   every schema from "Exposed schemas"). The migrations also revoke the grants
   it would use (`hosted/0000_revoke_data_api_grants.sql`), so turning it back
   on by mistake exposes nothing.
3. **Supabase Auth unused** — Authentication → Sign In / Providers: turn off
   "Allow new users to sign up" and every provider. Our login writes
   `auth.users` itself; GoTrue must not create rows there behind our back.
4. **SSL** — Settings → Database → **Enforce SSL on incoming connections**:
   on. Every URL below carries `?sslmode=require`.
5. **Backups / PITR (audit DB-OPS-01, high)** — the project currently has
   **no backups**. Daily backups need the **Pro** plan; point-in-time recovery
   is a paid **PITR add-on** on top of it. Upgrade and run a restore drill
   **before the first paying customer** (X-10); until then treat the database
   as unrecoverable and keep `Export all data` habits on the owner side.

## 2. Generate the secrets

Run each on your own machine and paste the output straight into its
destination (§3 for the role passwords, §7 for the rest).

| Secret                                                                     | Command                                          | Goes to                       |
| -------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| `XANGARRO_APP_PASSWORD`, `…_BILLING_…`, `…_METERING_…`, `…_ADMIN_PASSWORD` | `openssl rand -base64 32` (one each)             | `packages/data-pg/.env.local` |
| `DEVICE_TOKEN_SECRET`                                                      | `openssl rand -base64 32`                        | portal                        |
| `ENTITLEMENT_PRIVATE_KEY` + public key                                     | `pnpm --filter @xangarro/web entitlement:keygen` | portal / mobile EAS env       |
| `CRON_SECRET` (one per project)                                            | `openssl rand -base64 32`                        | portal, admin                 |
| `ADMIN_INGEST_SECRET` (same value in both)                                 | `openssl rand -base64 32`                        | portal, admin                 |
| `ADMIN_TOTP_KEY`                                                           | `openssl rand -base64 32`                        | admin                         |

`entitlement:keygen` prints two lines: `ENTITLEMENT_PRIVATE_KEY` (64 hex, the
format `apps/web/src/server/device/credentials.ts` reads) for the portal
project, and `EXPO_PUBLIC_ENTITLEMENT_PUBKEY` (64 hex, public) for the phone
app's **EAS production env** (`apps/mobile`, contract §6). The phone verifies
every entitlement with that public key, so a release built with another one
rejects them all. Record the public key under a "Keys" note in
`docs/plan/02-contracts.md` (it is not secret); never the private one.

## 3. Migrate the database

The inputs live in `packages/data-pg/.env.local` (gitignored; real
environment variables override it):

```bash
SUPERUSER_URL=postgres://postgres.jijggmddzacwcldwnmzj:<postgres password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
XANGARRO_APP_PASSWORD=
XANGARRO_BILLING_PASSWORD=
XANGARRO_METERING_PASSWORD=
XANGARRO_ADMIN_PASSWORD=
```

(Direct works too: `postgres://postgres:<pw>@db.jijggmddzacwcldwnmzj.supabase.co:5432/postgres?sslmode=require`.)

```bash
pnpm --filter @xangarro/data-pg db:migrate:hosted --dry-run   # read everything it prints
pnpm --filter @xangarro/data-pg db:migrate:hosted             # for real
pnpm --filter @xangarro/data-pg db:migrate:hosted --dry-run   # must say "0 migration(s) would run"
```

What it does, in order (`packages/data-pg/scripts/migrate-hosted.ts`):

1. Takes an advisory lock, so two runs cannot interleave. Refuses a database
   that has the schema but no ledger (migrated by something else).
2. **Preflight** — prints `BLOCKER` lines, each with the SQL that fixes it,
   and writes nothing if there is one (the dry run shows them too and exits 1):
   the migrating role must have CREATEROLE; must bypass RLS, because it will
   own every `xangarro.*` SECURITY DEFINER function and those read FORCE-RLS
   tables — `businesses`, `business_members`, `devices`, `portal_sessions` —
   (DB-RLS-03); must SELECT and UPDATE `auth.users` (login lookup, link
   issue, password reset); `auth.users` must be GoTrue-shaped (`id uuid`,
   `email`, `encrypted_password`, …); and, while `admin/0004` is pending, it
   must hold `auth` grants WITH GRANT OPTION. The fixes for the first three
   need a superuser: on Supabase that is a support ticket.
3. **Roles** — creates or updates `xangarro_app`, `xangarro_billing`,
   `xangarro_metering`, `xangarro_admin` as LOGIN roles with your passwords
   (sent as SCRAM verifiers, so no password lands in Supabase's DDL log), and
   sets DB-CONN-01's bounds: `statement_timeout` 5 s / 10 s / 60 s / 15 s,
   `idle_in_transaction_session_timeout` 10 s. Re-running rotates nothing
   unless you changed a password.
4. **Migrations** — ledger table `xangarro_ops.migrations` (name, checksum,
   applied_at); applies, in order, only the files it lacks:
   `packages/data-pg/hosted/*.sql`, then `packages/data-pg/drizzle/*.sql`,
   then `apps/backoffice/src/server/db/migrations/*.sql`. Each file and its ledger row
   commit in one transaction (`lock_timeout` 10 s); the first error rolls
   that file back and stops. An applied file whose bytes changed, or that
   disappeared, is a hard error: never edit an applied migration, add one.
5. **Posture** — `WARNING` lines: SECURITY DEFINER owners without BYPASSRLS or
   without a pinned `search_path`, definer functions executable by
   `anon`/`authenticated`, login roles that can't log in, have dangerous
   attributes, inherit another role or lack timeouts, `public` tables without
   RLS, anything `anon`/`authenticated` can touch.

**Expected warning today:** `xangarro_app cannot INSERT into / SELECT email
from auth.users` — portal **sign-up will fail** on hosted until the portal
owner moves it behind a SECURITY DEFINER function or approves the grants
(§4). Everything else should be clean.

Proven locally with `pnpm --filter @xangarro/data-pg db:migrate:hosted:selftest`
(throwaway `postgres:17` container shaped like Supabase: dry run, fresh run,
SCRAM logins and timeouts, idempotent re-run, new file, rollback of a failing
file, preflight blocker, checksum drift). Every later migration: run
`db:migrate:hosted` **before** deploying the code that needs it.

## 4. What the hosted run applies from `local/` — and what it does not

`packages/data-pg/local/0000_supabase_compat.sql` makes a plain Postgres look
like Supabase for local work and CI. It is **never applied on hosted**; each
statement's fate:

| Statement in `local/0000`                                                                 | Hosted  | Why                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREATE SCHEMA IF NOT EXISTS auth`                                                        | skip    | The platform's; preflight checks `auth.users` exists.                                                                                                                                                                                                                                         |
| `CREATE ROLE anon / authenticated / service_role`                                         | skip    | The platform's. Never created or altered (owner rule).                                                                                                                                                                                                                                        |
| `CREATE ROLE xangarro_app / _billing / _metering LOGIN PASSWORD '…'`                      | replace | Passwords published in the repo. The script creates them (and `xangarro_admin`) from your env **before** any migration, so drizzle/admin's `CREATE ROLE … NOLOGIN` fallbacks never fire.                                                                                                      |
| `GRANT authenticated TO xangarro_app`                                                     | skip    | Allowed by the owner, but not needed: no policy is `TO authenticated`, so membership would only add inherited privileges. The posture check flags any membership.                                                                                                                             |
| `CREATE OR REPLACE FUNCTION auth.jwt / uid / role / email`                                | skip    | Would overwrite the platform's own functions (owner rule). No migration calls them.                                                                                                                                                                                                           |
| `CREATE TABLE IF NOT EXISTS auth.users`                                                   | skip    | GoTrue's table exists with the same columns and more; preflight checks the shape the portal uses.                                                                                                                                                                                             |
| `GRANT USAGE ON SCHEMA auth …`, `GRANT EXECUTE ON auth.* …`                               | skip    | Platform roles already have them; `xangarro_app` calls no `auth.*` function.                                                                                                                                                                                                                  |
| `GRANT … ON auth.users TO service_role`                                                   | skip    | The platform's.                                                                                                                                                                                                                                                                               |
| `REVOKE SELECT` + column `GRANT SELECT (…), INSERT, UPDATE ON auth.users TO xangarro_app` | skip    | Owner rule: no `auth.users` grants from the compat file on hosted. **Consequence:** portal sign-up (`server/onboarding/signup-store.ts`) has no access — the posture WARNING above. Sign-in, links and reset are unaffected: they run through SECURITY DEFINER functions owned by `postgres`. |

Added on hosted only: `hosted/0000_revoke_data_api_grants.sql` — revokes
Supabase's default ALL grants to `anon`/`authenticated`/`service_role` on
`public` (SEC-DATA-01), before drizzle creates anything.

Also **not** applied: `supabase/migrations/*` (the legacy mobile MVP set —
DB-MIG-02: `0001_schema.sql` fails to apply and conflicts with data-pg). Do
not run `supabase db push` against this project.

`admin/0004` grants `SELECT (id, email) ON auth.users TO xangarro_admin` —
that is an admin migration, not the compat file, so it runs; it needs the
grant option preflight checks.

## 5. Connection strings for the apps

Build each from its role and the password you generated:

```
postgres://<role>.jijggmddzacwcldwnmzj:<password>@aws-0-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require
```

| Variable                | Project | Role                |
| ----------------------- | ------- | ------------------- |
| `DATABASE_URL`          | portal  | `xangarro_app`      |
| `BILLING_DATABASE_URL`  | portal  | `xangarro_billing`  |
| `METERING_DATABASE_URL` | portal  | `xangarro_metering` |
| `DATABASE_URL`          | admin   | `xangarro_admin`    |

**Transaction pooler needs `prepare: false`** (DB-CONN-01): Supavisor in
transaction mode does not support prepared statements, and
`packages/data-pg/src/client.ts` `createDb` still uses postgres.js's default
`prepare: true`. Until the portal owner lands that change (below), use the
**Session pooler** URL (same host, port **5432**, same `<role>.<ref>` user)
for all four: correct, but each warm function holds its connections, so the
Nano pool fills sooner. Switch to 6543 once the change is on main.

The change, in `createDb`:

```ts
const sql = postgres(url, { max: 5, prepare: false, onnotice: () => undefined });
```

(`prepare: false` is safe on every URL — local, Session and Transaction
pooler. Consider `max: 1`–`2` per serverless instance on Nano.)

## 6. First staff member, Stripe, entitlement key

- **Staff** (the console cannot create staff; ADR-080). With the **postgres**
  Session-pooler URL (it must bypass RLS on the staff tables):

  ```bash
  read -rs PASSWORD && printf %s "$PASSWORD" | \
    DATABASE_URL='<SUPERUSER_URL from §3>' pnpm --filter @xangarro/backoffice staff create \
      --email you@xangarro.mx --nombre "Tu nombre"
  ```

  They enrol the authenticator at first sign-in on `admin.xangarro.mx`.

- **Stripe — test mode only (B-10).** `STRIPE_SECRET_KEY=sk_test_… pnpm
--filter @xangarro/web stripe:seed` creates the products, the four prices
  and the IVA rate (idempotent). Then Dashboard (test mode) → Developers →
  Webhooks → add `https://app.xangarro.mx/api/stripe/webhook` with
  `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.paid`, `invoice.payment_failed`; its signing secret is
  `STRIPE_WEBHOOK_SECRET`.
- **Entitlement key** — §2.

## 7. Vercel

Both projects: Settings → General → Root Directory as in the facts table;
Settings → Functions shows **pdx1** (from `vercel.json`). Set variables for
**Production** only, marked Sensitive where secret: Preview deployments would
otherwise reach the production database (staging comes with X-01). Every key
and its meaning is in `apps/web/.env.example` and `apps/backoffice/.env.example`
(CI fails if those drift from the code).

| Variable                                                               | Portal | Admin | Notes                                                                                                                                                   |
| ---------------------------------------------------------------------- | :----: | :---: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                         |   ✓    |   ✓   | §5 — different roles                                                                                                                                    |
| `BILLING_DATABASE_URL`, `METERING_DATABASE_URL`                        |   ✓    |       | §5                                                                                                                                                      |
| `DEVICE_TOKEN_SECRET`, `ENTITLEMENT_PRIVATE_KEY`                       |   ✓    |       | §2                                                                                                                                                      |
| `PORTAL_URL`                                                           |   ✓    |       | `https://app.xangarro.mx`                                                                                                                               |
| `CRON_SECRET`                                                          |   ✓    |   ✓   | one value per project                                                                                                                                   |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` |   ✓    |       | test mode                                                                                                                                               |
| `CFDI_MODE`                                                            |   ✓    |       | `off` until Facturapi is set up (then `FACTURAPI_API_KEY`, `CFDI_LUGAR_EXPEDICION`; `FACTURAPI_BASE_URL`, `CFDI_PRODUCT_KEY`, `CFDI_UNIT_KEY` optional) |
| `RESEND_API_KEY`                                                       |   ✓    |   ✓   | one sending-only key per project (email.md)                                                                                                             |
| `EMAIL_FROM`, `EMAIL_REPLY_TO`                                         |  opt.  | opt.  |                                                                                                                                                         |
| `ADMIN_INGEST_URL`                                                     |   ✓    |       | `https://admin.xangarro.mx/api/internal/support-items`                                                                                                  |
| `ADMIN_INGEST_SECRET`                                                  |   ✓    |   ✓   | same value in both                                                                                                                                      |
| `SENTRY_DSN`                                                           |  opt.  |       |                                                                                                                                                         |
| `ADMIN_TOTP_KEY`                                                       |        |   ✓   | §2; rotating it forces every staff member to re-enrol                                                                                                   |
| `ADMIN_BASE_URL`                                                       |        | opt.  | default `https://admin.xangarro.mx`                                                                                                                     |
| `DIGEST_TO`, `ALERT_WEBHOOK_URL`                                       |        | opt.  |                                                                                                                                                         |

Redeploy both projects after setting variables (they are read at runtime,
but a deploy guarantees every function sees them).

## 8. DNS

At the DNS host of `xangarro.mx`:

| Record                        | Type   | Value                                                                                                     |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `app.xangarro.mx`             | CNAME  | `cname.vercel-dns.com` (add the domain to the **xangarro-web** project first; use the value Vercel shows) |
| `admin.xangarro.mx`           | CNAME  | `cname.vercel-dns.com` (**xangarro-backoffice** project)                                                  |
| Resend (`send.`, DKIM, DMARC) | MX/TXT | exactly as `docs/ops/email.md` §1                                                                         |

## 9. Smoke checks

1. `pnpm --filter @xangarro/data-pg db:migrate:hosted --dry-run` →
   `0 migration(s) would run`, preflight ok, only the sign-up warning.
2. `curl -s https://jijggmddzacwcldwnmzj.supabase.co/rest/v1/businesses` →
   not a list of rows (Data API disabled).
3. `curl -I https://app.xangarro.mx` and `https://admin.xangarro.mx` → 200 or
   a redirect to sign-in, over HTTPS; response header `x-vercel-id` contains
   `pdx1`.
4. `curl -i https://app.xangarro.mx/api/cron/usage` without the bearer → 401 (503 if `CRON_SECRET` is unset),
   never 200. With `Authorization: Bearer $CRON_SECRET` → 200.
5. Stripe Dashboard → the webhook → **Send test event** → 200.
6. Admin: sign in as the staff member from §6, enrol TOTP, open Tenants.
7. Portal: sign in with an existing account (after sign-up is fixed, create
   one), generate an activation code, activate a phone built with the new
   `EXPO_PUBLIC_ENTITLEMENT_PUBKEY`.
8. The next morning: the admin digest email arrived, Vercel → Crons shows the
   runs green.

## 10. Rotation

- A role password: change it in `.env.local`, re-run `db:migrate:hosted`
  (updates the role), update the matching URL in Vercel, redeploy.
- `CRON_SECRET`, `ADMIN_INGEST_SECRET`, `RESEND_API_KEY`: Vercel only.
- `DEVICE_TOKEN_SECRET`: invalidates every device token; phones must
  re-activate. `ENTITLEMENT_PRIVATE_KEY`: needs a phone release with the new
  public key first. `ADMIN_TOTP_KEY`: every staff member re-enrols.
