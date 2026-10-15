import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import {
  RevertirMovimientoUseCase,
  registrarRecurrente,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { createRecurringTemplateRepository } from '../src/queries/recurrentes';
import { borrarLoDe } from './cleanup';

/**
 * E-02's recurring templates in the corp schema: a capture makes one, its
 * month reads as registered until the charge is reversed, the console role may
 * stop one but never delete it, and 0005 carries a template of the old shape.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-recurrentes-test';
const MIGRATION = join(import.meta.dirname, '../drizzle/0005_corp_recurrentes.sql');

const env = (name: string) => {
  const v = process.env[name];
  if (v === undefined || v === '') throw new Error(`${name} is required`);
  return v;
};

let seq = 0;
const mesLibre = () => {
  const n = (Date.now() + seq++ * 11) % 9600;
  return `${2100 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};

const gasto = (fecha: string): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: 'Vercel',
  contraparte: 'Vercel Inc.',
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: { montoOriginal: 20_00n, tipoCambio: '18.42' },
  deducible: true,
  movement: {
    kind: 'gasto',
    categoria: 'costo_servicio',
    subtotal: 368_40n,
    iva: 0n,
    tratamientoIva: 'exento',
    retencionIsr: 0n,
    retencionIva: 0n,
    pagado: true,
  },
});

describe('corp recurring templates', () => {
  let corp: postgres.Sql;
  let owner: postgres.Sql;
  const deps = () => {
    const db = createCorpDb(url as string);
    return {
      ledger: createCorpLedgerRepository(db),
      plantillas: createRecurringTemplateRepository(db),
    };
  };

  beforeAll(() => {
    corp = postgres(url as string, { max: 1, onnotice: () => {} });
    owner = postgres(env('DATABASE_SUPER_URL'), { max: 1, onnotice: () => {} });
  });
  afterAll(async () => {
    await Promise.all([corp.end(), owner.end()]);
    await borrarLoDe(AUTOR);
  });

  it('makes a template from a capture and reads its month as registered', async () => {
    const mes = mesLibre();
    const id = `rec-${randomUUID()}`;
    const d = deps();
    const { entry, plantilla } = await registrarRecurrente(d, {
      movimiento: gasto(`${mes}-28`),
      nonce: `manual-${randomUUID()}`,
      plantilla: { tipo: 'nueva', id },
    });
    assert.deepEqual(
      [
        plantilla.montoEstimado,
        plantilla.moneda,
        plantilla.diaCargo,
        plantilla.desde,
        plantilla.activo,
      ],
      [20_00n, 'USD', 28, mes, true],
    );
    assert.equal((await d.plantillas.registradasEn(mes)).get(id), entry.id);
    assert.ok((await d.plantillas.list()).some((p) => p.id === id));
  });

  it('forgets a reversed charge, so the month can be registered again', async () => {
    const mes = mesLibre();
    const id = `rec-${randomUUID()}`;
    const d = deps();
    const { entry } = await registrarRecurrente(d, {
      movimiento: gasto(`${mes}-28`),
      nonce: `manual-${randomUUID()}`,
      plantilla: { tipo: 'nueva', id },
    });
    await new RevertirMovimientoUseCase(d.ledger).execute({
      entryId: entry.id,
      fecha: `${mes}-28`,
      motivo: 'Monto equivocado',
      founderId: AUTOR,
    });
    assert.equal((await d.plantillas.registradasEn(mes)).has(id), false);
  });

  it('lets the console stop a template but never delete one', async () => {
    const mes = mesLibre();
    const id = `rec-${randomUUID()}`;
    const d = deps();
    await registrarRecurrente(d, {
      movimiento: gasto(`${mes}-05`),
      nonce: `manual-${randomUUID()}`,
      plantilla: { tipo: 'nueva', id },
    });
    await d.plantillas.setActivo(id, false);
    assert.equal((await d.plantillas.findById(id))?.activo, false);
    await assert.rejects(
      corp`DELETE FROM corp.recurring_templates WHERE id = ${id}`,
      /permission denied/,
    );
  });

  it('refuses, in the database, a charge day or an amount that cannot be', async () => {
    const insert = (dia: number, monto: number) =>
      corp`INSERT INTO corp.recurring_templates
             (id, nombre, categoria, moneda, monto_estimado, dia_cargo, desde, created_by, created_at)
           VALUES (${`rec-${randomUUID()}`}, 'Mal', 'desarrollo', 'MXN', ${monto}, ${dia},
                   '2026-10', ${AUTOR}, now())`;
    await assert.rejects(insert(0, 100), /recurring_templates_dia_check/);
    await assert.rejects(insert(10, 0), /recurring_templates_monto_check/);
  });

  it('0005 starts a template of the old shape in the month it was made, in Mexico City', async () => {
    const id = `rec-${randomUUID()}`;
    const ROLLBACK = new Error('rollback');
    await assert.rejects(
      owner.begin(async (tx) => {
        await tx.unsafe(`ALTER TABLE corp.recurring_templates
          DROP CONSTRAINT recurring_templates_dia_check,
          DROP CONSTRAINT recurring_templates_monto_check,
          DROP CONSTRAINT recurring_templates_categoria_check,
          DROP CONSTRAINT recurring_templates_desde_check,
          DROP COLUMN contraparte, DROP COLUMN deducible, DROP COLUMN desde, DROP COLUMN created_by`);
        // 03:00 UTC on 1 October is still 30 September in Mexico City.
        await tx`INSERT INTO corp.recurring_templates
                   (id, nombre, categoria, moneda, monto_estimado, dia_cargo, created_at)
                 VALUES (${id}, 'Contador', 'administracion', 'MXN', 350000, 12,
                         '2026-10-01T03:00:00Z')`;
        await tx.unsafe(readFileSync(MIGRATION, 'utf8'));
        const [row] = await tx<{ desde: string; deducible: boolean }[]>`
          SELECT desde, deducible FROM corp.recurring_templates WHERE id = ${id}`;
        assert.deepEqual({ ...row }, { desde: '2026-09', deducible: true });
        throw ROLLBACK;
      }),
      (e) => e === ROLLBACK,
    );
  });
});
