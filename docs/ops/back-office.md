# Back-office runbook (B-16)

Support for Xangarro is Supabase Studio plus the portal — there is no admin app
yet (N-05). Saved queries live in `supabase/studio/`; paste them into Studio's
saved queries. `packages/data-pg/tests/support-tooling.integration.test.ts`
runs every one of them against the seed, so a schema change that breaks one
fails CI.

**Rule for everything below:** read in Studio, change through the portal or a
`xangarro.*` function. Never edit tenant rows by hand — a hand edit skips
`sync_log`, and the phones never hear about it.

## A shopkeeper says a sale "didn't send"

1. `unresolved-rejections.sql` — find the business and the code.
2. The owner sees the same rows, in Spanish, on **Sincronización**. Most codes
   are fixed on the phone (edit, resend): `FK_PRODUCT_MISSING` means the product
   was deleted in the portal before the sale synced; `HYBRID_UPDATE_FORBIDDEN`
   means the phone tried to edit a product — edits belong to the portal.
3. `INTERNAL` is ours: search Sentry by the tag `business_id` (B-18). Each
   push also left one log line with the rejection codes it returned.

## A phone was lost or stolen

The owner revokes it: **Tu equipo → Dispositivos → Revocar**. It stops at its
next call (401 `DEVICE_REVOKED`), and the slot is free at once. Unsent sales on
that phone are lost; `stale-devices.sql` shows how long it had been silent.

## A phone is waiting for an activation code

`codes-expiring-today.sql` shows unused codes about to expire (never the code
itself). The owner mints a new one: **Tu equipo → Dispositivos → Generar
código**, which also expires any older unused one. A code is 8 characters,
48 hours, single use.

## An owner is locked out of sign-in

Five wrong passwords in 15 minutes lock the address for 15 minutes (ADR-079).
Waiting works; to unlock now, run `unlock-sign-in.sql` with their address. It
recomputes the key the app stores — `sha256("login:email:<address>")` — so no
email is ever written to the table.

## Sign someone out everywhere

After a password change, a lost laptop, or removing a member who must not wait
for their next request:

```sql
SELECT xangarro.session_revoke_user('<auth.users.id>');  -- returns sessions ended
```

Removing a member from `business_members` already ends their sessions on the
next request; this ends them now.

## Housekeeping

`SELECT * FROM xangarro.security_prune();` deletes throttle rows and sessions
that can no longer matter (expired or revoked more than a day ago) and returns
how many. Nothing depends on it — expired rows are inert — it only keeps the
tables small. Schedule it daily once the hosted database exists (B-03).

## Not here yet

- **Subscriptions by plan/status** — needs `billing.subscriptions` (B-10).
- **Resend a magic link** — needs the production auth provider, still
  undecided.
- **Issue a code from Studio** (B-11) — the portal issues codes today; a SQL
  version would be a second copy of the code alphabet. Decide before building.
