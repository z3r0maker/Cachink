import { describe, expect, it } from 'vitest';

import { mockSnapshotPage } from '../src/mock/snapshot.js';
import { SNAPSHOT_START } from '../src/snapshot.js';
import { encodeJson } from '../src/wire.js';
import { MockState } from '../src/mock/state.js';

/**
 * The mock's snapshot bootstrap (C-23): the baseline sums only live
 * movements created before the cutoff, entradas minus salidas, never zero;
 * users travel without their email; a token the mock never issued is null;
 * and the pager hands out pages until there is no next.
 */

const AHORA = new Date('2026-09-28T12:00:00.000Z');
const ANTES = '2026-01-05T00:00:00.000Z'; // before the cutoff, whatever the window
const DESPUES = '2026-09-28T11:00:00.000Z';

function sembrada(): MockState {
  const s = new MockState();
  // Baseline material: entrada + salida before the cutoff, a movement after
  // it (excluded), a deleted one (excluded), and a pair that cancels (zero).
  s.upsert('inventory_movements', {
    id: 'm-1',
    createdAt: ANTES,
    tipo: 'entrada',
    cantidad: 10,
    productoId: 'queso',
    deletedAt: null,
    businessId: 'b',
    deviceId: 'd',
    updatedAt: ANTES,
  });
  s.upsert('inventory_movements', {
    id: 'm-2',
    createdAt: ANTES,
    tipo: 'salida',
    cantidad: 3,
    productoId: 'queso',
    deletedAt: null,
    businessId: 'b',
    deviceId: 'd',
    updatedAt: ANTES,
  });
  s.upsert('inventory_movements', {
    id: 'm-3',
    createdAt: DESPUES,
    tipo: 'entrada',
    cantidad: 99,
    productoId: 'queso',
    deletedAt: null,
    businessId: 'b',
    deviceId: 'd',
    updatedAt: DESPUES,
  });
  s.upsert('inventory_movements', {
    id: 'm-4',
    createdAt: ANTES,
    tipo: 'entrada',
    cantidad: 5,
    productoId: 'tortilla',
    deletedAt: '2026-01-06T00:00:00.000Z',
    businessId: 'b',
    deviceId: 'd',
    updatedAt: ANTES,
  });
  s.upsert('inventory_movements', {
    id: 'm-5',
    createdAt: ANTES,
    tipo: 'entrada',
    cantidad: 7,
    productoId: 'salsa',
    deletedAt: null,
    businessId: 'b',
    deviceId: 'd',
    updatedAt: ANTES,
  });
  s.upsert('inventory_movements', {
    id: 'm-6',
    createdAt: ANTES,
    tipo: 'salida',
    cantidad: 7,
    productoId: 'salsa',
    deletedAt: null,
    businessId: 'b',
    deviceId: 'd',
    updatedAt: ANTES,
  });
  s.upsert('inventory_movements', {
    id: 'm-7',
    createdAt: ANTES,
    tipo: 'entrada',
    cantidad: 4,
    productoId: 'agua',
    deletedAt: null,
    businessId: 'b',
    deviceId: 'd',
    updatedAt: ANTES,
  });
  s.upsert('users', {
    id: 'u-1',
    nombre: 'Pedro',
    email: 'pedro@x.mx',
    pinHash: 'x',
    avatarColor: '#000',
    businessId: 'b',
    deviceId: 'd',
    createdAt: ANTES,
    updatedAt: ANTES,
    deletedAt: null,
  });
  return s;
}

describe('mockSnapshotPage', () => {
  it('the baseline sums live pre-cutoff movements, entradas minus salidas, zeros dropped', async () => {
    const page = await mockSnapshotPage(sembrada(), SNAPSHOT_START, AHORA);
    expect(page).not.toBeNull();
    expect(page?.snapshot.first).toBe(true);
    const base = page?.snapshot.stockBaseline as { productoId: string; cantidad: number }[];
    expect(base).toEqual([
      { productoId: 'agua', cantidad: 4 },
      { productoId: 'queso', cantidad: 7 },
    ]);
  });

  it('users travel without their email', async () => {
    const page = await mockSnapshotPage(sembrada(), SNAPSHOT_START, AHORA);
    const users = (page?.tables as { users: unknown[] }).users;
    expect(users.length).toBeGreaterThan(0);
    expect(JSON.stringify(users)).not.toContain('pedro@x.mx');
  });

  it('a token the mock never issued is null', async () => {
    expect(await mockSnapshotPage(sembrada(), 'esto-no-es-un-token', AHORA)).toBeNull();
  });

  it('the pager hands out pages until there is no next, losing nothing', async () => {
    const s = sembrada();
    s.snapshotBudget = { rows: 2, bytes: 1_000_000 };
    const vistas: string[] = [];
    let token: string | null = SNAPSHOT_START;
    let paginas = 0;
    while (token !== null && paginas < 20) {
      const page = await mockSnapshotPage(s, token, AHORA);
      expect(page).not.toBeNull();
      vistas.push(encodeJson(page?.tables));
      token = page?.snapshot.next ?? null;
      paginas += 1;
    }
    expect(paginas).toBeGreaterThan(1);
    expect(vistas.join('\n')).toContain('queso');
  });
});
