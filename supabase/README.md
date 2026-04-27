# Cachink Supabase — provisioning guide

This directory holds the **developer-laptop-only** assets needed to
stand up the Cachink-hosted Supabase backend (ADR-035). None of these
files are imported by the mobile or desktop app; they only run via
the Supabase CLI on a developer machine.

> **Security rule of thumb:** the Supabase **PAT** and **service-role key**
> must **never** enter the repo, the shipped binary, or CI secrets used
> for client builds. They live on your laptop, in your shell environment,
> and go no further. The app binary only reads **project URL + anon key**.

## One-time provisioning

1. **Install the Supabase CLI** on your laptop.
   ```sh
   brew install supabase/tap/supabase   # macOS
   # or: scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   ```
2. **Create the project** in the Supabase dashboard (https://supabase.com/dashboard).
   Pick the `us-east-1` region (closest low-latency to Mexico).
3. **Export your PAT** for the CLI session. This is the only place the PAT
   lives; close the terminal when you're done.
   ```sh
   export SUPABASE_ACCESS_TOKEN="sbp_…"
   ```
4. **Link the local project directory** to your newly-created remote.
   ```sh
   cd supabase
   supabase link --project-ref <project-ref>
   ```
5. **Push the schema.**
   ```sh
   supabase db push
   ```
   This runs `migrations/0001_schema.sql` which creates the 10 synced
   tables, RLS policies, the `powersync` publication, and the
   `seed_business_on_signup` trigger.
6. **Grab the project URL + anon key** from the dashboard
   (`Project Settings → API`). Put them in your local `.env.local`:
   ```env
   EXPO_PUBLIC_CLOUD_API_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_CLOUD_ANON_KEY=<publishable anon key>
   EXPO_PUBLIC_POWERSYNC_URL=https://<ps-instance>.powersync.journeyapps.com
   ```
7. **Wire PowerSync** against the same Postgres (PowerSync dashboard →
   Create Instance → Configure Postgres → point at the Supabase instance
   via the `postgres` connection string). Grab the PowerSync URL.

## Running RLS tests

```sh
supabase test db supabase/tests/rls.spec.sql
supabase test db supabase/tests/ulid.spec.sql
```

The RLS tests assert cross-business isolation: a user authenticated with
`business_id=BIZ_A`'s JWT cannot read or write rows flagged as
`business_id=BIZ_B`.

The ULID tests verify the `cachink_generate_ulid()` PL/pgSQL function
returns a 26-char Crockford-base32 string that the domain layer's regex
will accept (Slice 8 C8 fix). **First-time provisioners should run this
test before opening the app for sign-up** — Slices 5–7 shipped with a
32-char hex ID generator that the domain layer rejected on the first
sign-up; the ULID generator that replaces it lives in the same migration
so a fresh `supabase db push` picks it up automatically.

## Provisioning smoke check

After step 5 above, run a one-shot sanity check before any human signs
up:

```sh
psql "$(supabase status --output env | grep '^DB_URL=' | cut -d= -f2)" \
  -c "SELECT public.cachink_generate_ulid()" \
  -c "SELECT public.cachink_generate_ulid() ~ '^[0-9A-HJKMNP-TV-Z]{26}

## What the app binary sees

The app **never** uses the PAT or service-role key. It only needs:

| Env var                          | Lives in                      | Who sets it?                  |
|----------------------------------|-------------------------------|-------------------------------|
| `EXPO_PUBLIC_CLOUD_API_URL`      | EAS Build secrets / `.env`    | Developer                     |
| `EXPO_PUBLIC_CLOUD_ANON_KEY`     | EAS Build secrets / `.env`    | Developer                     |
| `EXPO_PUBLIC_POWERSYNC_URL`      | EAS Build secrets / `.env`    | Developer                     |

These three show up in the client bundle; that's acceptable because
(a) the anon key only works within the RLS policies (it can't see
another tenant's rows), and (b) the app's auth flow produces
per-user JWTs that PowerSync validates server-side.

## BYO override

Power users who want their own backend enter project URL + anon key in
**Settings → Avanzado**. The input explicitly rejects PATs and
service-role keys (the UI copy says "solo URL pública + llave
anónima"). Settings writes the override to `__cachink_sync_state` —
see `packages/ui/src/sync/lan-bridge.ts` counterpart for cloud
(`cloud-bridge.ts`).

## Rolling the schema

- Edit `packages/data/src/schema/**` (Drizzle source of truth) and run
  `pnpm --filter @cachink/data db:generate` to emit the next SQLite
  migration.
- **Mirror the change** in `supabase/migrations/0002_*.sql` by hand
  (Drizzle and Postgres dialects differ — `BIGINT` vs. `numeric({mode:'bigint'})`).
- Push with `supabase db push`.
- Update `packages/sync-cloud/src/schema/index.ts` to keep the PowerSync
  client schema in lock-step.

A future improvement is to drive the Postgres migrations from the
Drizzle schema via a cross-dialect generator — parked until we add a
second cloud backend (Neon / self-hosted).

## Credentials boundary recap (ADR-035)

| Credential                         | Where it lives                          | Asked at runtime? |
|------------------------------------|-----------------------------------------|-------------------|
| Supabase PAT                       | Developer laptop only                   | Never             |
| Service-role key                   | Not used                                | Never             |
| Project URL + anon key (hosted)    | Baked into build via `EXPO_PUBLIC_*`    | No                |
| Project URL + anon key (BYO)       | `__cachink_sync_state` after Avanzado   | Only if chosen    |
| User email + password              | Supabase Auth → JWT                     | Yes               |
"
```

Both rows must return a 26-char string and `t`. If either fails, the
trigger will produce ids the app rejects — re-push the migration before
inviting beta users.

## What the app binary sees

The app **never** uses the PAT or service-role key. It only needs:

| Env var                      | Lives in                   | Who sets it? |
| ---------------------------- | -------------------------- | ------------ |
| `EXPO_PUBLIC_CLOUD_API_URL`  | EAS Build secrets / `.env` | Developer    |
| `EXPO_PUBLIC_CLOUD_ANON_KEY` | EAS Build secrets / `.env` | Developer    |
| `EXPO_PUBLIC_POWERSYNC_URL`  | EAS Build secrets / `.env` | Developer    |

These three show up in the client bundle; that's acceptable because
(a) the anon key only works within the RLS policies (it can't see
another tenant's rows), and (b) the app's auth flow produces
per-user JWTs that PowerSync validates server-side.

## BYO override

Power users who want their own backend enter project URL + anon key in
**Settings → Avanzado**. The input explicitly rejects PATs and
service-role keys (the UI copy says "solo URL pública + llave
anónima"). Settings writes the override to `__cachink_sync_state` —
see `packages/ui/src/sync/lan-bridge.ts` counterpart for cloud
(`cloud-bridge.ts`).

## Rolling the schema

- Edit `packages/data/src/schema/**` (Drizzle source of truth) and run
  `pnpm --filter @cachink/data db:generate` to emit the next SQLite
  migration.
- **Mirror the change** in `supabase/migrations/0002_*.sql` by hand
  (Drizzle and Postgres dialects differ — `BIGINT` vs. `numeric({mode:'bigint'})`).
- Push with `supabase db push`.
- Update `packages/sync-cloud/src/schema/index.ts` to keep the PowerSync
  client schema in lock-step.

A future improvement is to drive the Postgres migrations from the
Drizzle schema via a cross-dialect generator — parked until we add a
second cloud backend (Neon / self-hosted).

## Credentials boundary recap (ADR-035)

| Credential                      | Where it lives                        | Asked at runtime? |
| ------------------------------- | ------------------------------------- | ----------------- |
| Supabase PAT                    | Developer laptop only                 | Never             |
| Service-role key                | Not used                              | Never             |
| Project URL + anon key (hosted) | Baked into build via `EXPO_PUBLIC_*`  | No                |
| Project URL + anon key (BYO)    | `__cachink_sync_state` after Avanzado | Only if chosen    |
| User email + password           | Supabase Auth → JWT                   | Yes               |
