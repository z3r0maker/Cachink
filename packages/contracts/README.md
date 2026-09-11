# @xangarro/contracts

The frozen interface between the phone (Track A) and the cloud (Track B).
**Spec:** `docs/plan/02-contracts.md`. Every module here encodes one section
of that spec as zod; nothing imports React, SQLite, or a transport.

| Module           | Spec   | What                                                                          |
| ---------------- | ------ | ----------------------------------------------------------------------------- |
| `transport.ts`   | §1     | protocol version, header names, paths, limits, `deviceHeaders()`              |
| `errors.ts`      | §1, §4 | `ErrorEnvelopeSchema`, `ERROR_CATALOG`, `isRetryableError()`                  |
| `tokens.ts`      | §2     | device-token claims, membership                                               |
| `activate.ts`    | §3     | `ActivateRequestSchema`, `ActivateResponseSchema`, `ReferenceTablesSchema`    |
| `sync-push.ts`   | §4     | `DeltaSchema` (one branch per pushable table), `PushRequest/ResponseSchema`   |
| `sync-pull.ts`   | §5     | `PullQuerySchema`, `PullResponseSchema`                                       |
| `entitlement.ts` | §6, §7 | `SignedEntitlementSchema`, `canonicalize()`                                   |
| `scope.ts`       | §8     | UP / HYBRID / DOWN / never-synced table lists, `isPushable()`, `isPullable()` |
| `wire.ts`        | —      | JSON codec: bigint money ↔ decimal string, driven by the zod schema           |

Wire form: JSON keys are **camelCase** (the domain entity shape, so the phone
serialises entities as-is and Drizzle maps to snake_case columns); every
`bigint` field travels as a decimal string (`encodeJson` / `wireSchema`).

Changing anything here is a `C-` task on `main` first; Tracks A and B rebase.
