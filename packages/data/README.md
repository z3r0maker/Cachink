# @cachink/data

Repository interfaces, Drizzle/SQLite schema, and hardware abstraction
interfaces for Cachink.

## Schema & migrations

The Drizzle schema lives in [`src/schema/`](./src/schema). Each file defines
one table and mirrors its Zod schema in `@cachink/domain/entities` 1:1.

### Generating a new migration

1. Edit a file in `src/schema/` (or add a new one and re-export it from
   `src/schema/index.ts`).
2. From the monorepo root:

   ```bash
   pnpm --filter @cachink/data db:generate
   ```

3. Drizzle Kit writes a numbered SQL file under `drizzle/migrations/` plus
   snapshot + journal entries in `drizzle/migrations/meta/`. **Commit all
   three**.
4. Sanity-check the generated diff with `pnpm --filter @cachink/data db:check`.

### Rules for committed migrations

- **Never edit a migration that has already been committed.** Drizzle Kit
  detects subsequent schema changes by diffing against the last snapshot;
  editing an old file corrupts the chain (CLAUDE.md §2 principle 9 — no
  silent breaking changes).
- If a schema change landed incorrectly, write a new migration that reverses
  or fixes it. Add a note in [`ARCHITECTURE.md`](../../ARCHITECTURE.md) via
  an ADR when the change is user-impacting.
- Migrations replay in lexical order by filename; the auto-generated
  `NNNN_adjective_noun.sql` naming keeps ordering deterministic.

### Running migrations at runtime

- **Mobile (Expo):** `expo-sqlite` opens the DB; the app's composition
  root runs pending migrations from `drizzle/migrations/` on first launch
  (lands in P1C-M2).
- **Desktop (Tauri):** `@tauri-apps/plugin-sql` opens the DB; the same
  composition-root flow replays migrations.
- **Tests:** the integration test in `tests/schema.integration.test.ts`
  uses `better-sqlite3` + `drizzle-orm/better-sqlite3/migrator` against an
  in-memory database.
