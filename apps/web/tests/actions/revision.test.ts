import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * Revisión de caja: what the register captured on the fly — a product sold
 * before it existed, a client given credit at the counter — approved,
 * rejected or merged by the owner. Each action is one tenant transaction;
 * these tests read what each writes, and what a refusal says.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();

const T = {
  products: { t: 'products' },
  clients: { t: 'clients' },
  sales: { t: 'sales' },
  tickets: { t: 'tickets' },
  clientPayments: { t: 'clientPayments' },
  inventoryMovements: { t: 'inventoryMovements' },
};

type Write = {
  op: 'update' | 'insert';
  table: string;
  values: Record<string, unknown>;
  where?: unknown;
};
let writes: Write[] = [];
let failWith: Error | null = null;

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/repositories/portal-device', () => ({ PORTAL_DEVICE_ID: 'portal' }));
vi.mock('@xangarro/data-pg', () => T);
vi.mock('drizzle-orm', () => ({ eq: (col: unknown, value: unknown) => ({ col, value }) }));
vi.mock('../../src/server/db', () => ({
  withTenant: async (_biz: string, fn: (tx: unknown) => unknown) => {
    if (failWith) throw failWith;
    return fn({
      update: (table: { t: string }) => ({
        set: (values: Record<string, unknown>) => ({
          where: async (where: unknown) => {
            writes.push({ op: 'update', table: table.t, values, where });
          },
        }),
      }),
      insert: (table: { t: string }) => ({
        values: async (values: Record<string, unknown>) => {
          writes.push({ op: 'insert', table: table.t, values });
        },
      }),
    });
  },
}));

const { aprobarProducto, aprobarCliente, rechazar, fusionar } =
  await import('../../src/server/actions/revision');

const APROBADO = {
  precioCentavos: 4_500n,
  costoCentavos: 1_800n,
  categoria: 'Tacos',
  existencias: 12,
  umbral: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  writes = [];
  failWith = null;
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
});

describe('aprobarProducto', () => {
  it('prices the product, approves it, and opens its stock with a costed entrada', async () => {
    assert.deepEqual(await aprobarProducto('p-1', APROBADO), { ok: true });
    const [update, entrada] = writes as [Write, Write];
    const pick = (w: Write, keys: string[]) =>
      Object.fromEntries(keys.map((k) => [k, w.values[k]]));
    assert.equal(update.table, 'products');
    assert.deepEqual(
      pick(update, [
        'precioVentaCentavos',
        'costoUnitCentavos',
        'estadoRevision',
        'umbralStockBajo',
        'categoria',
      ]),
      {
        precioVentaCentavos: 4_500n,
        costoUnitCentavos: 1_800n,
        estadoRevision: 'aprobado',
        umbralStockBajo: 3,
        // Pinned as it is: the form's menu category («Tacos») is not stored —
        // the column is an inventory category. Raised with the owner (P-35).
        categoria: 'Producto Terminado',
      },
    );
    assert.equal(entrada.table, 'inventoryMovements');
    assert.deepEqual(
      pick(entrada, ['tipo', 'cantidad', 'costoUnitCentavos', 'productoId', 'deviceId']),
      {
        tipo: 'entrada',
        cantidad: 12,
        costoUnitCentavos: 1_800n,
        productoId: 'p-1',
        deviceId: 'portal',
      },
    );
    assert.deepEqual(revalidatePath.mock.calls, [['/revision-caja']]);
  });

  it('an outage is reported behind the retry message', async () => {
    failWith = new Error('deadlock detected');
    assert.deepEqual(await aprobarProducto('p-1', APROBADO), {
      ok: false,
      message: 'No se pudo aprobar el producto. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls[0], [failWith, { endpoint: 'aprobarProducto' }]);
  });
});

describe('aprobarCliente', () => {
  it('sets the credit limit and term and approves the client', async () => {
    assert.deepEqual(await aprobarCliente('c-1', 50_000n, 15), { ok: true });
    const [w] = writes;
    assert.equal(w?.table, 'clients');
    assert.equal(w?.values.limiteCentavos, 50_000n);
    assert.equal(w?.values.plazoDias, 15);
    assert.equal(w?.values.estadoRevision, 'aprobado');
  });
});

describe('rechazar', () => {
  it('marks a product or a client rejected, each in its own table', async () => {
    await rechazar('producto', 'p-1');
    await rechazar('cliente', 'c-1');
    assert.deepEqual(
      writes.map((w) => [w.table, w.values.estadoRevision]),
      [
        ['products', 'rechazado'],
        ['clients', 'rechazado'],
      ],
    );
  });
});

describe('fusionar', () => {
  it('a duplicate product’s sales move to the survivor, and the row says where', async () => {
    assert.deepEqual(await fusionar('producto', 'p-dup', 'p-1'), { ok: true });
    assert.deepEqual(
      writes.map((w) => [w.table, w.values]),
      [
        ['sales', { productoId: 'p-1' }],
        ['products', { ...writes[1]?.values, estadoRevision: 'fusionado', fusionadoConId: 'p-1' }],
      ],
    );
  });

  it('a duplicate client’s tickets and abonos move to the survivor', async () => {
    await fusionar('cliente', 'c-dup', 'c-1');
    assert.deepEqual(
      writes.map((w) => w.table),
      ['tickets', 'clientPayments', 'clients'],
    );
    assert.equal(writes[2]?.values.fusionadoConId, 'c-1');
  });
});

describe('who may decide', () => {
  it('a member without the role is told why, and it is not an incident', async () => {
    const refusal = Object.assign(new Error('Tu cuenta es de solo lectura.'), {
      code: 'NOT_PERMITTED',
    });
    requireMember.mockRejectedValue(refusal);
    for (const r of [
      await aprobarProducto('p-1', APROBADO),
      await aprobarCliente('c-1', 0n, 0),
      await rechazar('producto', 'p-1'),
      await fusionar('producto', 'p-1', 'p-2'),
    ]) {
      assert.deepEqual(r, { ok: false, message: 'Tu cuenta es de solo lectura.' });
    }
    assert.equal(reportError.mock.calls.length, 0);
    assert.equal(writes.length, 0);
  });
});
