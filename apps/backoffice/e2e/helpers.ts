import type { Page } from '@playwright/test';
import { totpCode } from '@xangarro/auth-core';

export { ADMIN_COOKIE } from '../src/server/auth/config';

/**
 * Shared e2e helpers (the backoffice's first Playwright suite, N-05's
 * follow-up). The staff account and its password come from the environment
 * (`E2E_STAFF_EMAIL` / `E2E_STAFF_PASSWORD`); the TOTP seed is read from the
 * enrolment page's own "escribe esta clave" text — the same thing a human
 * without a camera reads.
 */

export const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? 'e2e@xangarro.mx';
export const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? 'e2e-password-123';

/** The seed this run enrolled with, so later verifies can compute codes. */
let enrolledSeed: string | null = null;

/** Records a seed captured outside `signInAsStaff` (the enrolment spec). */
export function rememberSeed(seed: string): void {
  enrolledSeed = seed;
}

/** The seed text the enrolment page shows, de-grouped (`XXXX XXXX` → `XXXXXX`). */
export function seedFromPageText(grouped: string): string {
  return grouped.replace(/\s+/g, '');
}

/** A valid 6-digit code for the seed right now. */
export function codeFor(seed: string): string {
  return totpCode(seed, new Date());
}

/** The step a code was last rejected at (the replay guard consumed it). */
const consumedSteps = new Set<number>();

const stepNow = (): number => Math.floor(Date.now() / 30_000);

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * A code from a step this run has not used yet — `verifyTotp` rejects any
 * step at or before the last accepted one, so a second verify inside the
 * same 30-second window needs the NEXT step (up to ~30s of waiting).
 */
export async function freshCodeFor(seed: string): Promise<string> {
  const start = stepNow();
  if (!consumedSteps.has(start)) {
    consumedSteps.add(start);
    return codeFor(seed);
  }
  while (consumedSteps.has(stepNow())) await sleep(500);
  consumedSteps.add(stepNow());
  return codeFor(seed);
}

/** Signs in and, on the first-ever run, enrols TOTP; lands past the gates. */
export async function signInAsStaff(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', STAFF_EMAIL);
  await page.fill('input[name="password"]', STAFF_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  // The action's redirect is a soft navigation the proxy never sees; wait for
  // it to finish (the cookie is only set once it does), then a full load
  // re-gates and lands on the MFA step the AAL1 session owes.
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10_000 });
  await page.goto('/');

  if (page.url().includes('/mfa/enroll')) {
    const grouped = (await page.locator('code').first().textContent()) ?? '';
    const seed = seedFromPageText(grouped);
    enrolledSeed = seed;
    await page.fill('input[name="code"]', await freshCodeFor(seed));
    await page.getByRole('button', { name: 'Registrar' }).click();
    // The success view links on to verification; the cookie is already AAL2-side.
    const seguir = page.getByRole('link', { name: /ya los guard/i }).first();
    if (await seguir.isVisible().catch(() => false)) await seguir.click();
  }
  if (page.url().includes('/mfa/verify')) {
    // The verify page shows no seed (the human has it in their app); the
    // suite enrolled earlier in the run and remembers it.
    const seed = enrolledSeed;
    if (seed === null) throw new Error('verify reached before enrolment captured the seed');
    await page.fill('input[name="code"]', await freshCodeFor(seed));
    await page.getByRole('button', { name: 'Verificar' }).click();
    await page.waitForURL((u) => !u.pathname.startsWith('/mfa'), { timeout: 40_000 });
  }
  await page.waitForURL((u) => !u.pathname.startsWith('/login') && !u.pathname.startsWith('/mfa'));
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
