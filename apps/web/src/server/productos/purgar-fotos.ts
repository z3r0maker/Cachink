import 'server-only';

import { purgeSupersededImages } from '@xangarro/data-pg';

import { db } from '../db';

/**
 * The nightly purge of superseded product photos (ADR-134, B-19): every row a
 * newer row of the same product replaced over 30 days ago, in every business.
 * The newest row of a product is never touched.
 */
export async function runPurgarFotos(): Promise<{ readonly purgadas: number }> {
  return { purgadas: await purgeSupersededImages(db()) };
}
