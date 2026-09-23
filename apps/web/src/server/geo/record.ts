import 'server-only';

import { type GeoSource, recordGeoCount } from '@xangarro/data-pg';
import { headers } from 'next/headers';

import { db } from '../db';
import { reportError } from '../observability/report';
import { regionFromHeaders } from './headers';

/**
 * Count one visit from the approximate region Vercel derived (N-55, ADR-092).
 *
 * **Never allowed to fail its caller.** This sits on the sign-in path: a
 * counter that cannot be written is worth a report and nothing more, because
 * refusing someone's login to record a statistic would be absurd. Every error
 * is swallowed.
 *
 * The raw IP never reaches this path — see `./headers.ts`.
 */
export async function recordGeo(source: GeoSource): Promise<void> {
  try {
    const { country, region } = regionFromHeaders(await headers());
    await recordGeoCount(db(), source, country, region);
  } catch (error) {
    reportError(error, { endpoint: `geo/${source}` });
  }
}
