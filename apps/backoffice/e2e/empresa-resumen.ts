import { expect, type Page } from '@playwright/test';
import { createCorpDb, movimientosDeCaja } from '@xangarro/data-corp';

import { autonomiaDeHoy, heroDe } from '../src/server/empresa/resumen-hero';

/**
 * E-16's steps for empresa.spec.ts. The hero reads every cash movement the
 * earlier tests left (funding, expenses, cobros), so its expected words are
 * worked from the ledger with the same query the page runs, never typed in.
 */
const hoy = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function revisarAutonomia(page: Page): Promise<void> {
  const db = createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);
  const hero = heroDe(autonomiaDeHoy(await movimientosDeCaja(db, hoy()), hoy()), hoy());
  const seccion = page.getByTestId('autonomia');
  if (hero.estado === 'sinDatos') {
    await expect(seccion).toContainText('Aún no hay movimientos');
    return;
  }
  await expect(seccion.getByRole('heading', { level: 2 })).toHaveText(hero.titulo);
  await expect(page.getByTestId('autonomia-pie')).toHaveText(hero.pie);
  await expect(page.getByTestId('autonomia-tarjeta')).toHaveText(
    hero.tarjetas.map((t) => new RegExp(`${t.etiqueta}${escapeRegExp(t.valor)}`)),
  );
}

export const kpi = (page: Page, label: string) =>
  page.getByTestId('kpi').filter({ hasText: label });

export const filaUtilidad = (page: Page, label: string) =>
  page.getByTestId('utilidad-fila').filter({ hasText: label });
