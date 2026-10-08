import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

/**
 * The corp database client. The console connects as `xangarro_corp`
 * (`CORP_DATABASE_URL`), never as its platform login: the platform role
 * cannot see this schema at all, and that is the point (ADR-124 §2).
 *
 * `prepare: false` for the same reason as data-pg's client: Supabase's
 * transaction pooler may hand each transaction a different connection.
 */
export type CorpDb = ReturnType<typeof createCorpDb>;

export function createCorpDb(url: string, max = 2) {
  const client = postgres(url, { max, prepare: false, onnotice: () => {} });
  return drizzle(client, { schema });
}
