import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import {
  RegistrarMovimientoUseCase,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import { balanceGeneral, type Movement } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb, type CorpDb } from '../src/client';
import { lineasDeCuenta, sumasAl } from '../src/queries/balance';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * Balance's read (E-12, board CD-08). The sheet is cumulative, so it runs in a
 * database of its own: every other file's rows would land in its sums. It
 * reads as `xangarro_corp`, the console's login, so the grants are proven too.
 *
 * The rows: a cobro of last year, a capital contribution and a paid expense
 * this year, one expense after the day, and a line in an account the chart
 * does not know (written as the owner: no use case can).
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-balance-test';

const movimiento = (fecha: string, movement: Movement): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `Balance ${movement.kind} ${fecha}`,
  contraparte: null,
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible: true,
  movement,
});

const gasto = (subtotal: bigint): Movement => ({
  kind: 'gasto',
  categoria: 'administracion',
  subtotal,
  iva: 0n,
  tratamientoIva: 'exento',
  retencionIsr: 0n,
  retencionIva: 0n,
  pagado: true,
});

describe('corp balance read', () => {
  let base: BaseDesechable;
  let db: CorpDb;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    await base.aplicar(() => true);
    const u = new URL(url as string);
    u.pathname = `/${base.nombre}`;
    db = createCorpDb(u.toString(), 1);
    const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(db));
    await registrar.execute(
      movimiento('2025-12-10', {
        kind: 'cobro',
        subtotal: 1_000_00n,
        iva: 160_00n,
        destino: 'bancos',
      }),
    );
    await registrar.execute(
      movimiento('2026-01-05', { kind: 'aportacion_capital', socio: 1, monto: 6_000_00n }),
    );
    await registrar.execute(movimiento('2026-03-03', gasto(500_00n)));
    await registrar.execute(movimiento('2026-05-01', gasto(9_999_00n)));
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
    await base?.cerrar();
  });

  it('sums every account up to the day, last year apart, into a sheet that balances', async () => {
    const b = balanceGeneral(await sumasAl(db, '2026-03-31'));
    assert.equal(b.activo.saldos.get('bancos'), 6_660_00n);
    assert.equal(b.pasivo.saldos.get('iva_trasladado'), 160_00n);
    assert.equal(b.capital.saldos.get('capital_social'), 6_000_00n);
    assert.equal(b.capital.saldos.get('resultados_acumulados'), 1_000_00n);
    assert.equal(b.capital.resultadoDelEjercicio, -500_00n);
    assert.equal(b.diferencia, 0n);
  });

  it('is empty before the first movement', async () => {
    assert.deepEqual(await sumasAl(db, '2025-12-09'), []);
  });

  it("lists an account's lines between two days, in date order", async () => {
    const lineas = await lineasDeCuenta(db, 'bancos', '2026-01-01', '2026-03-31');
    assert.deepEqual(
      lineas.map((l) => [l.fecha, l.debe, l.haber]),
      [
        ['2026-01-05', 6_000_00n, 0n],
        ['2026-03-03', 0n, 500_00n],
      ],
    );
    assert.match(lineas[0]?.concepto ?? '', /aportacion_capital/);
  });

  it('names an account outside the chart, and the sheet no longer balances', async () => {
    // One transaction: the ledger's trigger wants an entry's lines by its commit.
    const id = '01JBALANCECAJACHICA0000000';
    await base.sql.begin(async (tx) => {
      await tx`
        INSERT INTO corp.entries (id, fecha, kind, concepto, source, payload, created_by, created_at)
        VALUES (${id}, '2026-02-10', 'ajuste', 'Caja chica', 'manual', '{}'::jsonb, ${AUTOR}, now())`;
      await tx`
        INSERT INTO corp.entry_lines (id, entry_id, cuenta, debe, haber) VALUES
          ('01JBALANCECAJACHICAL000001', ${id}, 'caja_chica', 10000, 0),
          ('01JBALANCECAJACHICAL000002', ${id}, 'bancos', 0, 10000)`;
    });
    const b = balanceGeneral(await sumasAl(db, '2026-03-31'));
    assert.deepEqual(b.sinClasificar, [{ cuenta: 'caja_chica', entryId: id }]);
    assert.equal(b.diferencia, -100_00n);
  });
});
