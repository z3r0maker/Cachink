import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { buildFixtures, FIXTURE_BUSINESS_ID } from '@xangarro/contracts/mock';
import type { ReferenceTables } from '@xangarro/contracts';
import {
  DrizzleBusinessesRepository,
  DrizzleProductsRepository,
  DrizzleUsersRepository,
} from '@xangarro/data';
import type { BusinessId, ProductId } from '@xangarro/domain';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { applyReferenceTables, toColumnValues } from '../src/reference-applier.js';
import { products } from '@xangarro/data';
import { sql } from 'drizzle-orm';

function tables(over: Partial<ReferenceTables> = {}): ReferenceTables {
  const fx = buildFixtures();
  return {
    businesses: fx.businesses,
    products: fx.products,
    clients: fx.clients,
    users: fx.users,
    employees: fx.employees,
    recurring_expenses: fx.recurring_expenses,
    conversion_recetas: [],
    feature_flags: { stock: true, merma: false },
    ...over,
  } as unknown as ReferenceTables;
}

describe('applyReferenceTables', () => {
  it('bootstraps an empty database and the repositories read the rows back as domain entities', async () => {
    const db = makeFreshDb();
    const res = await applyReferenceTables(db, tables(), FIXTURE_BUSINESS_ID);
    assert.equal(res.applied.products, 20);
    assert.equal(res.applied.users, 2);
    const biz = await new DrizzleBusinessesRepository(db, 'DEV' as never).findById(
      FIXTURE_BUSINESS_ID as BusinessId,
    );
    assert.equal(biz?.nombre, 'Tacos La Esquina');
    assert.deepEqual(JSON.parse(biz?.featureFlags ?? '{}'), { stock: true, merma: false });
    const operators = await new DrizzleUsersRepository(db, 'DEV' as never).findAllByBusiness(
      FIXTURE_BUSINESS_ID as BusinessId,
    );
    assert.deepEqual(operators.map((u) => u.nombre).sort(), ['Ana', 'Toni']);
    const first = buildFixtures().products[0]!;
    const p = await new DrizzleProductsRepository(db, 'DEV' as never).findById(
      first.id as ProductId,
    );
    assert.equal(p?.precioVentaCentavos, first.precioVentaCentavos);
  });

  it('lands the C-15 branding a pull carries, and defaults it when the cloud sends none', async () => {
    const db = makeFreshDb();
    const fx = buildFixtures();
    const branded = {
      ...fx.businesses[0]!,
      brandColor: '#FFD60A',
      receiptTemplate: 'ticket',
      receiptLeyenda: '¡Gracias por su compra!',
      addressPrint: true,
      whatsapp: '55 1234 5678',
      direccion: 'Av. Insurgentes 123, CDMX',
      socialLinks: '{"instagram":"@donpedro"}',
    };
    await applyReferenceTables(db, tables({ businesses: [branded] as never }), FIXTURE_BUSINESS_ID);
    const repo = new DrizzleBusinessesRepository(db, 'DEV' as never);
    const biz = await repo.findById(FIXTURE_BUSINESS_ID as BusinessId);
    assert.equal(biz?.brandColor, '#FFD60A');
    assert.equal(biz?.receiptTemplate, 'ticket');
    assert.equal(biz?.receiptLeyenda, '¡Gracias por su compra!');
    assert.equal(biz?.addressPrint, true);
    assert.equal(biz?.whatsapp, '55 1234 5678');
    assert.equal(biz?.direccion, 'Av. Insurgentes 123, CDMX');
    assert.equal(biz?.socialLinks, '{"instagram":"@donpedro"}');

    const plain = makeFreshDb();
    await applyReferenceTables(plain, tables(), FIXTURE_BUSINESS_ID);
    const untouched = await new DrizzleBusinessesRepository(plain, 'DEV' as never).findById(
      FIXTURE_BUSINESS_ID as BusinessId,
    );
    assert.equal(untouched?.receiptTemplate, 'clasico');
    assert.equal(untouched?.addressPrint, false);
    assert.equal(untouched?.socialLinks, '{}');
  });

  it('stores the saldos iniciales a pull brings down (C-20)', async () => {
    const db = makeFreshDb();
    const audit = {
      businessId: FIXTURE_BUSINESS_ID,
      deviceId: 'DEV',
      createdByUserId: null,
      createdAt: '2026-09-22T12:00:00.000Z',
      updatedAt: '2026-09-22T12:00:00.000Z',
      deletedAt: null,
    };
    const cliente = buildFixtures().clients[0]!;
    const header = {
      id: '01HZ8XQN9GZJXV8AKQ5X0C20AA',
      fechaApertura: '2026-01-01',
      cajaCentavos: 150_000n,
      bancosCentavos: 4_200_000n,
      lockedAt: null,
      ...audit,
    };
    const line = {
      id: '01HZ8XQN9GZJXV8AKQ5X0C20CL',
      clienteId: cliente.id,
      saldoCentavos: 86_000n,
      ...audit,
    };
    const res = await applyReferenceTables(
      db,
      tables({ opening_balances: [header], opening_balance_clients: [line] } as never),
      FIXTURE_BUSINESS_ID,
    );
    assert.equal(res.applied.opening_balances, 1);
    assert.equal(res.applied.opening_balance_clients, 1);

    const stored = (await db.get(
      sql`SELECT fecha_apertura, caja_centavos, bancos_centavos, locked_at FROM opening_balances WHERE id = ${header.id}`,
    )) as Record<string, unknown>;
    assert.equal(stored.fecha_apertura, '2026-01-01');
    assert.equal(Number(stored.caja_centavos), 150_000);
    assert.equal(Number(stored.bancos_centavos), 4_200_000);
    assert.equal(stored.locked_at, null);

    const saldo = (await db.get(
      sql`SELECT cliente_id, saldo_centavos FROM opening_balance_clients WHERE id = ${line.id}`,
    )) as Record<string, unknown>;
    assert.equal(saldo.cliente_id, cliente.id);
    assert.equal(Number(saldo.saldo_centavos), 86_000);
  });

  it('is an upsert: re-applying an edited row updates it instead of duplicating', async () => {
    const db = makeFreshDb();
    await applyReferenceTables(db, tables(), FIXTURE_BUSINESS_ID);
    const fx = buildFixtures();
    const edited = { ...fx.products[0]!, precioVentaCentavos: 9_999n, nombre: 'Taco XL' };
    await applyReferenceTables(db, tables({ products: [edited] as never }), FIXTURE_BUSINESS_ID);
    const repo = new DrizzleProductsRepository(db, 'DEV' as never);
    const p = await repo.findById(edited.id as ProductId);
    assert.equal(p?.nombre, 'Taco XL');
    assert.equal(p?.precioVentaCentavos, 9_999n);
    const all = await repo.listForBusiness(FIXTURE_BUSINESS_ID as BusinessId);
    assert.equal(all.length, 20);
  });

  it('applies a soft delete (deletedAt) sent by the server', async () => {
    const db = makeFreshDb();
    await applyReferenceTables(db, tables(), FIXTURE_BUSINESS_ID);
    const gone = { ...buildFixtures().products[1]!, deletedAt: '2026-09-16T12:00:00.000Z' };
    await applyReferenceTables(db, tables({ products: [gone] as never }), FIXTURE_BUSINESS_ID);
    const all = await new DrizzleProductsRepository(db, 'DEV' as never).listForBusiness(
      FIXTURE_BUSINESS_ID as BusinessId,
    );
    assert.equal(
      all.some((p) => p.id === gone.id),
      false,
    );
  });

  it('does not leave change-log entries for server rows (no echo on the next push)', async () => {
    const db = makeFreshDb();
    await applyReferenceTables(db, tables(), FIXTURE_BUSINESS_ID);
    const rows = (await db.all(sql`SELECT table_name FROM __xangarro_change_log`)) as unknown[];
    assert.equal(rows.length, 0);
  });

  it('keeps change-log entries for local writes that happen before the apply', async () => {
    const db = makeFreshDb();
    await applyReferenceTables(db, tables(), FIXTURE_BUSINESS_ID);
    const repo = new DrizzleProductsRepository(db, 'DEV' as never);
    await repo.create({
      nombre: 'Local quick-add',
      categoria: 'Producto Terminado',
      costoUnitCentavos: 100n,
      unidad: 'pza',
      precioVentaCentavos: 200n,
      businessId: FIXTURE_BUSINESS_ID,
    } as never);
    await applyReferenceTables(db, tables(), FIXTURE_BUSINESS_ID);
    const rows = (await db.all(sql`SELECT table_name, op FROM __xangarro_change_log`)) as {
      table_name: string;
      op: string;
    }[];
    assert.deepEqual(rows, [{ table_name: 'products', op: 'insert' }]);
  });

  it('drops keys the local table does not have and JSON-encodes structured values', () => {
    const cols = toColumnValues(products, { id: 'x', atributos: { color: 'rojo' }, notAColumn: 1 });
    assert.equal(cols['atributos'], '{"color":"rojo"}');
    assert.equal('notAColumn' in cols, false);
  });
});
