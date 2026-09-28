/**
 * DS-10: linking a big business shows «Descargando los datos de tu negocio…
 * 3 de 7». The device keeps where its snapshot stands in `app_config`, written
 * in the same transaction as each page, so a snapshot resumed in a later run
 * (or after a reload) still knows its place, and a failed page moves nothing.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  SNAPSHOT_MOVEMENT_WINDOW_DAYS,
  type PullResponse,
  type ReferenceTables,
} from '@xangarro/contracts';
import { DrizzleAppConfigRepository } from '@xangarro/data';
import { makeFreshDb } from '../../data/tests/helpers/fresh-db.js';
import { applyPulledPage } from '../src/page-applier.js';
import { snapshotProgress } from '../src/snapshot-progress.js';

const BIZ = '01JMVTBIZ00000000000000001';
const tables = (over: Record<string, unknown> = {}) =>
  ({
    businesses: [],
    products: [],
    clients: [],
    users: [],
    employees: [],
    recurring_expenses: [],
    conversion_recetas: [],
    mensajes_operador: [],
    opening_balances: [],
    opening_balance_clients: [],
    inventory_movements: [],
    feature_flags: {},
    ...over,
  }) as unknown as ReferenceTables;

const page = (snapshot: Partial<NonNullable<PullResponse['snapshot']>> | null, t = tables()) => ({
  serverSeq: 900,
  serverTime: new Date().toISOString(),
  tables: t,
  ...(snapshot === null
    ? {}
    : {
        snapshot: {
          cutoff: new Date(Date.now() - SNAPSHOT_MOVEMENT_WINDOW_DAYS * 86_400_000).toISOString(),
          first: false,
          next: 'tok',
          stockBaseline: [],
          ...snapshot,
        },
      }),
});

describe('snapshotProgress (DS-10)', () => {
  it('counts the pages applied against the first page’s estimate, then clears when done', async () => {
    const db = makeFreshDb();
    const cfg = new DrizzleAppConfigRepository(db);
    assert.equal(await snapshotProgress(cfg), null, 'no snapshot yet');
    await applyPulledPage(db, page({ first: true, pages: 3 }), BIZ, {});
    assert.deepEqual(await snapshotProgress(cfg), { pagina: 1, paginas: 3 });
    await applyPulledPage(db, page({}), BIZ, {});
    assert.deepEqual(await snapshotProgress(cfg), { pagina: 2, paginas: 3 });
    await applyPulledPage(db, page({ next: null }), BIZ, {});
    assert.equal(await snapshotProgress(cfg), null, 'complete');
  });

  it('never says fewer pages than it has already applied (bytes cut more pages)', async () => {
    const db = makeFreshDb();
    const cfg = new DrizzleAppConfigRepository(db);
    await applyPulledPage(db, page({ first: true, pages: 2 }), BIZ, {});
    await applyPulledPage(db, page({}), BIZ, {});
    await applyPulledPage(db, page({}), BIZ, {});
    assert.deepEqual(await snapshotProgress(cfg), { pagina: 3, paginas: 3 });
  });

  it('an older server sends no estimate: the page is known, the total is not', async () => {
    const db = makeFreshDb();
    const cfg = new DrizzleAppConfigRepository(db);
    await applyPulledPage(db, page({ first: true }), BIZ, {});
    assert.deepEqual(await snapshotProgress(cfg), { pagina: 1, paginas: null });
  });

  it('a snapshot started over begins again at page 1', async () => {
    const db = makeFreshDb();
    const cfg = new DrizzleAppConfigRepository(db);
    await applyPulledPage(db, page({ first: true, pages: 5 }), BIZ, {});
    await applyPulledPage(db, page({}), BIZ, {});
    await applyPulledPage(db, page({ first: true, pages: 4 }), BIZ, {});
    assert.deepEqual(await snapshotProgress(cfg), { pagina: 1, paginas: 4 });
  });

  it('a page that fails to apply leaves the progress where it was', async () => {
    const db = makeFreshDb();
    const cfg = new DrizzleAppConfigRepository(db);
    await applyPulledPage(db, page({ first: true, pages: 3 }), BIZ, {});
    const roto = tables({ products: [{ id: 'P1', nombre: null }] });
    await assert.rejects(applyPulledPage(db, page({}, roto), BIZ, {}));
    assert.deepEqual(await snapshotProgress(cfg), { pagina: 1, paginas: 3 });
  });

  it('an ordinary pull (no snapshot) leaves no progress behind', async () => {
    const db = makeFreshDb();
    const cfg = new DrizzleAppConfigRepository(db);
    await applyPulledPage(db, page(null), BIZ, {});
    assert.equal(await snapshotProgress(cfg), null);
  });
});
