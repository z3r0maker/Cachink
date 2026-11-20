import type { Page } from '@playwright/test';
import { resetThrottle, seedDoorProducts, type ProductoPuerta } from '@xangarro/testing/tenant';

import { mintCode, pasarAcceso } from './acceso-flow';

/**
 * The operator door for the `operador` project (O-38): each test walks the
 * real Acceso (mint the panel's code, link this browser as a device, NIP
 * 2580, fondo), so the specs run behind the real gate against the register's
 * own database, never the fixture bypass. Per test, not per file: the
 * register's Worker holds OPFS exclusively, so two pages of one context
 * cannot share the database.
 *
 * The project runs one file at a time (like `sync`): each activation takes
 * one of Taquería's two device slots, and mintCode revokes the previous
 * test's devices before minting.
 *
 * The database half (the throttle reset and the products the bootstrap
 * carries) lives in `@xangarro/testing/tenant` since S-02 (ADR-153 §4).
 */
export type { ProductoPuerta } from '@xangarro/testing/tenant';

/** Codes come from the activation alphabet (Crockford, no I/L/O/U). */
const ALFABETO = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
function codigo(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return out;
}

export async function puertaOperador(
  page: Page,
  productos: readonly ProductoPuerta[] = [],
): Promise<void> {
  await resetThrottle();
  await seedDoorProducts(productos);
  await page.goto('/');
  const code = codigo();
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);
}
