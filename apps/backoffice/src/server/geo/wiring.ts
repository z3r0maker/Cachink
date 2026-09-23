import { drizzleGeoRollup } from '../db/geo';
import type { Db, Tx } from '../db/client';
import type { GeoDeps } from './list';

/**
 * The one place the geo page's adapter is chosen (N-56), mirroring
 * `tenants/wiring.ts`. The use case never sees Postgres and the tests never
 * see a connection.
 */
export function geoDeps(conn: Db | Tx): GeoDeps {
  return { geo: drizzleGeoRollup(conn) };
}
