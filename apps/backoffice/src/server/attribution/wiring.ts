import { drizzleAttribution } from '../db/attribution';
import type { Db, Tx } from '../db/client';
import type { AttributionDeps } from './list';

/** The one place the campaigns page's adapter is chosen (N-57). */
export function attributionDeps(conn: Db | Tx): AttributionDeps {
  return { attribution: drizzleAttribution(conn) };
}
