import type { Config } from 'drizzle-kit';

/**
 * The corp schema's own migration journal (ADR-124 §2). Generated from the
 * schema, never hand-written, like data-pg's (CLAUDE.md §6). The one exception,
 * as there, is the grants file: Drizzle Kit does not model roles or GRANTs.
 *
 * `schemaFilter` keeps this journal blind to every other schema in the same
 * database, so `pg_dump -n corp` plus this folder is the whole of it.
 */
export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['corp'],
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/postgres' },
  strict: true,
  verbose: false,
} satisfies Config;
