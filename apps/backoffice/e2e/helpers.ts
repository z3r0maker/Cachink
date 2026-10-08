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

/** Who signs in: the auth suite's member by default, another spec's own otherwise. */
export interface StaffLogin {
  readonly email: string;
  readonly password: string;
}

const DEFAULT_LOGIN: StaffLogin = { email: STAFF_EMAIL, password: STAFF_PASSWORD };

/**
 * The seed each member enrolled with this run, so later verifies can compute
 * codes. Keyed by email: two specs sharing a worker must not hand one member's
 * seed to the other.
 */
const enrolledSeeds = new Map<string, string>();

/** Records a seed captured outside `signInAsStaff` (the enrolment spec). */
export function rememberSeed(seed: string, email: string = STAFF_EMAIL): void {
  enrolledSeeds.set(email.toLowerCase(), seed);
}

/** The seed text the enrolment page shows, de-grouped (`XXXX XXXX` → `XXXXXX`). */
export function seedFromPageText(grouped: string): string {
  return grouped.replace(/\s+/g, '');
}

/** A valid 6-digit code for the seed right now. */
export function codeFor(seed: string): string {
  return totpCode(seed, new Date());
}

/** The steps already used, per seed (the replay guard is per member). */
const consumedSteps = new Map<string, Set<number>>();

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
  const used = consumedSteps.get(seed) ?? new Set<number>();
  consumedSteps.set(seed, used);
  while (used.has(stepNow())) await sleep(500);
  used.add(stepNow());
  return codeFor(seed);
}

/** Signs in and, on the first-ever run, enrols TOTP; lands past the gates. */
export async function signInAsStaff(page: Page, who: StaffLogin = DEFAULT_LOGIN): Promise<void> {
  const key = who.email.toLowerCase();
  await page.goto('/login');
  await page.fill('input[name="email"]', who.email);
  await page.fill('input[name="password"]', who.password);
  await page.getByRole('button', { name: 'Abrir la trastienda' }).click();
  // The action's redirect is a soft navigation the proxy never sees; wait for
  // it to finish (the cookie is only set once it does), then a full load
  // re-gates and lands on the MFA step the AAL1 session owes.
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10_000 });
  await page.goto('/');

  if (page.url().includes('/mfa/enroll')) {
    const grouped = (await page.locator('code').first().textContent()) ?? '';
    const seed = seedFromPageText(grouped);
    enrolledSeeds.set(key, seed);
    await page.fill('input[name="code"]', await freshCodeFor(seed));
    await page.getByRole('button', { name: 'Registrar' }).click();
    // The success view links on to verification (or past it, when the gate
    // already counts the session as AAL2). The codes render once the action
    // answers: wait for them, not a glance.
    const seguir = page.getByRole('link', { name: /ya los guard/i }).first();
    await seguir.waitFor({ state: 'visible', timeout: 15_000 });
    await seguir.click();
    await page.waitForURL((u) => !u.pathname.startsWith('/mfa/enroll'), { timeout: 10_000 });
  }
  if (page.url().includes('/mfa/verify')) {
    // The verify page shows no seed (the human has it in their app); the
    // suite enrolled earlier in the run and remembers it.
    const seed = enrolledSeeds.get(key);
    if (seed === undefined) throw new Error('verify reached before enrolment captured the seed');
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
