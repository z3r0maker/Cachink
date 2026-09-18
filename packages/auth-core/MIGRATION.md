# Switching the portal to `@xangarro/auth-core`

`@xangarro/auth-core` holds the **pure** parts of in-house auth (ADR-079,
ADR-080), lifted from the portal and `@xangarro/data-pg` so the portal and the
admin console (N-05) share one copy. Anything that talks to Postgres stays in
`data-pg`; auth-core only defines the ports.

Line numbers are as of `origin/main` at `943f7e6`.

## Already done (no portal edit needed)

`packages/data-pg` now imports from auth-core instead of keeping its own copies,
so every portal caller already runs the shared code:

| Was (data-pg, origin/main)                                                             | Now                                                  |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/security/sessions.ts:21` `hash` (SHA-256 hex)                                     | `hashToken` (`src/token.ts`)                         |
| `src/security/sessions.ts:29` `randomBytes(32).toString('base64url')` in `openSession` | `mintToken` (`src/token.ts`)                         |
| `src/security/throttle.ts:14` `throttleKey`                                            | re-exported from `src/throttle.ts` — same keys       |
| `src/security/throttle.ts:25` `interface FailurePolicy`                                | re-exported from `src/throttle.ts`                   |
| —                                                                                      | new `throttleStore(db)`: the `ThrottleStore` adapter |

`openSession` / `resolveSession` / `revokeSession` / `loginLookup` and the
`throttleWait/Fail/Take/Clear` wrappers stay in data-pg (they call the SECURITY
DEFINER functions of `drizzle/0005` and `0006`). Their signatures are unchanged.

## Portal edits, when you switch

| Portal file:line (origin/main)                                                                                           | Replace with (`@xangarro/auth-core`)                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/server/actions/auth.ts:36-37` `DUMMY_HASH`                                                                 | `DUMMY_HASH` (`src/password.ts`) — same hash                                                                                                                                                               |
| `apps/web/src/server/actions/auth.ts:10,44-48` `compare` + `passwordMatches`                                             | `verifyPassword(password, user?.hash ?? null)` — dummy compare built in; also rejects a malformed stored hash without throwing                                                                             |
| `apps/web/src/server/actions/auth.ts:55-68` wait → compare → fail/clear                                                  | optional: `guardAttempt(throttleStore(db()), subjects, attempt)` (`src/throttle.ts`) — same order: refuse while locked, fail every subject, clear subjects marked `clearOnSuccess` (the email, not the IP) |
| `apps/web/src/server/throttle-policy.ts:14-35` `LOGIN_PER_EMAIL`, `LOGIN_PER_IP`, `ACTIVATE_PER_IP`, `ACTIVATE_PER_CODE` | same names (`src/policies.ts`), same values (tested)                                                                                                                                                       |
| `apps/web/src/server/throttle-policy.ts:38` `DEVICE_CALLS_PER_MINUTE`                                                    | same name (`src/policies.ts`)                                                                                                                                                                              |
| `apps/web/src/server/throttle-policy.ts:45-47` `clientIp`                                                                | `clientIp` (`src/policies.ts`) — same behaviour; takes anything with `get()`                                                                                                                               |
| `apps/web/src/server/throttle-policy.ts:49` `minutes`                                                                    | `minutes` (`src/policies.ts`)                                                                                                                                                                              |
| `packages/data-pg/scripts/seed.ts:14` `hash(…, 10)` from bcryptjs                                                        | optional: `hashPassword` (`src/password.ts`) — cost 10, refuses empty or > 72 bytes                                                                                                                        |

After the switch `apps/web/src/server/throttle-policy.ts` can be deleted
(its `import 'server-only'` has no equivalent need: the policies hold no
secret), and the portal no longer needs `bcryptjs` directly.

`apps/web/src/server/session.ts` needs no change: it calls data-pg's
session functions, which already mint and hash through auth-core. If you want
the shared helpers, `issueSession` / `lookupSession` / `endSession`
(`src/session.ts`) wrap any `SessionStore`; `lookupSession` skips the database
for a missing or malformed cookie (`isPlausibleToken`), which the portal's
`readSession` (`session.ts:42-44`) currently sends to Postgres.

## Nothing else changes

- bcrypt: `bcryptjs` 3.0.3, cost 10 — the portal's and the seed's.
- Tokens: 32 random bytes, base64url; stored as hex SHA-256 — byte-identical, so
  live `xangarro.portal_sessions` rows keep resolving.
- Throttle keys: `sha256(parts.join(':'))` — identical, so existing lockouts
  carry over. The admin console uses the same table under `admin:`-prefixed
  keys, so the two apps never share a counter.

## Also in auth-core (admin uses them; the portal may later)

TOTP (RFC 6238 on `node:crypto`, SHA-1 / 6 digits / 30 s / ±1 step, replay
guard via `lastStep`), `otpauthUri`, base32, recovery codes (10 × 80 bits,
stored SHA-256, `matchRecoveryCode` constant-time), and AES-256-GCM
`sealSecret`/`openSecret` for secrets that must be read back.
`@xangarro/auth-core/testing` exports `memoryThrottleStore` for tests.
