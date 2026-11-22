import type { Page } from '@playwright/test';
import {
  addOperator,
  addProduct,
  mintCodeFor,
  mintTenant,
  resetThrottle,
  walkOperatorDoor,
  type ProductRow,
  type Tenant,
} from '@xangarro/testing/tenant';
import { hash } from 'bcryptjs';

/**
 * The register's door on a business of the test's own (ADR-128), for what
 * `puertaOperador` cannot show. The seeded tenant every operador spec walks
 * is the design fixture's own data (Ana Robledo at Taquería Don Pedro, folios
 * past 400), so a screen still showing the fixture passes there. Here the
 * operator, the business and the folios are this test's, and a fixture leak
 * shows.
 */
export const OPERADORA = { nombre: 'Rosa Medina', nip: '4826' } as const;

export async function puertaPropia(
  page: Page,
  productos: readonly ProductRow[] = [],
  opciones: { readonly puedeCancelar?: boolean } = {},
): Promise<Tenant> {
  const t = await mintTenant({ label: 'Fonda' });
  await addOperator(t, {
    nombre: OPERADORA.nombre,
    pinHash: await hash(OPERADORA.nip, 10),
    permissions: { canCancelSales: opciones.puedeCancelar === true },
  });
  for (const p of productos) await addProduct(t, p);
  await resetThrottle();
  const code = await mintCodeFor(t);
  await page.goto('/operador/caja');
  await walkOperatorDoor(page, {
    email: t.email,
    code,
    operador: OPERADORA.nombre,
    nip: OPERADORA.nip,
    fondo: '500',
  });
  return t;
}
