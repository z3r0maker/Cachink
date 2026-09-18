import type { Config } from 'drizzle-kit';

/**
 * Migrations are **generated from the schema**, never hand-written — the same
 * rule CLAUDE.md §6 sets for the device ("no hand-written SQL; use Drizzle
 * migrations"). The RLS policies are the one exception and live in their own
 * numbered file, because Drizzle Kit does not model them.
 */
export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/postgres' },
  strict: true,
  verbose: false,
} satisfies Config;
