import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { RegistrarMovimientoUseCase } from '@xangarro/application/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb, type CorpDb } from '../src/client';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { createTopesRepository, ingresosPorProyecto } from '../src/queries/limites';
import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * Límites (E-15) in a database of its own: 0010 rewound and applied (old →
 * new, CLAUDE.md §2.9), the caps kept per year as `xangarro_corp`, and a
 * year's income per project, with a second project the seed does not have.
 */
const { url, describe } = integrationSuite();

describe('corp límites', () => {
  let base: BaseDesechable;
  let db: CorpDb;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    await base.aplicar((f) => f < '0010');
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
    await base?.cerrar();
  });

  it("0010 adds the caps table with 2026's caps, writable by the console only", async () => {
    const [antes] = await base.sql`SELECT to_regclass('corp.annual_caps') IS NULL AS falta`;
    assert.equal(antes?.falta, true);
    await base.aplicar((f) => f.startsWith('0010'));
    const filas = await base.sql`SELECT anio, tope_sas, tope_resico FROM corp.annual_caps`;
    assert.deepEqual(
      filas.map((f) => [f.anio, String(f.tope_sas), String(f.tope_resico)]),
      [[2026, '767884994', '3500000000']],
    );
    const [p] = await base.sql`
      SELECT has_table_privilege('xangarro_corp', 'corp.annual_caps', 'UPDATE') AS consola,
             has_table_privilege('xangarro_corp_agent', 'corp.annual_caps', 'INSERT') AS agente,
             has_table_privilege('xangarro_corp', 'corp.annual_caps', 'DELETE') AS borra`;
    assert.deepEqual({ ...p }, { consola: true, agente: false, borra: false });
    const u = new URL(url as string);
    u.pathname = `/${base.nombre}`;
    db = createCorpDb(u.toString(), 1);
  });

  it('keeps a new year, newest first, and a correction replaces it', async () => {
    const topes = createTopesRepository(db);
    await topes.guardar({ anio: 2027, sas: 800_000_000n, resico: 3_500_000_000n }, 'f1');
    await topes.guardar({ anio: 2027, sas: 801_000_000n, resico: 3_500_000_000n }, 'f2');
    assert.deepEqual(
      (await topes.topes()).map((t) => [t.anio, t.sas]),
      [
        [2027, 801_000_000n],
        [2026, 767_884_994n],
      ],
    );
  });

  it('refuses a year the table does not take', async () => {
    await assert.rejects(
      createTopesRepository(db).guardar({ anio: 1999, sas: 1n, resico: 1n }, 'f1'),
    );
  });

  it("sums a year's income per project, IVA out, and leaves other years alone", async () => {
    await base.sql`INSERT INTO corp.projects (id, slug, nombre, created_at)
                   VALUES ('otro', 'otro', 'Otro proyecto', now())`;
    const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(db));
    const cobro = (fecha: string, projectId: string, subtotal: bigint) =>
      registrar.execute({
        fecha,
        projectId,
        concepto: `Cobro ${projectId} ${fecha}`,
        contraparte: null,
        founderId: 'f-limites-test',
        source: 'manual',
        sourceRef: null,
        usd: null,
        deducible: null,
        movement: { kind: 'cobro', subtotal, iva: (subtotal * 16n) / 100n, destino: 'bancos' },
      });
    await cobro('2025-12-20', 'xangarro', 9_000_00n);
    await cobro('2026-02-03', 'xangarro', 3_000_00n);
    await cobro('2026-03-03', 'xangarro', 1_000_00n);
    await cobro('2026-03-10', 'otro', 2_500_00n);
    const filas = await ingresosPorProyecto(db, '2026-01-01', '2026-12-31');
    assert.deepEqual(
      filas.map((f) => [f.nombre, f.monto]),
      [
        ['Xangarro', 4_000_00n],
        ['Otro proyecto', 2_500_00n],
      ],
    );
  });
});
