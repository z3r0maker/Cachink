import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

import { createDb, withBusiness, type Db } from '../src/client';
import { exportarTabla, tablasDelNegocio, todas, type TablaDelNegocio } from '../src/queries';
import { integrationSuite } from './support/db';
import { seedLedger, type LedgerFixture } from './support/ledger-fixture';
import { testId } from './support/test-ids';

/**
 * «Descargar todo»'s JSON (the aviso de privacidad's «Exportar»): every table
 * the tenant may read, every row once, nobody else's — and the rows the seed
 * does not have: a centavos value past 2^53, a composite primary key walked a
 * row at a time, an operador's NIP hash and a logo's bytes that must stay out.
 */
const { url, describe } = integrationSuite();
/** 2^53 + 1: a JSON number would come back as …992. */
const ENORME = 9_007_199_254_740_993n;

type Fila = Record<string, unknown>;

describe('the whole-business JSON export', () => {
  let app: Db;
  let owner: postgres.Sql;
  let fx: LedgerFixture;
  let otro: LedgerFixture;
  let tablas: readonly TablaDelNegocio[];

  /** Every row of `nombre`, parsed, read a batch at a time in a transaction of its own. */
  const filas = async (nombre: string, lote = 2): Promise<Fila[]> => {
    const tabla = tablas.find((t) => t.nombre === nombre);
    assert.ok(tabla, `${nombre} is not exported`);
    const textos = await todas(exportarTabla((fn) => withBusiness(app, fx.biz, fn), tabla, lote));
    return textos.map((t) => JSON.parse(t) as Fila);
  };

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    fx = await seedLedger(owner, 'N');
    otro = await seedLedger(owner, 'O');
    const now = new Date('2026-05-12T14:00:00Z');
    const fila = { business_id: fx.biz, device_id: fx.dev, created_at: now, updated_at: now };
    await owner`INSERT INTO expenses ${owner({ id: testId('E'), fecha: '2026-05-20', concepto: 'Enorme', categoria: 'Renta', monto_centavos: ENORME.toString(), ...fila })}`;
    await owner`INSERT INTO users ${owner({ id: testId('U'), nombre: 'Lupita', pin_hash: 'secreto-nip', ...fila })}`;
    await owner`INSERT INTO business_logos ${owner({ business_id: fx.biz, mime: 'image/png', bytes: Buffer.from('PNG'), updated_at: now })}`;
    for (const clave of ['a', 'b', 'c']) {
      await owner`INSERT INTO celebraciones ${owner({ clave, business_id: fx.biz })}`;
    }
    tablas = await withBusiness(app, fx.biz, tablasDelNegocio);
  });

  afterAll(async () => {
    for (const f of [fx, otro]) {
      if (f !== undefined) await owner`DELETE FROM businesses WHERE id = ${f.biz}`;
    }
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('lists every readable tenant table — none is dropped for lacking a key', async () => {
    const legibles = await withBusiness(app, fx.biz, (tx) =>
      tx.execute<{ nombre: string }>(sql`
        SELECT c.relname::text AS nombre FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
         WHERE c.relkind IN ('r', 'p') AND has_table_privilege(c.oid, 'SELECT')
           AND EXISTS (SELECT 1 FROM pg_attribute a
                        WHERE a.attrelid = c.oid AND a.attname = 'business_id')
         ORDER BY 1`),
    );
    const nombres = tablas.map((t) => t.nombre);
    assert.deepEqual(
      nombres,
      [...legibles].map((r) => r.nombre),
    );
    for (const t of ['businesses', 'sales', 'tickets', 'expenses', 'products', 'subscriptions']) {
      assert.ok(nombres.includes(t), t);
    }
    // Readable only by the billing role: not this tenant's to read, not in the file.
    assert.ok(!nombres.includes('usage_counters'));
    assert.ok(tablas.every((t) => t.llave.length > 0));
  });

  it('walks every row once, this tenant only, as many as RLS shows', async () => {
    const ventas = await filas('sales');
    const [cuenta] = await withBusiness(app, fx.biz, (tx) =>
      tx.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM sales`),
    );
    assert.equal(ventas.length, cuenta?.n);
    assert.equal(ventas.length, 8, 'every line of the fixture, the deleted one too');
    assert.equal(new Set(ventas.map((v) => v.id)).size, ventas.length);
    assert.ok(ventas.every((v) => v.business_id === fx.biz));
    const negocios = await filas('businesses');
    assert.deepEqual(
      negocios.map((n) => n.id),
      [fx.biz],
    );
  });

  it('writes bigint as an exact string, never a float', async () => {
    const gastos = await filas('expenses');
    const enorme = gastos.find((g) => g.concepto === 'Enorme');
    assert.equal(enorme?.monto_centavos, ENORME.toString());
    assert.ok(gastos.every((g) => typeof g.monto_centavos === 'string'));
    assert.equal(
      BigInt(String(gastos.find((g) => g.concepto === 'Renta local')?.monto_centavos)),
      500_000n,
    );
  });

  it('writes timestamps as ISO 8601 in UTC', async () => {
    const [venta] = await filas('sales');
    assert.equal(venta?.created_at, '2026-05-12T14:00:00+00:00');
    assert.equal(new Date(String(venta?.created_at)).toISOString(), '2026-05-12T14:00:00.000Z');
  });

  it('leaves out bytes and credential hashes', async () => {
    const [operador] = await filas('users');
    assert.equal(operador?.nombre, 'Lupita');
    assert.ok(!('pin_hash' in (operador ?? {})));
    const [logo] = await filas('business_logos');
    assert.equal(logo?.mime, 'image/png');
    assert.ok(!('bytes' in (logo ?? {})));
  });

  it('walks a composite key a row at a time', async () => {
    const celebraciones = await filas('celebraciones', 1);
    assert.deepEqual(
      celebraciones.map((c) => c.clave),
      ['a', 'b', 'c'],
    );
  });
});
