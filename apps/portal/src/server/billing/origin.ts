import 'server-only';

import { headers } from 'next/headers';

/**
 * The portal's public origin for Stripe's return URLs: `PORTAL_URL` when set
 * (production); otherwise the request's own host (local, previews).
 */
export async function portalOrigin(): Promise<string> {
  if (process.env.PORTAL_URL) return process.env.PORTAL_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3100';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
