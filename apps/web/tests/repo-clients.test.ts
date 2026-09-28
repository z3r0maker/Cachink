import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * The Postgres `ClientsRepository` (the `products.ts` twin): no rule lives
 * here, but the mapping and the sync-log discipline do — every write appends
 * to `sync_log` in the same transaction (§5), and a write that matched no row
 * appends nothing. These are the branches the seeded tenant's happy paths
 * never reach: the not-found, the no-row, and the optional-field defaults.
 */

const recordChange = vi.fn();

vi.mock('@xangarro/data-pg', () => {
  const col = () => Symbol('columna');
  const tabla = new Proxy(
    {},
    { get: (_t, p) => (typeof p === 'string' ? col() : undefined) },
  ) as Record<string, symbol>;
  return { clients: tabla };
});
vi.mock('../src/server/repositories/portal-device', () => ({ PORTAL_DEVICE_ID: 'portal' }));
vi.mock('../src/server/repositories/sync-log', () => ({ recordChange }));

/** One result set per `select`, in call order; one row per insert/update. */
const selects: unknown[][] = [];
const insertRows: (unknown | undefined)[] = [];
const updateRows: (unknown | undefined)[] = [];
const insertedValues: unknown[] = [];
const updateSets: unknown[] = [];

function thenable(v: unknown): object {
  return {
    then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(v).then(res, rej),
  };
}

const fakeTx = {
  select: () => {
    const rows = selects.shift() ?? [];
    const paso = {
      from: () => paso,
      where: () => paso,
      orderBy: () => paso,
      ...thenable(rows),
    };
    return paso;
  },
  insert: () => ({
    values: (v: unknown) => {
      insertedValues.push(v);
      return { returning: () => thenable(insertRows.shift()) };
    },
  }),
  update: () => ({
    set: (s: unknown) => {
      updateSets.push(s);
      return { where: () => ({ returning: () => thenable(updateRows.shift()) }) };
    },
  }),
} as never;

const { pgClientsRepository } = await import('../src/server/repositories/clients');

const repo = pgClientsRepository(fakeTx, 'biz-1' as never);

const fila = (over: Record<string, unknown> = {}) => ({
  id: 'c-1',
  nombre: 'María López',
  telefono: '5512345678',
  email: 'maria@ejemplo.mx',
  nota: 'Paga puntual',
  rfc: 'LOMA860101',
  businessId: 'biz-1',
  deviceId: 'portal',
  createdByUserId: null,
  createdAt: '2026-05-12T10:00:00.000Z',
  updatedAt: '2026-05-12T10:00:00.000Z',
  deletedAt: null,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  selects.length = 0;
  insertRows.length = 0;
  updateRows.length = 0;
  insertedValues.length = 0;
  updateSets.length = 0;
});

describe('reads', () => {
  it('findById maps the row to the domain, dates as ISO', async () => {
    selects.push([fila()]);
    const c = await repo.findById('c-1' as never);
    assert.equal(c?.nombre, 'María López');
    assert.equal(c?.createdAt, '2026-05-12T10:00:00.000Z');
    assert.equal(c?.deletedAt, null);
  });

  it('findById of a row that is not there is null, not an error', async () => {
    selects.push([]);
    assert.equal(await repo.findById('c-x' as never), null);
  });

  it('findByName maps every match', async () => {
    selects.push([fila(), fila({ id: 'c-2', nombre: 'María Elena' })]);
    const dos = await repo.findByName('María');
    assert.deepEqual(
      dos.map((c) => c.id),
      ['c-1', 'c-2'],
    );
  });

  it('count reads the aggregate, and an empty table counts zero', async () => {
    selects.push([{ n: 7 }]);
    assert.equal(await repo.count(), 7);
    selects.push([]);
    assert.equal(await repo.count(), 0);
  });
});

describe('create', () => {
  it('a minimal client leaves the optional columns NULL and logs the insert', async () => {
    insertRows.push([fila({ telefono: null, email: null, nota: null, rfc: null })]);
    const c = await repo.create({ nombre: 'María López' } as never);
    assert.equal(c.telefono, null);
    assert.equal(c.rfc, null);
    assert.deepEqual(recordChange.mock.calls, [[fakeTx, 'biz-1', 'clients', 'c-1', 'insert']]);
  });

  it('a full client carries every optional column', async () => {
    insertRows.push([fila()]);
    await repo.create({
      nombre: 'María López',
      telefono: '5512345678',
      email: 'maria@ejemplo.mx',
      nota: 'Paga puntual',
      rfc: 'LOMA860101',
    } as never);
    const values = insertedValues[0] as Record<string, unknown>;
    assert.equal(values.telefono, '5512345678');
    assert.equal(values.rfc, 'LOMA860101');
    assert.equal(values.deviceId, 'portal');
  });

  it('an insert that returns no row is an error, not a silent success', async () => {
    insertRows.push([]);
    await assert.rejects(repo.create({ nombre: 'X' } as never), /no row/);
    assert.equal(recordChange.mock.calls.length, 0);
  });
});

describe('update and delete', () => {
  it('a patch sets only what it carries, rfc null included, and logs the update', async () => {
    updateRows.push([fila({ rfc: null })]);
    const c = await repo.update('c-1' as never, { rfc: null } as never);
    assert.equal(c?.rfc, null);
    const set = updateSets[0] as Record<string, unknown>;
    assert.deepEqual(Object.keys(set).sort(), ['rfc', 'updatedAt']);
    assert.deepEqual(recordChange.mock.calls, [[fakeTx, 'biz-1', 'clients', 'c-1', 'update']]);
  });

  it('an update that matched no row is null, and logs nothing', async () => {
    updateRows.push([]);
    assert.equal(await repo.update('c-x' as never, { nombre: 'Y' } as never), null);
    assert.equal(recordChange.mock.calls.length, 0);
  });

  it('a delete that matched logs the change; one that did not, does not', async () => {
    updateRows.push([{ id: 'c-1' }]);
    await repo.delete('c-1' as never);
    assert.deepEqual(recordChange.mock.calls, [[fakeTx, 'biz-1', 'clients', 'c-1', 'update']]);

    recordChange.mockClear();
    updateRows.push([]);
    await repo.delete('c-x' as never);
    assert.equal(recordChange.mock.calls.length, 0);
  });
});
