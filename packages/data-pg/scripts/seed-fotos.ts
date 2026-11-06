/**
 * One product photo (ADR-134, B-19): «Agua de horchata» has a 512 px WebP,
 * lifted off its background the way the phone leaves it, so the portal's
 * image route and P-42's Playwright sentinel have a real photo to find. Dated
 * at the seed's creation, older than any row a test pushes, so a test's own
 * photo of the same product always wins.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Sql } from 'postgres';

import { BIZ, CREATED, DEV, id } from './seed-data.js';

export const SEEDED_PHOTO_ID = id('FT001');
const HORCHATA = id('PHRC1');

export async function seedFotos(sql: Sql): Promise<void> {
  const bytes = readFileSync(resolve(import.meta.dirname, 'fixtures/horchata.webp'));
  await sql`
    INSERT INTO product_images (id, producto_id, mime, bytes, width, height,
                                business_id, device_id, created_at, updated_at)
    VALUES (${SEEDED_PHOTO_ID}, ${HORCHATA}, 'image/webp', ${bytes}, 512, 512,
            ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
}
