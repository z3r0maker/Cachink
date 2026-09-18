# Platform flags → entitlement: integration note (N-09)

N-09 ships the admin half: the `platform_flag_events` table, the
`platform_flags` view, the portal's narrow `platform_flags_for_entitlement`
view (`src/server/db/migrations/0005_platform_flags.sql`), the `/flags` page,
and the pure rule in `@xangarro/domain` (`packages/domain/src/entities/platform-flag.ts`).
The portal and application edits below are **not** made on this branch: those
files belong to other sessions. Line numbers are `origin/main` as of 2026-09-17.

## Decision

Platform availability (level one of platform × plan × tenant, ADR-053) moves
from the `PLATFORM_AVAILABLE` constant
(`packages/domain/src/entities/feature-flags.ts:42`) to an admin-editable table.
A key with no row keeps its code default, `PLATFORM_FLAG_DEFAULTS`
(= `PLATFORM_AVAILABLE` plus `asesorLlm: false`, `comprobanteShare: true`,
`cobrosIntegrados: false`), so an empty table changes nothing. Devices still
learn flags **only** through the signed entitlement: no contract change.

## 1. `computeEntitlement` (packages/application)

`packages/application/src/compute-entitlement/compute-entitlement.ts`

- `:83` `computeEntitlement(businessId, subscription, now)` gains a fourth
  parameter, `platform: Readonly<Record<PlatformFlagKey, boolean>>`: the
  output of `resolvePlatformFlags(businessId, rows, defaults)`. It stays pure;
  the application layer never reads the database.
- `:52` `payload(...)` threads `platform` through (and `:78` `free(...)`,
  so the fallback plan is filtered the same way).
- `:68` becomes
  `features: limits.features.filter((k) => platform[k]),`
  i.e. `entitlement.features` = plan features ∩ platform availability.
- Tests: one happy path plus the unhappy three already exercised in the domain
  (missing row → default, allowlist miss, `off` over a default of true), each
  asserted on `features`.

## 2. Reading the rows (apps/web)

`apps/web/src/server/device/bootstrap.ts:71` `entitlementFor(businessId, now)`
is the single caller of `computeEntitlement` (`:73`). It becomes async and takes
the tenant transaction:

```ts
const rows = await tx.select().from(platformFlagsForEntitlement); // one query
const platform = resolvePlatformFlags(businessId, rows.map(toRule), PLATFORM_FLAG_DEFAULTS);
return computeEntitlement(businessId, subscription, now, platform);
```

- **Read once per entitlement computation**: one `SELECT` of ≤ 10 rows, then
  `resolvePlatformFlags` answers every key in memory. No cross-request cache:
  a cache would delay a kill switch by its TTL, and the query is trivial.
- The view filters each allowlist down to `xangarro.current_business_id()`,
  so the read **must** run inside the tenant transaction. Callers:
  `apps/web/src/server/sync/pull.ts:40` (already in the tenant tx),
  `apps/web/src/server/device/activate.ts:94` (after `set_config`, `:93`),
  and `apps/web/src/app/api/v1/entitlement/route.ts:18` (must open the
  tenant tx before calling).
- `toRule` maps `flag_key/mode/allowlist_business_ids/updated_at` onto
  `PlatformFlagRule`; the view carries no reason or author by design.
- The Drizzle declaration of the view belongs in `@xangarro/data-pg` with the
  SQL, when the staff tables move there (see `src/server/db/schema.ts`).

## 3. Kill switches

- `asesorLlm` replaces ADR-059's environment gate at
  `apps/web/src/app/(portal)/asesor/screen.tsx:21`
  (`LLM_ENABLED = process.env.NODE_ENV !== 'production'`). The server reads
  `isPlatformAvailable('asesorLlm', businessId, rows, defaults)` at the same
  single model-call boundary. To keep «locally nothing is gated», pass
  `{ ...PLATFORM_FLAG_DEFAULTS, asesorLlm: true }` as `defaults` outside
  production; in production the default stays `false` until staff turn it on.
- `comprobanteShare` and `cobrosIntegrados` are enforced server-side wherever
  the portal renders those surfaces. **They do not reach devices yet**:
  `entitlement.features` is `z.enum(FEATURE_FLAG_KEYS)` and carrying kill
  switches to the phone needs a contract amendment (a C-task), which N-09
  deliberately does not make.

## 4. Device side (A-10, no contract change)

`packages/ui/src/hooks/use-feature-flags.ts:34` still passes the compiled
`PLATFORM_AVAILABLE`. Once A-10 wires the entitlement, the device must take
platform availability **from** `entitlement.features` instead
(`platform[k] = features.includes(k)`); otherwise a key staff turn on stays
dark on phones whose build has it `false`. Turning a key off already works,
because the server drops it from `features`.

## 5. Propagation

Flipping a flag writes one event; nothing is pushed. Every entitlement is
computed per request and never stored, so the change reaches a device on its
next `/sync/pull` or `GET /api/v1/entitlement` refresh, and the portal on its
next request. The `/flags` page says so, and every change is in
`staff_audit_log` (`flags.cambiar`, before → after, reason, reach).
