import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { deviceHeaders } from '@xangarro/contracts';
import postgres from 'postgres';

import { activate, freshCode } from './device-helpers';
import { latestMailTo } from './outbox';

/**
 * Device slots (B-12), end to end — the task's own acceptance:
 * "activate → revoke → activate again with a new code succeeds and slot count
 * is unchanged."
 *
 * Taquería Don Pedro is seeded at its plan's limit (Xangarro: 2 devices, both
 * present). That is realistic, and it is what makes this testable: the first
 * activation must be refused, the portal's Revocar must free a slot, and the
 * next activation must fit into exactly that slot.
 *
 * Desktop only: it revokes and activates on the shared demo business.
 *
 * **Serial.** Everything in this file mutates Taquería's activation codes or
 * device slots, and `generarCodigo` deliberately expires *every* unredeemed
 * code for the business. Run in parallel, one test's "Generar otro" expired
 * another's code mid-flight — the product doing exactly what it should, and
 * the tests racing each other. They live together and run in order.
 */
test.describe.configure({ mode: 'serial' });

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

test('generating a code replaces the old one rather than adding to it', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates shared rows');

  await page.goto('/equipo');
  // SegmentedTabs renders aria-pressed buttons in a labelled group, not a
  // Radix tab list (see components/tabs.tsx for why), so it is a button here.
  await page
    .getByRole('group', { name: 'Tu equipo' })
    .getByRole('button', { name: /Dispositivos/ })
    .click();

  const generate = page.getByRole('button', { name: /Generar (código|otro)/ });
  await generate.click();
  const first = await page.getByTestId('activation-code').getAttribute('aria-label');
  await generate.click();
  await expect(page.getByTestId('activation-code')).not.toHaveAttribute('aria-label', first ?? '');

  // The handoff the code alone never had: the panel must say where it is
  // typed — the register's own door — or the director is guessing.
  await expect(page.getByTestId('pairing-register-url')).toContainText('/operador');

  // The security property, asserted on the rows rather than the screen: an
  // activation code is a bearer credential, so "Generar otro" must leave
  // exactly ONE redeemable code, not two. A panel that simply showed the newest
  // would look identical while leaving the old one live.
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    const [row] = await sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM activation_codes
      WHERE redeemed_at IS NULL AND expires_at > now()`;
    expect(row?.n, 'exactly one live code after regenerating').toBe('1');
  } finally {
    await sql.end({ timeout: 5 });
  }
});

test('a full plan refuses a new phone until one is revoked', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'revokes and activates on shared rows');

  // At the limit: refused with the contract's code, and the code is NOT burned
  // — the refusal rolls the claim back, so the same code works once a slot frees.
  const code = await freshCode(page);
  const refused = await activate(page, code);
  expect(refused.status()).toBe(402);
  expect((await refused.json()).error.code).toBe('NO_DEVICE_SLOTS');

  // Free a slot from the portal, through the confirmation.
  await page.goto('/equipo');
  await page
    .getByRole('group', { name: 'Tu equipo' })
    .getByRole('button', { name: /Dispositivos/ })
    .click();
  await page.getByRole('button', { name: 'Revocar' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Revocar' }).click();
  await expect(page.getByText('Revocado').first()).toBeVisible();

  // The SAME code now succeeds: proof the earlier refusal rolled the claim back
  // rather than burning a code the shopkeeper had already handed out.
  const accepted = await activate(page, code);
  expect(accepted.status(), JSON.stringify(await accepted.json())).toBe(200);

  // And the plan is full again — the new phone took the freed slot, not an extra one.
  const again = await activate(page, await freshCode(page));
  expect(again.status()).toBe(402);
});

/**
 * The race the code claim does NOT settle.
 *
 * Two *different* codes for the same business, redeemed at once, with one slot
 * left. Each would count `limit − 1` active devices and insert — one phone over
 * the plan. `assertSlotFree` locks the business row first, which serialises
 * activations per business. Run against the conformance tenant, which has free
 * slots and no demo data to disturb.
 */
test('two phones racing for the last slot: exactly one gets it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'activates on shared rows');

  const CNF = '01HZ8XQN9GZJXV8AKQ5X0CNF01';
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  const codes: string[] = [];
  try {
    await sql`SELECT set_config('xangarro.business_id', ${CNF}, false)`;
    await sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`;
    const expires = new Date(Date.now() + 3_600_000).toISOString();
    for (const code of ['RACEAAA2', 'RACEBBB2', 'RACECCC2']) {
      await sql`
        INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
        VALUES (${code}, 'conformance@xangarro.mx', ${expires}, ${CNF}, now(), now())
      ON CONFLICT (code) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at,
        business_id = EXCLUDED.business_id, redeemed_at = NULL, redeemed_by_device_id = NULL,
        updated_at = now()`;
      codes.push(code);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  const go = (code: string) =>
    page.request.post('/api/v1/activate', {
      headers: deviceHeaders(),
      data: {
        email: 'conformance@xangarro.mx',
        code,
        device: { name: code, platform: 'ios', appVersion: '0.1.0', osVersion: '18' },
      },
    });

  // One slot of two used, leaving exactly one.
  expect((await go(codes[0] as string)).status()).toBe(200);

  const [a, b] = await Promise.all([go(codes[1] as string), go(codes[2] as string)]);
  expect([a.status(), b.status()].sort()).toEqual([200, 402]);
});

/**
 * `GET /entitlement` (B-06) for a real device, then for the same device revoked.
 *
 * The conformance suite covers the happy path against this server; revocation
 * it can only check on the mock (a header scenario). Here it is the real
 * thing: the token stays validly signed, and the `devices` row says no.
 */
test('the entitlement refresh honours revocation, not just the signature', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'activates on shared rows');

  const CNF = '01HZ8XQN9GZJXV8AKQ5X0CNF01';
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  const expires = new Date(Date.now() + 3_600_000).toISOString();
  try {
    await sql`SELECT set_config('xangarro.business_id', ${CNF}, false)`;
    await sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`;
    await sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES ('ENTTLMN2', 'conformance@xangarro.mx', ${expires}, ${CNF}, now(), now())
      ON CONFLICT (code) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at,
        business_id = EXCLUDED.business_id, redeemed_at = NULL, redeemed_by_device_id = NULL,
        updated_at = now()`;

    const act = await activate(page, 'ENTTLMN2', 'conformance@xangarro.mx');
    expect(act.status()).toBe(200);
    const { deviceToken, deviceId } = await act.json();
    const refresh = (token: string) =>
      page.request.get('/api/v1/entitlement', { headers: deviceHeaders(token) });

    const live = await refresh(deviceToken);
    expect(live.status()).toBe(200);
    expect((await live.json()).entitlement.payload.businessId).toBe(CNF);

    expect((await refresh(`${deviceToken}x`)).status()).toBe(401);
    const noProtocol = await page.request.get('/api/v1/entitlement', {
      headers: { authorization: `Bearer ${deviceToken}` },
    });
    expect(noProtocol.status()).toBe(426);

    await sql`UPDATE devices SET revoked_at = now() WHERE id = ${deviceId}`;
    const revoked = await refresh(deviceToken);
    expect(revoked.status()).toBe(401);
    expect((await revoked.json()).error.code).toBe('DEVICE_REVOKED');
  } finally {
    await sql.end({ timeout: 5 });
  }
});

/** P-06: the live code goes by email to whatever address the owner names.
 * Desktop only: the outbox keys a send by the code (idempotency), so a second
 * viewport sending the same live code is — correctly — deduped. */
test('«Enviar por correo» delivers the live code', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one outbox per live code');
  const address = `codigo-${randomUUID()}@test.mx`;
  await page.goto('/equipo?tab=dispositivos');
  await page.getByTestId('enviar-codigo-correo').fill(address);
  await page.getByRole('button', { name: 'Enviar por correo' }).click();
  await expect(page.getByText(`Enviado a ${address}.`)).toBeVisible();

  const mail = await latestMailTo(address);
  expect(mail).not.toBeNull();
  const code = (await page.getByTestId('activation-code').getAttribute('aria-label'))?.replace(
    'Código ',
    '',
  );
  expect(mail).toContain(code ?? '——');
  // The business name is read live; an earlier spec may have renamed it, so
  // the code — the panel's own state — is the assertion that matters.
});
