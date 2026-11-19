import { randomUUID } from 'node:crypto';

import { expect, type Page } from '@playwright/test';
import { registrarRecurrente } from '@xangarro/application/corp';
import {
  createCorpDb,
  createCorpLedgerRepository,
  createRecurringTemplateRepository,
} from '@xangarro/data-corp';

import { withSuper } from './consola-fixture';
import { hoyEnMexico } from './empresa-limites';

/**
 * E-24's steps for empresa.spec.ts: a usage service added through the drawer
 * (board CD-18d), and last month's charge registered against the template it
 * made, so its page and the list read a real average. `clearLedgerFixture`
 * drops the service, its template and the charge.
 */
export function mesAnterior(): string {
  const [a, m] = hoyEnMexico().split('-').map(Number) as [number, number];
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
}

export async function nuevoServicioPorUso(page: Page, nombre: string): Promise<void> {
  await page.getByRole('link', { name: '+ Nuevo servicio' }).click();
  const cajon = page.getByRole('dialog', { name: 'Nuevo servicio' });
  await cajon.getByRole('textbox', { name: 'Nombre', exact: true }).fill(nombre);
  await cajon.getByLabel('Para qué lo usamos (opcional)').fill('Claude para los agentes');
  await cajon.getByText('Por uso', { exact: true }).click();
  await cajon.getByLabel('Avisar si el mes pasa de (opcional)').fill('2500');
  await cajon.getByLabel('Día del cargo').fill('3');
  await cajon.getByLabel('Se paga con').fill('Tarjeta •••• 4821');
  await cajon.getByRole('button', { name: 'Guardar servicio' }).click();
  await expect(page).toHaveURL(/\/empresa\/servicios\/[0-9a-f-]{36}$/);
}

/** Last month's charge of the service's template: $1,240.00 with its IVA in. */
export async function registrarCargoDe(nombre: string): Promise<void> {
  const [fila] = await withSuper(
    (sql) => sql`SELECT plantilla_id FROM corp.services WHERE nombre = ${nombre}`,
  );
  const plantilla = String(fila?.plantilla_id ?? '');
  const mes = mesAnterior();
  const db = createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);
  await registrarRecurrente(
    { ledger: createCorpLedgerRepository(db), plantillas: createRecurringTemplateRepository(db) },
    {
      movimiento: {
        fecha: `${mes}-03`,
        projectId: null,
        concepto: nombre,
        contraparte: null,
        founderId: 'e2e-servicios',
        source: 'manual',
        sourceRef: null,
        usd: null,
        deducible: true,
        movement: {
          kind: 'gasto',
          categoria: 'costo_servicio',
          subtotal: 1_068_97n,
          iva: 171_03n,
          tratamientoIva: 'acreditable',
          retencionIsr: 0n,
          retencionIva: 0n,
          pagado: true,
        },
      },
      nonce: randomUUID(),
      plantilla: { tipo: 'existente', id: plantilla, mes },
    },
  );
  await db.$client.end({ timeout: 5 });
}
