/**
 * Drizzle Kit configuration (P1B-M3-T02).
 *
 * `generate` reads ./src/schema/index.ts, diffs it against the latest
 * snapshot in ./drizzle/migrations/meta/, and emits a new numbered SQL
 * migration + snapshot. `casing: 'snake_case'` makes Drizzle map the
 * camelCase TypeScript column names to snake_case SQL columns without
 * an explicit second argument per column.
 *
 * Workflow: see packages/data/README.md.
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: './drizzle/migrations',
  casing: 'snake_case',
});
