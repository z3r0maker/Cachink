import type { Page } from '@playwright/test';

import { loadPasskey, seededPasskeyId } from './passkeys';

export { ADMIN_COOKIE } from '../src/server/auth/config';

/**
 * Shared e2e helpers (the backoffice's first Playwright suite, N-05's
 * follow-up; passkeys since ADR-160). The staff account comes from the
 * environment (`E2E_STAFF_EMAIL`); its passkey is seeded by the suite's
 * fixture and loaded into Chromium's virtual authenticator (`./passkeys.ts`).
 */

export const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? 'e2e@xangarro.mx';

/** Who signs in: the auth suite's member by default, another spec's own otherwise. */
export interface StaffLogin {
  readonly email: string;
}

const DEFAULT_LOGIN: StaffLogin = { email: STAFF_EMAIL };

/** One tap on «Entrar con mi llave», with the member's seeded passkey in the page's authenticator. */
export async function signInAsStaff(page: Page, who: StaffLogin = DEFAULT_LOGIN): Promise<void> {
  const id = seededPasskeyId(who.email);
  const counter = await scalar<number>(
    `SELECT counter AS scalar FROM staff_passkeys WHERE id = '${id.replace(/[^A-Za-z0-9_-]/g, '')}'`,
  );
  await loadPasskey(page, who.email, Number(counter ?? 0));
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar con mi llave' }).click();
  // The action sets the cookie and redirects; the proxy then lets `/` through.
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 });
}

/** One scalar over a throwaway superuser connection (CI and db-local agree). */
export async function scalar<T = string>(query: string): Promise<T | null> {
  const url = process.env.DATABASE_SUPER_URL ?? process.env.DATABASE_URL ?? '';
  const { default: postgres } = await import('postgres');
  const conn = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const rows = (await conn.unsafe(query)) as unknown[];
    return ((rows[0] as Record<string, unknown>)?.scalar as T) ?? null;
  } finally {
    await conn.end({ timeout: 5 });
  }
}
