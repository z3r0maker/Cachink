import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { RegistrarMovimientoUseCase, RevertirMovimientoUseCase } from '@xangarro/application/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { borrarLoDe } from './cleanup';
import { createCorpLedgerRepository } from '../src/queries/ledger';

/**
 * E-02's storage (ADR-124 §4): the ledger port writes balanced entries and
 * reads them back as the domain's lines; the database itself refuses an
 * unbalanced entry, an entry in a closed month, and any edit or delete.
 */
const { url, describe } = integrationSuite();
const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is not set`);
  return value;
};

const FECHA = '2031-03-14';
const CERRADO = '2031-02';

const vercel = (sourceRef: string | null) => ({
  fecha: FECHA,
  projectId: 'xangarro',
  concepto: 'Vercel',
  contraparte: 'Vercel Inc.',
  founderId: 'f-ledger-test',
  source: 'manual' as const,
  sourceRef,
  usd: { montoOriginal: 20_00n, tipoCambio: '18.42' },
  deducible: true,
  movement: {
    kind: 'gasto' as const,
    categoria: 'costo_servicio' as const,
    subtotal: 368_40n,
    iva: 0n,
    tratamientoIva: 'exento' as const,
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  },
});

describe('corp ledger storage', () => {
  let owner: postgres.Sql;
  let corp: postgres.Sql;
  const repo = () => createCorpLedgerRepository(createCorpDb(url as string));

  beforeAll(async () => {
    owner = postgres(env('DATABASE_SUPER_URL'), { max: 1, onnotice: () => {} });
    corp = postgres(url as string, { max: 1, onnotice: () => {} });
    await owner`INSERT INTO corp.closed_periods (period, closed_by, closed_at)
                VALUES (${CERRADO}, 'test', now()) ON CONFLICT DO NOTHING`;
  });

  afterAll(async () => {
    await Promise.all([owner.end(), corp.end()]);
    await borrarLoDe('f-ledger-test');
  });

  it('records a USD expense and reads back the same balanced lines', async () => {
    const saved = await new RegistrarMovimientoUseCase(repo()).execute(vercel(null));
    assert.equal(saved.montoOriginal, 20_00n);
    assert.equal(saved.tipoCambio, '18.42');
    assert.deepEqual(
      saved.lines.map((l) => [l.cuenta, l.debe, l.haber]),
      [
        ['costo_servicio', 368_40n, 0n],
        ['bancos', 0n, 368_40n],
      ],
    );
  });

  it('imports once per source reference', async () => {
    const ref = `ref-${randomUUID()}`;
    const uc = new RegistrarMovimientoUseCase(repo());
    const first = await uc.execute({ ...vercel(ref), usd: null });
    const again = await uc.execute({ ...vercel(ref), usd: null });
    assert.equal(again.id, first.id);
  });

  it('reverses an entry exactly once', async () => {
    const r = repo();
    const saved = await new RegistrarMovimientoUseCase(r).execute(vercel(null));
    const rev = await new RevertirMovimientoUseCase(r).execute({
      entryId: saved.id,
      fecha: FECHA,
      motivo: 'Duplicado',
      founderId: 'f-ledger-test',
    });
    assert.equal(rev.reversesEntryId, saved.id);
    assert.equal(rev.lines[1]?.debe, 368_40n);
  });

  it('refuses, in the database, an entry whose lines do not balance', async () => {
    const id = randomUUID();
    await assert.rejects(
      corp.begin(async (tx) => {
        await tx`INSERT INTO corp.entries (id, fecha, kind, concepto, source, payload, created_by, created_at)
                 VALUES (${id}, ${FECHA}, 'ajuste', 'Mal', 'manual', '{}'::jsonb, 'f', now())`;
        await tx`INSERT INTO corp.entry_lines (id, entry_id, cuenta, debe, haber)
                 VALUES (${`${id}-0`}, ${id}, 'bancos', 100, 0), (${`${id}-1`}, ${id}, 'financiero', 0, 99)`;
      }),
      /does not balance/,
    );
  });

  it('refuses, in the database, an entry dated in a closed month', async () => {
    const id = randomUUID();
    await assert.rejects(
      corp`INSERT INTO corp.entries (id, fecha, kind, concepto, source, payload, created_by, created_at)
           VALUES (${id}, ${`${CERRADO}-10`}, 'ajuste', 'Tarde', 'manual', '{}'::jsonb, 'f', now())`,
      /is closed/,
    );
  });

  it('never lets the console edit or delete an entry or a line', async () => {
    await assert.rejects(corp`UPDATE corp.entries SET concepto = 'x'`, /permission denied/);
    await assert.rejects(corp`DELETE FROM corp.entry_lines`, /permission denied/);
    await assert.rejects(corp`DELETE FROM corp.entries`, /permission denied/);
  });
});
