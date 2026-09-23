# New entity checklist

Copy the relevant list into the implementation task and verify each item before the
work is called complete. CLAUDE.md §10 points here.

**Pick your surface first.** The portal writes Postgres; the phone writes SQLite. An
entity the phone captures and the portal reports needs **both** halves plus a wire
contract, and the two schemas are kept honest by `packages/data-pg`'s drift test —
adding a column on one side and not the other fails it.

---

## Always (both surfaces)

- [ ] Branded ID type in `packages/domain/src/ids/index.ts`
- [ ] Zod schema + inferred type in `packages/domain/src/entities/`, exported from that barrel
- [ ] Domain entity test in `packages/domain/tests/entities/` — happy path + 3 unhappy
- [ ] Money fields are integer centavos, documented as such in JSDoc (CLAUDE.md §2.8)
- [ ] Use case in `packages/application` with its own test, if the entity is written by a flow
- [ ] File under 200 lines, functions under 40
- [ ] No `TODO`, `FIXME`, `any`, `@ts-ignore` or `eslint-disable` in new code

---

## Portal / backoffice (Postgres)

- [ ] Table in `packages/data-pg/src/schema/<area>.ts`, exported from `schema/index.ts`
- [ ] `business_id` column, and a **`business_id`-leading index** on anything queried by tenant
- [ ] RLS policy for the new table — a table with no policy is readable across tenants
- [ ] Migration SQL in `packages/data-pg/drizzle/` (next free number; they apply in glob
      order, so never reuse one) with its `meta/_journal.json` entry
- [ ] Query in `packages/data-pg/src/queries/`, taking a `Tx` — never opening its own connection
- [ ] Integration test in `packages/data-pg/tests/*.integration.test.ts` that **builds the rows
      the seed does not**. A wrong join is invisible when nothing seeded exercises it
- [ ] Money read back is parsed, not asserted — `BigInt(String(row.total))`, never `sql<bigint>`
      over a driver that returns text (ADR-094), with a `typeof` assertion in the test
- [ ] Server helper in `apps/*/src/server/`, wrapping the query in `withTenant`
- [ ] `'use server'` action for any write, with its own authorisation check
- [ ] Screen stays presentational: loading, empty, error and with-data states all implemented
- [ ] Playwright spec asserting **real data reached the page** — a sentinel, not just a heading
- [ ] Seed rows in `packages/data-pg/scripts/seed-data.ts` if a screen needs them to be visible

## Phone (SQLite)

- [ ] Drizzle table in `packages/data/src/schema/`, exported from `schema/index.ts`
- [ ] Migration in `packages/data/drizzle/migrations/` + journal entry, and registered in
      `migrations/index.ts` (import + `sqlByTag` + bundle + re-export)
- [ ] Repository interface in `packages/data/src/repositories/`, Drizzle implementation in
      `repositories/drizzle/`, both exported from their barrels
- [ ] In-memory repository in `packages/testing/src/`, exported, and wired into
      `mock-repository-provider.tsx`
- [ ] Fixture builder in `packages/testing/src/fixtures/`, if the entity is non-trivial to build
- [ ] Added to the `Repositories` interface and `buildDrizzleRepositories()` in
      `packages/ui/src/app/repository-provider.tsx`, with a `useXRepository()` accessor
- [ ] Screen in `packages/ui/src/screens/`, exported, with es-MX keys in
      `packages/ui/src/i18n/locales/es-mx.ts`
- [ ] Route in `apps/mobile/src/app/` (Expo Router)
- [ ] Maestro flow in `apps/mobile/maestro/flows/`, using the shared subflows — and every
      existing flow whose testIDs or navigation this changed is updated in the same change

## Crossing between them

- [ ] Wire contract in `packages/contracts` (zod), with its own test
- [ ] Outbox handling if the phone captures it — client-generated UUID, idempotent on it
- [ ] The data-pg ↔ SQLite drift test passes

---

## Verification

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check
pnpm lint:design          # portal work only; the ratchet may fall, never rise
pnpm --filter @xangarro/data-pg db:reset && pnpm --filter @xangarro/data-pg test:db
```
