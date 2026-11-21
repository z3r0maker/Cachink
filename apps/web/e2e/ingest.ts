import { E2E_PORT } from './base-url';

/**
 * The console's ingest endpoint, as this suite sees it: a stand-in
 * (`./ingest-stub.mjs`) the Playwright config starts and points the portal's
 * `ADMIN_INGEST_URL` at, so an inbox item leaves the portal on its real wire
 * and a spec can read back what was filed.
 *
 * The port sits above the edge days' (`./dias-limite.ts`), out of the range
 * sibling sessions give `E2E_PORT`.
 */
export const INGEST_PORT = E2E_PORT + 1010;
export const INGEST_ORIGIN = `http://127.0.0.1:${INGEST_PORT}`;
export const INGEST_URL = `${INGEST_ORIGIN}/api/internal/support-items`;
/** Not a secret: it guards a process that holds test items in memory. */
export const INGEST_SECRET = 'e2e-ingest-secret';

/** The stand-in, as one of the Playwright config's `webServer` entries. */
export const INGEST_SERVER = {
  command: 'node e2e/ingest-stub.mjs',
  url: `${INGEST_ORIGIN}/health`,
  reuseExistingServer: !process.env.CI,
  timeout: 30_000,
  env: { INGEST_STUB_PORT: String(INGEST_PORT), INGEST_STUB_SECRET: INGEST_SECRET },
};

/** A portal server's environment, pointed at the stand-in. */
export function withIngest(env: Record<string, string>): Record<string, string> {
  return { ...env, ADMIN_INGEST_URL: INGEST_URL, ADMIN_INGEST_SECRET: INGEST_SECRET };
}

/** What the portal filed: `InboxItemRequest` as it arrived, read loosely on purpose. */
export interface FiledItem {
  readonly kind: string;
  readonly urgent: boolean;
  readonly businessId: string | null;
  readonly title: string;
  readonly body: string;
  readonly source: string;
  readonly sourceRef: string;
  readonly eventId?: string;
  readonly category?: string;
}

/** Every item the portal has filed for one business since the stand-in started. */
export async function itemsFiledFor(businessId: string): Promise<readonly FiledItem[]> {
  const url = `${INGEST_ORIGIN}/items?businessId=${encodeURIComponent(businessId)}`;
  const res = await fetch(url, { headers: { 'x-admin-ingest-secret': INGEST_SECRET } });
  if (!res.ok) throw new Error(`the ingest stand-in answered ${res.status}`);
  return (await res.json()) as readonly FiledItem[];
}
