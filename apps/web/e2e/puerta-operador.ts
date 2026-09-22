import { execSync } from 'node:child_process';
import type { Page } from '@playwright/test';

import { mintCode, pasarAcceso } from './acceso-flow';

const HERE = import.meta.dirname;

/**
 * The operator door for the `operador` project (O-38): each test walks the
 * real Acceso — mint the panel's code, link this browser as a device, NIP
 * 2580, fondo — so the specs run behind the real gate against the register's
 * own database, never the fixture bypass. Per test, not per file: the
 * register's Worker holds OPFS exclusively, so two pages of one context
 * cannot share the database.
 *
 * The project runs one file at a time (like `sync`): each activation takes
 * one of Taquería's two device slots, and mintCode revokes the previous
 * test's devices before minting.
 */

/** Codes come from the activation alphabet (Crockford, no I/L/O/U). */
const ALFABETO = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
function codigo(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return out;
}

/** Activation's per-IP throttle (5 tries / 15 min) can't take a door per
 *  test. Keys are sha256-hashed, so the reset is the whole table — the same
 *  throwaway-database reset the backoffice suite's global setup does. */
async function desatascar(): Promise<void> {
  // The super URL comes from db-local.sh, the one source (the webServer env
  // does not reach the test process).
  const url =
    process.env.DATABASE_SUPER_URL ??
    execSync(`${HERE}/../../../packages/data-pg/scripts/db-local.sh super-url`).toString().trim();
  const { default: postgres } = await import('postgres');
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await sql`DELETE FROM xangarro.throttle`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function puertaOperador(page: Page): Promise<void> {
  await desatascar();
  // The shared storageState still carries the fixture-era demo flag (it dies
  // with the last converted file); this door is the real one.
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('xangarro.caja.demo'));
  const code = codigo();
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);
}
