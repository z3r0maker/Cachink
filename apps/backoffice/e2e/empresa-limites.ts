import { RegistrarMovimientoUseCase } from '@xangarro/application/corp';
import { createCorpDb, createCorpLedgerRepository } from '@xangarro/data-corp';

import { stamp, withSuper } from './consola-fixture';

/**
 * E-15's steps for empresa.spec.ts. A project of its own («E2E Límites») with
 * one cobro today shows in «De dónde salen las cifras» beside Xangarro's: two
 * projects, one gauge. The year's caps are made sure of first, then taken out
 * to prove the drawer asks for them rather than using last year's;
 * `clearLedgerFixture` drops the project and puts 2026's caps back.
 */
export const hoyEnMexico = (): string =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

export async function asegurarTopes(anio: string): Promise<void> {
  await withSuper(
    (sql) => sql`INSERT INTO corp.annual_caps (anio, tope_sas, tope_resico, updated_by, updated_at)
                 VALUES (${Number(anio)}, 767884994, 3500000000, 'e2e-limites', now())
                 ON CONFLICT (anio) DO NOTHING`,
  );
}

export async function quitarTopes(anio: string): Promise<void> {
  await withSuper((sql) => sql`DELETE FROM corp.annual_caps WHERE anio = ${Number(anio)}`);
}

export async function sembrarCobroDelAnio(hoy: string): Promise<void> {
  await withSuper(
    (sql) => sql`INSERT INTO corp.projects (id, slug, nombre, created_at)
                 VALUES ('e2e-limites', 'e2e-limites', 'E2E Límites', now())
                 ON CONFLICT (id) DO NOTHING`,
  );
  const db = createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);
  await new RegistrarMovimientoUseCase(createCorpLedgerRepository(db)).execute({
    fecha: hoy,
    projectId: 'e2e-limites',
    concepto: 'E2E Límites cobro',
    contraparte: null,
    founderId: 'e2e-limites',
    source: 'manual',
    sourceRef: `e2e-limites-${stamp()}`,
    usd: null,
    deducible: null,
    movement: { kind: 'cobro', subtotal: 1_234_00n, iva: 197_44n, destino: 'bancos' },
  });
  await db.$client.end({ timeout: 5 });
}
