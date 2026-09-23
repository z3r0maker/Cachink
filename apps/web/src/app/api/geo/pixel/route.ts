import { clientIp } from '@xangarro/auth-core';
import { throttleKey, throttleTake } from '@xangarro/data-pg';

import { db } from '@/server/db';
import { recordGeo } from '@/server/geo/record';
import { pixelResponse } from '@/server/geo/pixel';

/**
 * The marketing site's beacon (N-58, ADR-092): `<img src=".../api/geo/pixel">`
 * on xangarro.mx, which has no server of its own.
 *
 * It counts one visit by state and answers a 1×1 GIF. It sets no cookie,
 * issues no identifier and reads no body, so there is nothing to correlate
 * across visits — see `server/geo/pixel.ts`.
 *
 * **The response never depends on the write.** A marketing page must not show
 * a broken image because the database was busy, so the count is attempted and
 * every failure is swallowed (`recordGeo`).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Generous for a human, useless for a flood: the counter is one row per day. */
const PER_IP = { max: 60, window: 60 } as const;

export async function GET(request: Request): Promise<Response> {
  try {
    // The one place this feature touches the IP, and only as a SHA-256 — the
    // same thing every other throttled endpoint already does (ADR-079). The
    // count itself is taken from Vercel's derived region, never from here.
    const key = throttleKey('geo', 'pixel', 'ip', clientIp(request.headers));
    if ((await throttleTake(db(), key, PER_IP.max, PER_IP.window)) === 0) {
      await recordGeo('landing');
    }
  } catch {
    // Deliberately silent: `recordGeo` already reports, and a throttle that
    // cannot be read must not cost the visitor an image.
  }
  return pixelResponse();
}
