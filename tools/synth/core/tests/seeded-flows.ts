import { setTimeout as sleep } from 'node:timers/promises';

import { asTenant, walkOperatorDoor, walkOwnerDoor } from '@xangarro/testing/tenant';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

import { runAddress } from '../src/runner/address';
import type { Seed } from '../src/schemas/common';
import { seedRun, type RunAccess } from '../src/seed/seed';
import { afterDoor, webBase, type WebBase } from '../src/seeded/apply-web';
import { seededBug } from '../src/seeded/bugs';
import type { z } from 'zod';

/**
 * Scripted walks of the real register and wizard for `seeded.integration`
 * (S-12): no actor and no model, only Playwright on the corrida stack that
 * `stack run` brought up, with each bug applied exactly as the web runner
 * applies it (`seeded/apply-web.ts`).
 */
export const BASE = process.env.SYNTH_BASE_URL ?? '';
const TODAY = process.env.SYNTH_TODAY ?? new Date().toISOString().slice(0, 10);
let nextAddress = 0;

export interface Walk {
  readonly context: BrowserContext;
  readonly page: Page;
  readonly access: RunAccess;
}

/** Polls `read` until `ok` holds or `ms` pass; the last value either way. */
export async function until<T>(read: () => Promise<T>, ok: (v: T) => boolean, ms: number) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await read();
    if (ok(v) || Date.now() >= end) return v;
    await sleep(400);
  }
}

/** The proxies the walks started, closed by the suite's `afterAll`. */
const served: WebBase[] = [];
export const closeWalks = () => Promise.all(served.splice(0).map((s) => s.close()));

export async function newWalk(
  browser: Browser,
  o: { seed: z.infer<typeof Seed>; authAs: 'owner' | 'operador'; bug?: string; width?: number },
): Promise<Walk> {
  const bug = o.bug === undefined ? undefined : seededBug(o.bug);
  const base = await webBase(bug, BASE);
  served.push(base);
  const context = await browser.newContext({
    baseURL: base.baseUrl,
    viewport: { width: o.width ?? 1280, height: 800 },
    serviceWorkers: 'block',
    extraHTTPHeaders: { 'x-forwarded-for': runAddress(nextAddress++) },
  });
  const page = await context.newPage();
  const access = await seedRun({
    seed: o.seed,
    authAs: o.authAs,
    today: TODAY,
    allowedHosts: ['127.0.0.1', 'localhost'],
    label: 'sembrado',
  });
  await door(page, access, o.authAs);
  if (bug) await afterDoor(bug, context, page);
  return { context, page, access };
}

async function door(page: Page, access: RunAccess, authAs: 'owner' | 'operador') {
  if (authAs === 'owner') {
    await walkOwnerDoor(page, access.account);
    return;
  }
  const [op] = access.operators;
  if (op === undefined || access.tenant === null || access.activationCode === null) {
    throw new Error('the seed has no operator to walk the door with');
  }
  await page.goto('/operador/caja');
  await walkOperatorDoor(page, {
    email: access.tenant.email,
    code: access.activationCode,
    operador: op.nombre,
    nip: op.nip,
    fondo: '500',
  });
}

export const ticketPanel = (page: Page) => page.getByRole('complementary', { name: 'Ticket' });

export async function addRefresco(page: Page): Promise<void> {
  await page
    .getByRole('button', { name: /Refresco de cola/ })
    .first()
    .click();
}

/** A card sale: registered at once, no cash step. */
export async function sellByCard(page: Page): Promise<void> {
  await addRefresco(page);
  await ticketPanel(page).getByRole('radio', { name: 'Tarjeta', exact: true }).click();
  await ticketPanel(page).getByRole('button', { name: 'Cobrar', exact: true }).click();
  await page.getByRole('status').getByText('Venta registrada').waitFor();
}

/** «Deshacer» on the card, then the cancel with the operator's NIP; the dialog. */
export async function undoWithNip(page: Page, nip: string) {
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
  const dialogo = page.getByRole('alertdialog');
  await dialogo.getByLabel('Tu NIP').fill(nip);
  await dialogo.getByRole('button', { name: 'Cancelar venta' }).click();
  return dialogo;
}

/** The tenant's tickets on the server: how many, and how many cancelled. */
export const serverTickets = (biz: string) =>
  asTenant(biz, async (sql) => {
    const [r] = await sql`
      SELECT count(*)::int AS n, count(cancelled_at)::int AS cancelled FROM tickets`;
    return { n: Number(r?.n ?? 0), cancelled: Number(r?.cancelled ?? 0) };
  });

export const launch = () => chromium.launch({ headless: true });
