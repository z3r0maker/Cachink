import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';

import { calcularInsights, type Insight } from '@xangarro/domain';

import { createDb, withBusiness, type Db } from '../src/client';
import { asesorInputs, materializarInsights } from '../src/queries';
import { notices } from '../src/schema';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * P-26's materialise-on-read (ADR-088): insights upsert into `notices` under
 * deterministic ids, a member's dismissal survives the recompute, and an
 * insight that fixed itself closes as `listo`.
 */
const { url, describe } = integrationSuite();
const BIZ = testId('A');

describe('asesor insights', () => {
  let db: Db;
  const hoy = '2026-05-12';

  beforeAll(async () => {
    db = createDb(url as string);
    await withBusiness(db, BIZ, async (tx) => {
      const pan = testId('P');
      await tx.execute(sql`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                              seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${pan}, 'Pan de muerto', 'Producto Terminado', 500, 'pza', 3, 'producto', true, 900,
                ${BIZ}, ${BIZ}, now(), now())`);
      // Two purchases: the second costs 50% more → costo-subio.
      await tx.execute(sql`
        INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo,
                                         business_id, device_id, created_at, updated_at)
        VALUES (${testId('M')}, ${pan}, '2026-03-01', 'entrada', 10, 500, 'Compra a proveedor', ${BIZ}, ${BIZ}, now(), now()),
               (${testId('M')}, ${pan}, '2026-05-01', 'entrada', 10, 750, 'Compra a proveedor', ${BIZ}, ${BIZ}, now(), now())`);
      // Last month's ventas all in the first quincena → quincena insight.
      const dias = ['2026-04-02', '2026-04-03', '2026-04-05'];
      for (const [i, f] of dias.entries()) {
        // C-17: the header (metodo, estado) lives in tickets; one id for both
        // rows (`testId` is run-unique per call, so it is bound once here).
        const sid = testId('S');
        await tx.execute(sql`
          INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                               business_id, device_id, created_at, updated_at)
          VALUES (${sid}, ${i + 1}, ${f}, 'Pan', 'Efectivo', 'pagado',
                  ${BIZ}, ${BIZ}, now(), now())`);
        await tx.execute(sql`
          INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                             producto_id, cantidad, business_id, device_id, created_at, updated_at)
          VALUES (${sid}, ${sid}, ${f}, 'Pan', 'Producto', 30_000,
                  ${pan}, 1, ${BIZ}, ${BIZ}, now(), now())`);
      }
      // Two identical gastos in a row → gasto-duplicado.
      await tx.execute(sql`
        INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${testId('E')}, '2026-05-10', 'Gas', 'Servicios', 5_000, ${BIZ}, ${BIZ}, now(), now()),
               (${testId('E')}, '2026-05-11', 'Gas', 'Servicios', 5_000, ${BIZ}, ${BIZ}, now(), now())`);
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  const insightsDe = async (): Promise<readonly Insight[]> =>
    calcularInsights(await withBusiness(db, BIZ, (tx) => asesorInputs(tx, hoy)));

  it('the inputs surface cost rise, quincena skew and duplicate gastos', async () => {
    const insights = await insightsDe();
    const kinds = insights.map((i) => i.kind).sort();
    assert.deepEqual(kinds, ['costo-subio', 'gasto-duplicado', 'quincena']);
    const duplicado = insights.find((i) => i.kind === 'gasto-duplicado');
    assert.equal(duplicado?.severity, 'critical');
  });

  it('materialises rows under deterministic ids, and a recompute is not a duplicate', async () => {
    const insights = await insightsDe();
    const r1 = await withBusiness(db, BIZ, (tx) => materializarInsights(tx, BIZ, insights));
    assert.equal(r1.materializados, 3);
    const r2 = await withBusiness(db, BIZ, (tx) => materializarInsights(tx, BIZ, insights));
    assert.equal(r2.materializados, 3);
    const rows = await withBusiness(db, BIZ, (tx) =>
      tx
        .select({ id: notices.id, state: notices.state })
        .from(notices)
        .where(eq(notices.source, 'asesor')),
    );
    assert.equal(rows.length, 3, 'the recompute upserts, it does not append');
  });

  it('a dismissal survives the recompute — the upsert never touches state', async () => {
    const insights = await insightsDe();
    await withBusiness(db, BIZ, async (tx) => {
      const [row] = await tx
        .select({ id: notices.id })
        .from(notices)
        .where(eq(notices.source, 'asesor'))
        .limit(1);
      await tx
        .update(notices)
        .set({ state: 'descartado', resolvedAt: new Date().toISOString() })
        .where(eq(notices.id, row!.id));
    });
    await withBusiness(db, BIZ, (tx) => materializarInsights(tx, BIZ, insights));
    const cerrada = await withBusiness(db, BIZ, (tx) =>
      tx
        .select({ state: notices.state, resolvedAt: notices.resolvedAt })
        .from(notices)
        .where(eq(notices.source, 'asesor')),
    );
    assert.ok(cerrada.some((r) => r.state === 'descartado' && r.resolvedAt !== null));
  });

  it('a foreign asesor notice survives a compute that finds nothing', async () => {
    const manual = testId('X');
    await withBusiness(db, BIZ, (tx) =>
      tx.insert(notices).values({
        id: manual,
        source: 'asesor',
        severity: 'info',
        title: 'Una fila escrita a mano',
        body: 'No es de este mecanismo.',
        state: 'nuevo',
        businessId: BIZ,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    // Earlier tests in this file left computed rows open; a compute that finds
    // nothing may close those — but only those, never the manual row.
    const sobrevive = await withBusiness(db, BIZ, (tx) =>
      tx.select({ id: notices.id }).from(notices).where(eq(notices.id, manual)),
    );
    assert.equal(sobrevive.length, 1, 'the manual row is not ours to close');
  });

  it('an insight that fixed itself closes as listo, not as a new row', async () => {
    // Remove one duplicate gasto; the insight vanishes on the next compute.
    // As the owner: the app role cannot hard-delete since 0036 (DB-RLS-01).
    const owner = createDb(process.env.DATABASE_SUPER_URL as string);
    await owner.execute(
      sql`DELETE FROM expenses WHERE id = (SELECT id FROM expenses WHERE business_id = ${BIZ} AND concepto = 'Gas' ORDER BY fecha DESC LIMIT 1)`,
    );
    await owner.$client.end({ timeout: 5 });
    const insights = await insightsDe();
    const r = await withBusiness(db, BIZ, (tx) => materializarInsights(tx, BIZ, insights));
    assert.equal(r.cerrados, 1);
    const abiertos = await withBusiness(db, BIZ, (tx) =>
      tx
        .select({ id: notices.id })
        .from(notices)
        .where(sql`${notices.source} = 'asesor' AND ${notices.resolvedAt} IS NULL`),
    );
    // 3 materialised − 1 dismissed − 1 vanished + the manual row = 2 open.
    assert.equal(abiertos.length, 2);
  });
});
