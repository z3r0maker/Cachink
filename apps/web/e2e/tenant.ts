import type { Tenant } from '@xangarro/testing/tenant';

import type { Page } from './test';

/**
 * A tenant of its own, for a spec that writes (ADR-128).
 *
 * The factory lives in `@xangarro/testing/tenant` since S-02 (ADR-153 §4), so
 * the portal's e2e and Synth mint through one place. This file keeps what is
 * typed on Playwright's `Page`, the walk through the owner's door, and
 * re-exports the rest so no spec's import changed.
 */
export {
  addMember,
  clientIp,
  mintTenant,
  stamp,
  subscriptionIdOf,
  type MintOptions,
  type Plan,
  type Status,
  type Tenant,
} from '@xangarro/testing/tenant';

/**
 * Fills the owner's door and presses it, without claiming it opens.
 *
 * For the specs whose subject is a refusal: an archived business, a locked
 * address. `signIn` is the same walk plus the landing.
 */
export async function submitSignIn(
  page: Page,
  t: Pick<Tenant, 'email' | 'password'>,
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(t.email);
  await page.getByTestId('login-password').fill(t.password);
  await page.getByRole('button', { name: 'Abrir mi changarro' }).click();
}

/** Through the real door, as its owner, and inside. */
export async function signIn(page: Page, t: Pick<Tenant, 'email' | 'password'>): Promise<void> {
  await submitSignIn(page, t);
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
}
