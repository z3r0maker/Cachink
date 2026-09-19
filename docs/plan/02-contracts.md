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
    "platform": "ios|android|web",
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

> **Amended 2026-09-18 (ADR-081):** `inventory_movements` moved from UP to HYBRID and joined
> `ReferenceTablesSchema` (default `[]`).

| Direction                                              | Tables                                                                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UP** (device → cloud, insert + update)               | `sales`, `expenses`, `caja_turnos`, `caja_movimientos`, `cancelacion_logs`, `day_closes`, `client_payments`, `entregas_credito`†, `conversions`†, `auditorias_inventario`† |
| **HYBRID** (insert up; updates portal-only, flow down) | `products`, `clients`, `inventory_movements` (never updated)                                                                                                               |
| **DOWN** (cloud → device only)                         | `businesses`, `users`, `employees`, `recurring_expenses`, `conversion_recetas`†, `feature_flags` (virtual), entitlement (virtual)                                          |
| **Never synced**                                       | `app_config` (device settings), `director_alerts` (dead), `__cachink_change_log` / sync state                                                                              |

† dormant (flag off in v1) but in scope so no protocol change is needed later.

---

### C-01 Encode §1–§2 (transport, headers, error envelope, token claim shapes)

- [x] Status · **Blocked by:** F-05 · **Blocks:** C-02…C-08
  - Done: 2026-09-11 · track/foundation · `transport.ts`, `tokens.ts`, `errors.ts`, tests.
- **Files:** `packages/contracts/src/{transport.ts,errors.ts,tokens.ts}` + tests.
- **Steps:** zod schemas for `ErrorEnvelope`, `DeviceTokenClaims`, constants `PROTOCOL_VERSION=1`, `HEADER_PROTOCOL`, `API_PREFIX`. Export `isRetryableError(code, status)`.
- **Acceptance:** schema round-trip tests (valid, missing field, wrong type, extra field stripped) green.
- **How to test:** `pnpm --filter @xangarro/contracts test`.

### C-02 Encode §3 `/activate` request/response

- [x] Status · **Blocked by:** C-01 · **Blocks:** A-04, B-07
  - Done: 2026-09-11 · track/foundation · `activate.ts` — request/response, `ActivationCodeSchema` (trim+upper, no 0/O/1/I), `ReferenceTablesSchema` reusing domain schemas via `wireSchema`; `users` rows omit `email`.
- **Files:** `packages/contracts/src/activate.ts` + tests. Row schemas for bootstrap tables reuse **domain** entity zod schemas (`@xangarro/domain`) — do not redefine columns.
- **Acceptance:** `ActivateRequest`, `ActivateResponse`, `ActivateErrorCode` exported; code format validator `^[A-HJ-NP-Z2-9]{8}$`.

### C-03 Encode §4 `/sync/push`

- [x] Status · **Blocked by:** C-01 · **Blocks:** A-06, B-08
  - Done: 2026-09-11 · track/foundation · `sync-push.ts` — `DeltaSchema` discriminated on `table`, one branch per pushable table; down-only tables fail validation client-side.
- **Files:** `packages/contracts/src/sync-push.ts`. `Delta` discriminated by `table` with per-table row schema from domain; `PushResponse`; `RejectionCode` enum with `retryable` map.
- **Acceptance:** a delta for a DOWN-only table fails schema validation client-side (so it can never be sent).

### C-04 Encode §5 + §7 `/sync/pull`, `/entitlement`

- [x] Status · **Blocked by:** C-01, C-05 · **Blocks:** A-06, B-09
  - Done: 2026-09-11 · track/foundation · `sync-pull.ts` + `EntitlementResponseSchema`; `acknowledgedThrough` required.
- **Files:** `packages/contracts/src/sync-pull.ts`, `src/entitlement-endpoint.ts`.

### C-05 Encode §6 entitlement payload + canonical JSON + signature envelope

- [x] Status · **Blocked by:** C-01 · **Blocks:** A-10, B-06
  - Done: 2026-09-11 · track/foundation · `SignedEntitlementSchema`, `canonicalize()`; Ed25519 vector with committed dev key. Deviation: bigint → decimal string in the canonical form.
- **Files:** `packages/contracts/src/entitlement.ts` (re-export domain `Entitlement`; add `SignedEntitlement = {payload, signature}`; `canonicalize(payload): string` with sorted keys, deterministic).
- **Acceptance:** `canonicalize` test: key order independence; unicode; nested objects; numbers vs strings preserved. **No crypto in this package** (verify in app, sign in backend) — but include a test vector: a fixed payload, a fixed keypair, the expected signature (generated once with `tweetnacl` in a test-only devDependency) so both sides can prove compatibility.

### C-06 Encode §8 table scope as data

- [x] Status · **Blocked by:** C-01 · **Blocks:** A-06, B-08, B-09
  - Done: 2026-09-11 · track/foundation · `scope.ts`; exhaustive test asserts every `sqliteTable` is classified exactly once.
- **Files:** `packages/contracts/src/scope.ts`: `UP_TABLES`, `HYBRID_TABLES`, `DOWN_TABLES`, `isPushable(table, op)`, `isPullable(table)`. Replaces `isSyncedTable` from `sync-lan` for cloud use.
- **Acceptance:** exhaustive test: every table in `packages/data/src/schema` is classified exactly once or explicitly in `NEVER_SYNCED`.

### C-07 Error codes + retryability table (single source)

- [x] Status · **Blocked by:** C-01
  - Done: 2026-09-11 · track/foundation · folded into `errors.ts`: `ERROR_CATALOG` (httpStatus, retryable, i18n key), `ErrorCodeSchema`.
- **Files:** fold into `errors.ts`; export `ERROR_CATALOG` with `{code, httpStatus, retryable, userMessageKey}` used by both app i18n and portal Sync-health.

### C-08 Contract document freeze

- [x] Status · **Blocked by:** C-01…C-07
  - Done: 2026-09-11 · track/foundation · freeze header + `packages/contracts/README.md`; examples switched to camelCase + bigint-as-string.
- **Steps:** bump this file's header with `Frozen: <date> <sha>`; add `packages/contracts/README.md` linking here; add a CI check (F-08) that `packages/contracts` has no `TODO`.

### C-09 Mock API server for Track A

- [x] Status · **Blocked by:** C-02…C-06 · **Blocks:** A-04, A-06, A-07, A-16
  - Done: 2026-09-11 · track/foundation · `@xangarro/contracts/mock` — `pnpm mock:api` (`:3000`), msw adapter, fixture business, `X-Mock-Scenario`. Codes `VALDK7M3` / `USEDK7M3` / `EXPRK7M3` / `NSLTK7M3` (the doc's `VALID001` etc. violate the §3 alphabet).
- **Context:** Track A must be able to run activation and sync end-to-end before B-07/B-08/B-09 exist. `msw` is already a devDependency in the archived sync-cloud tests; use it (check latest version).
- **Files:** `packages/contracts/mock/{server.ts,fixtures.ts,scenarios.ts}`; a script `pnpm mock:api` that runs it as a standalone Node HTTP server on `:3000` (msw `setupServer` for unit tests + a tiny `http` wrapper for the simulator).
- **Steps:** implement §3–§7 in memory: a fixture business with 2 operators, 20 products, 3 clients; codes `VALID001`, `USED0002`, `EXPIRED3`, `NOSLOTS4`; push validates with the zod schemas and applies §4 rules (rejects `HYBRID_UPDATE_FORBIDDEN`, `BUSINESS_MISMATCH`; fixture product id `MISSING…` → `FK_PRODUCT_MISSING`); pull returns rows since seq; entitlement signed with a **dev keypair** committed under `mock/dev-keys.json` (documented as dev-only; the app's dev build uses that public key).
  Scenarios switchable by header `X-Mock-Scenario: freelancer|emprendedor|grace|lapsed|revoked|flaky` (flaky = 30 % `INTERNAL retryable`).
- **Acceptance:** `pnpm mock:api` serves; `curl -X POST localhost:3000/api/v1/activate -d '{"email":"a@b.mx","code":"VALID001","device":{…}}'` returns a valid `ActivateResponse` (validate with the zod schema in a test); the `flaky` scenario makes a 500-row push return a mix of accepted/rejected.
- **How to test:** `pnpm --filter @xangarro/contracts test -- mock`; manual curl.

### C-10 Contract conformance suite (runs against mock **and** real backend)

- [x] Status · **Blocked by:** C-09 · **Blocks:** B-07, B-08, B-09 (must pass against real handlers before those are marked done)
  - Done: 2026-09-11 · track/foundation · `tests/conformance/` — 44 cases incl. concurrent double-redeem; `pnpm --filter @xangarro/contracts test:conformance`, or with `API_BASE` against a real backend.
- **Files:** `packages/contracts/conformance/*.test.ts`, parameterised by `API_BASE` env.
- **Steps:** one test file per endpoint asserting the §3–§7 rules (idempotent re-push, per-row rejection, single-use code under concurrent redemption (two parallel requests → exactly one 200), `acknowledged_through` monotonic, entitlement signature verifies with the public key).
- **Acceptance:** green against `pnpm mock:api`; Track B runs the same suite against `localhost:3000` (real portal dev server + local Supabase) in B-07…B-09.
- **How to test:** `API_BASE=http://localhost:3000 pnpm --filter @xangarro/contracts test -- conformance`.

### C-11 Rename the plan ids and add `capabilities` to the entitlement (unfreezes §6, then re-freezes)

- [x] Status · **Blocked by:** C-08 · **Blocks:** P-03, P-10, P-14, P-15, A-10, B-06, B-07, B-09
  - Done: 2026-09-17 · `PLAN_IDS = ['xangarrito', 'xangarro', 'xangarrote']`, `PLAN_LIMITS` rekeyed,
    `FALLBACK_PLAN = 'xangarrito'`, and `PlanCapabilities` added to both `PlanLimits` and the signed
    `EntitlementSchema`. Amended at protocol version 1 — no bump, no aliases — and re-frozen.
  - Swept: `plan.ts`, `entitlement.ts`, `mock/scenarios.ts` (the `X-Mock-Scenario` values are now
    `xangarro|xangarrito|grace|lapsed|revoked|flaky`), `mock/cli.ts`, `use-feature-flags.ts`, and
    the domain + contracts test fixtures including the entitlement signature vector.
  - **475 domain tests and 44 contract tests pass**; `pnpm typecheck` 20/20 and `pnpm test` 11/11
    green workspace-wide. `rg "'freelancer'|'mipyme_pro'"` returns nothing outside `dist/`.
  - The word "emprendedor" survives in `HelloBadge` ("Hola, emprendedor.") and a comment in
    `format/money.ts`. Those are the Spanish noun, not the plan id, and were deliberately left.
  - Stripe lookup keys take the `plan_` prefix when B-10 creates them — not needed yet.
  - **Context:** ADR-059. The Suscripción design is the one artifact its handoff marks as real
    ("copy it verbatim") and it names the plans **Xangarrito $0 / Xangarro $199 / Xangarrote $399
    MXN/mes**. The owner chose to rename the identifiers, not only the labels. The design also
    sells «Asesor en cada plan» as a tiered capability that `FEATURE_FLAG_KEYS` cannot express.
    Both changes land in **one** amendment so the contract is unfrozen once.
  - **Why no protocol bump and no aliases:** `PROTOCOL_VERSION` protects deployed clients from
    deployed servers and there are none — B-01 is unstarted, `00-README.md` §6 records that no
    hosted project exists, and no device has ever received an entitlement. Aliases would
    permanently enshrine identifiers no tenant ever held. Amend at version **1** and re-freeze.
- **Files:** `packages/domain/src/entities/plan.ts`, `packages/domain/src/entities/entitlement.ts`,
  `packages/domain/tests/entities/{plan,entitlement}.test.ts`,
  `packages/contracts/src/{entitlement,activate,sync-pull}.ts`,
  `packages/contracts/src/mock/{scenarios,cli}.ts`, `packages/contracts/tests/entitlement.test.ts`
  (the signature vector changes — `canonicalize` output differs), `packages/ui/src/hooks/use-feature-flags.ts`,
  the i18n plan labels, and `docs/plan/02-contracts.md` §6.
- **Steps:**
  1. `PLAN_IDS = ['xangarrito', 'xangarro', 'xangarrote']`; rekey `PLAN_LIMITS`; `FALLBACK_PLAN = 'xangarrito'`.
  2. Add `capabilities` to `PlanLimits` and to the signed payload: `estadosFinancieros: boolean`,
     `informeMensual: boolean`, `permisosPorUsuario: boolean`,
     `asesor: 'semanal' | 'diario' | 'completo'`. Xangarrito: `estadosFinancieros: false`,
     `asesor: 'semanal'`. Xangarro: statements on, `asesor: 'diario'`. Xangarrote: all on,
     `asesor: 'completo'`. **`FEATURE_FLAG_KEYS` is unchanged** — it keeps meaning
     tenant-toggleable business capabilities.
  3. Regenerate the entitlement signature test vector.
  4. Rename the mock scenarios (`X-Mock-Scenario: xangarrito|xangarro|grace|lapsed|revoked|flaky`)
     and the `mock:api` help string.
  5. Update `?plan=` slugs in P-03. **Stripe lookup keys take a `plan_` prefix** — the mid-tier plan
     id and the product name are both `xangarro` and must be distinguishable in external namespaces.
  6. Re-freeze §6 and note the amendment date under C-08.
- **Acceptance:** `pnpm typecheck` and `pnpm test` green workspace-wide; the C-10 conformance suite
  passes against `pnpm mock:api` with the renamed scenarios; no occurrence of `freelancer`,
  `emprendedor` or `mipyme_pro` remains outside `ARCHITECTURE.md` and archived directories.
- **How to test:** `pnpm --filter @xangarro/contracts test`; `pnpm --filter @xangarro/domain test`;
  `rg -n 'freelancer|emprendedor|mipyme_pro' --glob '!archive/**' --glob '!ARCHITECTURE.md' -g '!**/dist/**'`.

### C-12 Limits rework: transactions + products, `usage` in the payload, `cobrosIntegrados`, annual lookup keys

- [ ] Status · **Surfaced by:** Track N (ADR-065, ADR-066, ADR-067) · **Blocks:** N-01, N-02, N-31, A-10
- **Steps:**
  1. `PlanLimits`: replace `recordsPerMonth` with `transactionsPerMonth` and add `activeProducts`.
     Values: xangarrito 300 / 50 · xangarro 10 000 / 1 000 · xangarrote 30 000 / 5 000.
     Operators/devices unchanged.
  2. Add `capabilities.cobrosIntegrados: boolean` (false on xangarrito, true on the paid tiers).
  3. Add an unsigned `usage { period, transactions, products, computedAt }` block to `/sync/pull` and
     `/entitlement` responses (it is server-computed, informational, and must not force a re-sign).
  4. Document that limits are **advisory for transactions** on every tier; `activeProducts` is
     enforced client-side only on xangarrito; the server accepts every row.
  5. Stripe lookup keys: `plan_<tier>_monthly`, `plan_<tier>_annual`.
  6. Regenerate the signature test vector; update mock scenarios (`over-limit`).
  7. Add `origen ∈ manual | portal | apertura | venta | cancelacion | conversion` to
     `inventory_movements` (wire + pg + SQLite; the table is **HYBRID since ADR-081**, so the field
     travels both ways), with an old→new migration defaulting existing rows from the motivo/nota
     heuristic in `@xangarro/domain/usage` and `device_id = PORTAL_DEVICE_ID` rows to `portal`; add
     `Conversión` to the motivo enum it is already written with. `portal` = an owner's manual movement
     recorded in the portal; `apertura` = opening stock captured in N-17's explicit "inventario inicial"
     step (owner decision 2026-09-18; the product import writes **no** movements, ADR-081). Usage counts `manual` and `portal`; never `apertura`, `venta`, `cancelacion`,
     `conversion` (N-02, OQ-5).
- **Acceptance:** C-10 conformance suite green against the mock; domain tests for the new limits.

### C-13 Payment intents API

- [ ] Status · **Surfaced by:** N-41 (ADR-066) · **Trigger:** N-40 go decision · **Blocks:** N-41, N-42
- **Steps:** `POST /api/v1/payments/intents` `{ clientIntentId (ULID), amountCentavos, mode:
'qr'|'terminal', terminalId? }` → `{ intentId, status, qrPayload?, expiresAt }`;
  `GET /api/v1/payments/intents/:id` → `{ status: pending|approved|declined|expired|cancelled,
paymentRef?, provider }`; `GET /api/v1/payments/intents?unclaimed=1`. Idempotent on
  `clientIntentId`. Error codes added to `ERROR_CATALOG` (`PAYMENTS_NOT_CONNECTED`,
  `PAYMENTS_NOT_ENTITLED`, `PROVIDER_UNAVAILABLE` retryable).
- **Acceptance:** zod schemas + mock scenarios `pay-approve|pay-decline|pay-timeout`; conformance tests.

### C-14 QR activation with a long single-use token

- [ ] Status · **Surfaced by:** N-25; **amended 2026-09-17 by the N-26 security audit (SEC-DEV-01)** ·
      **Blocks:** N-25, A-04
- **Steps:** "Agregar dispositivo" mints, alongside the 8-character code, a **QR token** of ≥ 128
  random bits (base64url, ~22 chars), single-use, same 48 h expiry, stored hashed. `/activate` accepts
  either `{ email, code }` (typed path, unchanged) or `{ qrToken }` (scan path — no email). The
  universal link is `https://app.xangarro.mx/activar?t=<qrToken>`; the 8-character code is never put
  in a URL or QR. Both paths return **one generic error** for any wrong code/email/token combination
  (no `EMAIL_MISMATCH` oracle). Rate limit (B-17 amendment): per IP and per code/token — 5 failed
  attempts per 15 min, then a 15-min lockout — applied **before** a device token exists.
- **Acceptance:** conformance tests for both paths, the generic error, and the limiter; used/expired
  token errors.

### C-15 Business branding and contact columns on the `businesses` DOWN table

- [~] Status · **Surfaced by:** N-11, N-19 · **Blocks:** N-11, N-19
  - Progress: 2026-09-18 · `track-n/c15-n19-branding` · wire + pg halves done: `brandColor`,
    `receiptTemplate (clasico|moderno|ticket|minimal)`, `receiptLeyenda`, `addressPrint`,
    `whatsapp`, `socialLinks` (JSON string, the entity's `featureFlags` precedent) on
    `BusinessSchema` with defaults (old payloads parse unchanged) + data-pg **0023**.
    Drift: `businesses` is cloud-ahead until the app branch (allowed for DOWN tables whose
    wire fields exist — the six are on the wire). **SQLite half waits for the app branch.**
- **Steps:** add `brand_color`, `receipt_template ∈ clasico|moderno|ticket|minimal`,
  `receipt_leyenda`, `address_print`, `whatsapp`, `social_links` (JSON) to the wire schema, pg-core and
  SQLite (`logo_url` already exists). SQLite migration with an old→new test (CLAUDE.md §2.9).
- **Acceptance:** drift test green; pull applies the new columns; old devices ignore unknown fields.

### C-16 Browser devices and the four-digit NIP

- [x] Status · **Surfaced by:** Track O (ADR-071, ADR-072) · **Blocks:** O-04, O-05
  - Done: 2026-09-18 · `DevicePlatformSchema` + `devices.plataforma` gain `web` (plain text column —
    no DDL, drift test unchanged and green against the local tenant DB). The NIP is four digits
    everywhere `isValidPin`/`PIN_PATTERN` already reach (the portal's `/equipo` use cases were there)
    **and** the last 6-digit holdouts: `NewUserSchema` (+`PIN_LENGTH`), `RecuperarPin`/`CambiarPin`
    use cases (both slated for removal by O-04), `PinCodeInput` (auto-submit at 4), the Director
    setup / recovery / change-PIN / create-user screens and their i18n hints, the demo seed
    (`0000`), the user fixture, and the 12 Maestro flows + shared subflows that type a PIN
    (amount-taps in `caja-*.yaml` untouched). `recoveryPasswordHash`/`recoveryPassword` carry
    `@deprecated ADR-072` JSDoc — column kept; DirectorSetup submits a doubled NIP (`12341234`)
    until the column's removal migration. `endpoints.test.ts` now asserts `plataforma: 'web'`
    activates and an unknown platform still rejects.
  - Amended at protocol version 1 (additive enum value; PIN length is not on the wire).
- **Steps:** `DevicePlatformSchema` gains `web` (wire, pg-core `devices.plataforma`); NIP becomes
  `/^\d{4}$/` in `UserSchema` and every PIN use case; `recoveryPasswordHash` marked deprecated
  (column kept). Protocol version 1, no bump (additive enum value; PIN length is not on the wire).
- **Acceptance:** drift test green; activate accepts `plataforma: 'web'`.

### C-17 Ticket header entity; `sales` become lines

- [ ] Status · **Surfaced by:** Track O (ADR-073) · **Blocks:** O-05, fase 11
- **Steps:** new UP table (folio, metodo, clienteId, efectivoRecibido, cambio, cajaTurnoId,
  cancellation fields); `sales` gain `ticketId` and lose the ticket-level fields; unique
  (device, folio). SQLite + pg migrations with old → new tests (each sale → one-line ticket).
- **Acceptance:** CLAUDE.md §11 checklist; push accepts a ticket and its lines in one delta.

### C-18 Receivables, expected cash and review status

- [x] Status · **Surfaced by:** Track O (ADR-074) · **Blocks:** O-03, O-05
  - Done: 2026-09-18 · `client_payments` become per-client (`clienteId`, no `ventaId`; SQLite 0004
    rebuilds the table, backfills each abono from its sale and re-creates the change-log triggers —
    3 old→new tests; pg 0023 does the same additively and drops `venta_id`, applied to the local
    DB). `clients` + `limite_centavos`/`plazo_dias`/`estado_revision`/`fusionado_con_id`,
    `products` + review status + `fusionado_con_id`, `expenses` + `caja_turno_id`,
    `caja_turnos` + `denominaciones` (JSON text), everywhere defaulting existing rows to
    `aprobado`. `RegistrarPagoClienteUseCase` rewritten to ADR-074/D5: per-client abono, the whole
    amount recorded (excess = saldo a favor), fused/rejected clients refused, no estadoPago
    mutation; `balance-general`'s CxC now derives through `estadoDeCuenta` (one calculator);
    repos (drizzle + in-memory + contract tests), fixtures, exports and the old UI hook/modal
    follow. Drift 27 green (0022 re-applied after another session reset the shared DB); domain
    773, data 269, application 460, contracts 49, testing 147, UI 1859 green (the one red is the
    documented `use-lan-handle` flake, green in isolation); typecheck clean. Owner decision
    applied: `fusionar` records `estado_revision='fusionado'` + `fusionado_con_id`; stock moves
    via an `inventory_movements` row at wiring time (O-30); history never rewritten.
- **Steps:** `client_payments` per client (`clienteId`, no `ventaId`); `clients` + `limiteCentavos`,
  `plazoDias`, review status; `products` + review status; `expenses` + `cajaTurnoId`; `caja_turnos`
  - denomination JSON. Migrations with old → new tests.
- **Acceptance:** drift test green; old devices ignore unknown fields.

### C-19 Operator messages and replies

- [x] Status · **Surfaced by:** Track O (ADR-075) · **Blocks:** O-16, fase 13
  - Done: 2026-09-18 · `mensajes_operador` (DOWN) and `respuestas_operador` (UP) across every
    layer: domain entities (`MensajeOperador` with severidad `info | aclaracion` — the reply
    affordance keys on `aclaracion`, matching the built Avisos screen's `responder` model — and
    `RespuestaOperador`; 11 entity tests), SQLite migration 0003 (tables + change-log triggers +
    indexes; SCHEMA_VERSION 4) and repositories (drizzle + in-memory), pg `0021` (idempotent DDL +
    RLS tenant isolation + grants — SELECT-only for the app role on mensajes; applied to the local
    DB), `SYNCED_TABLES`, wire (`ReferenceTablesSchema.mensajes_operador` with `.default([])`,
    `respuestas_operador` delta, `PUSH_REFERENCES` + `FK_MENSAJE_MISSING`), the server's codec /
    bootstrap (pull serves mensajes; push accepts replies generically), and the mock (two fixture
    mensajes served by pull; replies push; the mock's operator NIPs also became four digits — a
    C-16 leftover). Acceptance proven: a message pulls (contracts test + mock) and a reply pushes
    (ApplyPushUseCase 14 tests incl. the FK_MENSAJE_MISSING unhappy path). Domain 773, data 266,
    application 453, contracts 49, testing 147, drift 27 green; typecheck clean everywhere.
    UI-layer checklist items land with O-16/O-31 wiring, per the plan.
- **Steps:** `mensajes_operador` (DOWN) and `respuestas_operador` (UP) in `scope.ts`, wire schemas,
  pg-core and SQLite.
- **Acceptance:** CLAUDE.md §11 checklist; a message pulled, a reply pushed.

### C-20 `opening_balances` DOWN table (saldos iniciales)

- [~] Status · **Surfaced by:** N-17 (OQ-1, closed 2026-09-17) · **Blocks:** N-17
  - Progress: 2026-09-19 · `track-n/c20-n17-apertura` · wire + pg halves done: both entities on
    `BusinessSchema`-style zod with defaults (old payloads parse unchanged), `DOWN_TABLES` +
    `ReferenceTablesSchema` arrays (`.default([])`), codec OUT, `SYNCED_TABLES`, bootstrap +
    mock fixtures. data-pg **0025** (tables + RLS + grants) with old→new, replace-save and
    one-way-lock integration tests. The SQLite half waits for the app branch —
    `PENDING_DEVICE_TABLES` allowances in the drift and scope tests make that explicit and
    self-expiring. The ADR-074 receivables calculator takes the opening saldo as
    `estadoDeCuenta`'s third fact (domain, tested), and `calculateBalanceGeneral` gains
    `apertura` (efectivo inicial, CxC lines, caller-computed capitalInicial).
- **Steps:** new DOWN entities `opening_balances` (id, business_id, fecha_apertura, caja_centavos,
  bancos_centavos, locked_at nullable, updated_at) and `opening_balance_clients` (id, business_id,
  cliente_id, saldo_centavos, updated_at); add both to `DOWN_TABLES` in `scope.ts`; pg-core + SQLite
  schemas, migrations with old→new tests (CLAUDE.md §2.9); the ADR-074 receivables calculator takes the
  opening per-cliente balance as a third input. Inventory valuation is derived (stock inicial × costo),
  not stored. Rows become read-only once `locked_at` is set (first period close).
- **Acceptance:** conformance tests for pull of both tables; receivables calculator tests with an
  opening balance; drift test green.
