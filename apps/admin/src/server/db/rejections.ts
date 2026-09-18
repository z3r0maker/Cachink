import { rejectionDigest } from '@xangarro/data-pg';

import type { RejectionSource } from '../alerts/rejections';
import type { Db } from './client';

/**
 * Postgres adapter for the digest's rejection section (N-10): B-18's own
 * `rejectionDigest`, unchanged. Run as `xangarro_admin`, the `admin_read`
 * policy from 0007_admin_sync_rejections_read.sql makes it span every tenant;
 * the column grant keeps `payload` and `message` out of reach.
 */
export function drizzleRejectionSource(conn: Db): RejectionSource {
  return { since: (iso) => conn.transaction((tx) => rejectionDigest(tx, iso)) };
}
