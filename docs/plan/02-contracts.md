# Track C — Contracts (shared, frozen after landing)

> **Frozen: 2026-09-11** — encoded in `packages/contracts` (C-01…C-07). Wire form is **camelCase JSON**
> (the domain entity shape) and every **bigint money field travels as a decimal string**; the examples
> below were updated to match. The package README maps modules to sections.

> The interface between the phone (Track A) and the cloud (Track B). Both tracks build against
> **this file**, not against each other's code. Sections §1–§8 are the **spec**; tasks C-01…C-10
> encode it in `packages/contracts` (zod) and provide a mock server so Track A never waits on Track B.
>
> **Change control:** a change here is a `C-` task on `main` first; A and B rebase. No exceptions.

---

## §1 Transport

- Base URL: `${API_BASE}/api/v1` — locally `http://localhost:3000/api/v1` (portal dev server), later `https://app.xangarro.mx/api/v1`.
- Headers on every device call: `Authorization: Bearer <device_token>` (except `/activate`), `X-Xangarro-Protocol: 1`, `Content-Type: application/json`.
- Protocol mismatch → `426 { error: { code: 'PROTOCOL_UNSUPPORTED', min: 1, max: 1 } }`. The app shows "Actualiza la app".
- All timestamps ISO-8601 UTC strings. All money integer centavos. All IDs ULID strings.
- Error envelope (every non-2xx): `{ error: { code: string, message: string, details?: unknown } }`. Codes are UPPER_SNAKE, enumerated per endpoint below; unknown codes are treated by the app as retryable if 5xx, terminal if 4xx.
- Rate limit: 60 req/min per device token; `429` with `Retry-After`.

## §2 Tokens

**Device token** — JWT signed with the Supabase project JWT secret so PostgREST/RLS accept it. Claims:
`{ sub: <device_id>, role: 'authenticated', aud: 'authenticated', business_id, device_id, kind: 'device', iat, exp: iat + 365d }`.
Revocation is server-side: every handler checks `tenant.devices.status = 'active'` for `device_id` before doing work; a revoked device gets `401 DEVICE_REVOKED` and the app returns to the activation screen (data kept locally, per Q9).

**Portal session** — Supabase Auth session (magic link or password). A custom-claims hook adds `memberships: [{business_id, role}]`. The active business is chosen client-side and sent as `X-Business-Id` on portal server actions; server code re-checks membership on every request.

**Entitlement token** — see §6. Not a JWT: a JSON payload + detached Ed25519 signature, so the app verifies offline with a baked-in public key and the payload stays readable.

## §3 `POST /activate`

Request:

```json
{
  "email": "dueno@negocio.mx",
  "code": "K7M3P9RW",
  "device": {
    "name": "iPhone de Toni",
    "platform": "ios|android",
    "app_version": "1.0.0",
    "os_version": "18.1"
  }
}
```

Response `200`:

```json
{ "deviceToken": "<jwt>", "deviceId": "01J…", "businessId": "01J…",
  "entitlement": { "payload": { …§6… }, "signature": "<base64>" },
  "bootstrap": { "serverSeq": 1234, "serverTime": "2026-09-11T20:00:00Z",
                 "tables": { "businesses": [ … ], "products": [ … ], "clients": [ … ], "users": [ … ],
                             "employees": [ … ], "recurring_expenses": [ … ], "conversion_recetas": [ … ],
                             "feature_flags": { … } } } }
```

Rows inside `tables` are domain entities in camelCase (`ReferenceTablesSchema`); `users` rows never carry `email`.

```json

```

Errors: `400 CODE_INVALID` · `410 CODE_EXPIRED` · `409 CODE_USED` · `403 EMAIL_MISMATCH` (code exists but not for that email — same message to the user as CODE_INVALID) · `402 NO_DEVICE_SLOTS` (plan full; message names the plan) · `423 BUSINESS_SUSPENDED`.
Rules: code is single-use; on success it is burned atomically with device creation; the same code cannot activate two devices even under a race (unique constraint on `activation_codes.redeemed_device_id` + row lock).

## §4 `POST /sync/push`

Request (≤ 500 deltas):

```json
{ "deltas": [ { "table": "sales", "rowId": "01J…", "op": "insert|update", "clientSeq": 8812,
                "row": { …the domain entity, camelCase, incl. businessId, deviceId, createdByUserId, createdAt, updatedAt, deletedAt; money as "4500"… } } ] }
```

Response `200` **always per-row** (the batch itself only fails for auth/protocol/rate-limit):

```json
{
  "accepted": [{ "row_id": "01J…", "client_seq": 8812, "server_seq": 5001 }],
  "rejected": [
    {
      "row_id": "01J…",
      "client_seq": 8813,
      "code": "FK_PRODUCT_MISSING",
      "message": "…",
      "retryable": false
    }
  ],
  "server_seq": 5001,
  "server_time": "2026-09-11T20:00:01Z"
}
```

Server semantics: upsert by `(businessId, id)`; `businessId` in the row **must equal** the token's — otherwise `rejected` with `BUSINESS_MISMATCH` (non-retryable). Idempotent: re-pushing an accepted row returns accepted again with the same `server_seq`. Rows for tables in the DOWN-only set (§8) are rejected `TABLE_NOT_WRITABLE`. Hybrid tables accept `op:'insert'` only; `op:'update'` → `HYBRID_UPDATE_FORBIDDEN`.
Rejection codes (initial set): `VALIDATION` (zod), `BUSINESS_MISMATCH`, `TABLE_NOT_WRITABLE`, `HYBRID_UPDATE_FORBIDDEN`, `FK_PRODUCT_MISSING`, `FK_USER_MISSING`, `FK_CLIENT_MISSING`, `DUPLICATE_CONFLICT` (same id, different business), `INTERNAL` (retryable:true).
The app treats `retryable:false` as terminal (shown in "No enviados", retried only on manual retry after edit) and `retryable:true` as backoff-retry.

## §5 `GET /sync/pull?since=<serverSeq>`

Response `200`:

```json
{ "serverSeq": 5040, "serverTime": "…",
  "entitlement": { "payload": { … }, "signature": "…" },
  "tables": { "businesses": [ … ], "products": [ … ], "clients": [ … ], "users": [ … ], "employees": [ … ],
              "recurring_expenses": [ … ], "conversion_recetas": [ … ], "feature_flags": { "stock": true, … } },
  "acknowledgedThrough": 5001 }
```

Semantics: rows with `serverSeq > since`, including soft-deletes (`deletedAt` set). `since=0` = full bootstrap. `acknowledgedThrough` is the highest `serverSeq` the server has durably stored for **this device's pushes** — the app's retention purge (A-11) may only purge rows with `serverSeq ≤ acknowledgedThrough`. `users` rows include `pinHash` (bcrypt) and `active`; never `email`. `feature_flags` is the **tenant** layer only; the app resolves effective flags with `PLATFORM_AVAILABLE` (domain) × plan (entitlement) × tenant.

## §6 Entitlement payload

```json
{
  "business_id": "01J…",
  "plan": "freelancer|emprendedor|mipyme_pro",
  "limits": { "operators": 2, "devices": 2, "records_per_month": null },
  "features": ["stock", "barcode"],
  "valid_until": "2026-10-11T00:00:00Z",
  "grace_until": "2026-10-18T00:00:00Z",
  "issued_at": "2026-09-11T20:00:00Z",
  "server_time": "2026-09-11T20:00:00Z",
  "version": 1
}
```

Signature: Ed25519 over `canonicalize(payload)` (keys sorted at every depth, no whitespace, bigint as decimal string, `undefined` dropped), base64. Test vector + dev keypair: `packages/contracts/tests/entitlement.test.ts`. Public key ships in the app (`EXPO_PUBLIC_ENTITLEMENT_PUBKEY`), private key only in the backend env. Freelancer: `valid_until` = +100 years, `grace_until` same. Lapsed paid plans are issued **as freelancer** (Q14: lapse → free tier), never as an expired paid token.
App-side state machine (domain `entitlementState`), using `nowAnchored = max(device_now, last_server_time_seen)` and `staleness = nowAnchored − last_successful_pull`:

- `active` if `nowAnchored < valid_until` and `staleness < 30d`
- `grace` if `valid_until ≤ nowAnchored < grace_until` (banner) or `30d ≤ staleness < 37d`
- `lapsed` otherwise → app applies **freelancer** limits locally until a fresh entitlement arrives. Never deletes, never locks.

## §7 `GET /entitlement`

Returns `{ entitlement }` only. Used by the app when it wants a cheap refresh (e.g. after an upsell return). Same object as in `/sync/pull`.

## §8 Table scope

| Direction                                              | Tables                                                                                                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UP** (device → cloud, insert + update)               | `sales`, `expenses`, `inventory_movements`, `caja_turnos`, `caja_movimientos`, `cancelacion_logs`, `day_closes`, `client_payments`, `entregas_credito`†, `conversions`†, `auditorias_inventario`† |
| **HYBRID** (insert up; updates portal-only, flow down) | `products`, `clients`                                                                                                                                                                             |
| **DOWN** (cloud → device only)                         | `businesses`, `users`, `employees`, `recurring_expenses`, `conversion_recetas`†, `feature_flags` (virtual), entitlement (virtual)                                                                 |
| **Never synced**                                       | `app_config` (device settings), `director_alerts` (dead), `__cachink_change_log` / sync state                                                                                                     |

† dormant (flag off in v1) but in scope so no protocol change is needed later.

---

### C-01 Encode §1–§2 (transport, headers, error envelope, token claim shapes)

- [ ] Status · **Blocked by:** F-05 · **Blocks:** C-02…C-08
- **Files:** `packages/contracts/src/{transport.ts,errors.ts,tokens.ts}` + tests.
- **Steps:** zod schemas for `ErrorEnvelope`, `DeviceTokenClaims`, constants `PROTOCOL_VERSION=1`, `HEADER_PROTOCOL`, `API_PREFIX`. Export `isRetryableError(code, status)`.
- **Acceptance:** schema round-trip tests (valid, missing field, wrong type, extra field stripped) green.
- **How to test:** `pnpm --filter @xangarro/contracts test`.

### C-02 Encode §3 `/activate` request/response

- [ ] Status · **Blocked by:** C-01 · **Blocks:** A-04, B-07
- **Files:** `packages/contracts/src/activate.ts` + tests. Row schemas for bootstrap tables reuse **domain** entity zod schemas (`@xangarro/domain`) — do not redefine columns.
- **Acceptance:** `ActivateRequest`, `ActivateResponse`, `ActivateErrorCode` exported; code format validator `^[A-HJ-NP-Z2-9]{8}$`.

### C-03 Encode §4 `/sync/push`

- [ ] Status · **Blocked by:** C-01 · **Blocks:** A-06, B-08
- **Files:** `packages/contracts/src/sync-push.ts`. `Delta` discriminated by `table` with per-table row schema from domain; `PushResponse`; `RejectionCode` enum with `retryable` map.
- **Acceptance:** a delta for a DOWN-only table fails schema validation client-side (so it can never be sent).

### C-04 Encode §5 + §7 `/sync/pull`, `/entitlement`

- [ ] Status · **Blocked by:** C-01, C-05 · **Blocks:** A-06, B-09
- **Files:** `packages/contracts/src/sync-pull.ts`, `src/entitlement-endpoint.ts`.

### C-05 Encode §6 entitlement payload + canonical JSON + signature envelope

- [ ] Status · **Blocked by:** C-01 · **Blocks:** A-10, B-06
- **Files:** `packages/contracts/src/entitlement.ts` (re-export domain `Entitlement`; add `SignedEntitlement = {payload, signature}`; `canonicalize(payload): string` with sorted keys, deterministic).
- **Acceptance:** `canonicalize` test: key order independence; unicode; nested objects; numbers vs strings preserved. **No crypto in this package** (verify in app, sign in backend) — but include a test vector: a fixed payload, a fixed keypair, the expected signature (generated once with `tweetnacl` in a test-only devDependency) so both sides can prove compatibility.

### C-06 Encode §8 table scope as data

- [ ] Status · **Blocked by:** C-01 · **Blocks:** A-06, B-08, B-09
- **Files:** `packages/contracts/src/scope.ts`: `UP_TABLES`, `HYBRID_TABLES`, `DOWN_TABLES`, `isPushable(table, op)`, `isPullable(table)`. Replaces `isSyncedTable` from `sync-lan` for cloud use.
- **Acceptance:** exhaustive test: every table in `packages/data/src/schema` is classified exactly once or explicitly in `NEVER_SYNCED`.

### C-07 Error codes + retryability table (single source)

- [ ] Status · **Blocked by:** C-01
- **Files:** fold into `errors.ts`; export `ERROR_CATALOG` with `{code, httpStatus, retryable, userMessageKey}` used by both app i18n and portal Sync-health.

### C-08 Contract document freeze

- [ ] Status · **Blocked by:** C-01…C-07
- **Steps:** bump this file's header with `Frozen: <date> <sha>`; add `packages/contracts/README.md` linking here; add a CI check (F-08) that `packages/contracts` has no `TODO`.

### C-09 Mock API server for Track A

- [ ] Status · **Blocked by:** C-02…C-06 · **Blocks:** A-04, A-06, A-07, A-16
- **Context:** Track A must be able to run activation and sync end-to-end before B-07/B-08/B-09 exist. `msw` is already a devDependency in the archived sync-cloud tests; use it (check latest version).
- **Files:** `packages/contracts/mock/{server.ts,fixtures.ts,scenarios.ts}`; a script `pnpm mock:api` that runs it as a standalone Node HTTP server on `:3000` (msw `setupServer` for unit tests + a tiny `http` wrapper for the simulator).
- **Steps:** implement §3–§7 in memory: a fixture business with 2 operators, 20 products, 3 clients; codes `VALID001`, `USED0002`, `EXPIRED3`, `NOSLOTS4`; push validates with the zod schemas and applies §4 rules (rejects `HYBRID_UPDATE_FORBIDDEN`, `BUSINESS_MISMATCH`; fixture product id `MISSING…` → `FK_PRODUCT_MISSING`); pull returns rows since seq; entitlement signed with a **dev keypair** committed under `mock/dev-keys.json` (documented as dev-only; the app's dev build uses that public key).
  Scenarios switchable by header `X-Mock-Scenario: freelancer|emprendedor|grace|lapsed|revoked|flaky` (flaky = 30 % `INTERNAL retryable`).
- **Acceptance:** `pnpm mock:api` serves; `curl -X POST localhost:3000/api/v1/activate -d '{"email":"a@b.mx","code":"VALID001","device":{…}}'` returns a valid `ActivateResponse` (validate with the zod schema in a test); the `flaky` scenario makes a 500-row push return a mix of accepted/rejected.
- **How to test:** `pnpm --filter @xangarro/contracts test -- mock`; manual curl.

### C-10 Contract conformance suite (runs against mock **and** real backend)

- [ ] Status · **Blocked by:** C-09 · **Blocks:** B-07, B-08, B-09 (must pass against real handlers before those are marked done)
- **Files:** `packages/contracts/conformance/*.test.ts`, parameterised by `API_BASE` env.
- **Steps:** one test file per endpoint asserting the §3–§7 rules (idempotent re-push, per-row rejection, single-use code under concurrent redemption (two parallel requests → exactly one 200), `acknowledged_through` monotonic, entitlement signature verifies with the public key).
- **Acceptance:** green against `pnpm mock:api`; Track B runs the same suite against `localhost:3000` (real portal dev server + local Supabase) in B-07…B-09.
- **How to test:** `API_BASE=http://localhost:3000 pnpm --filter @xangarro/contracts test -- conformance`.
