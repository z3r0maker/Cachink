import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { listMovimientos, paginaDeFecha, type FiltroMovimientos } from '../src/queries';
import { integrationSuite } from './support/db';
import { seedLedger, type LedgerFixture } from './support/ledger-fixture';

/**
 * «Ir a fecha» (DS-01): the page that holds a day. May's ventas in the ledger
 * fixture, newest first, are 31 (timestamped), 11, 10, 10 and 1 May — so at
 * two rows a page the 10th opens page 2 and the 1st page 3.
 */
const { url, describe } = integrationSuite();
const MAYO: FiltroMovimientos = { desde: '2026-05-01', hasta: '2026-05-31' };
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

describe('Movimientos: the page that holds a day', () => {
  let app: Db;
  let owner: postgres.Sql;
  let fx: LedgerFixture;
  const as = <T>(fn: (tx: Tx) => Promise<T>) => withBusiness(app, fx.biz, fn);
  const pagina = (fecha: string, filtro: FiltroMovimientos = MAYO) =>
    as((tx) => paginaDeFecha(tx, 'venta', filtro, fecha, 2));

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    fx = await seedLedger(owner, 'F');
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${fx.biz}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('opens the page whose rows include the day, counting a timestamped fecha on its own day', async () => {
    assert.equal(await pagina('2026-05-31'), 1);
    assert.equal(await pagina('2026-05-11'), 1);
    assert.equal(await pagina('2026-05-10'), 2);
    assert.equal(await pagina('2026-05-01'), 3);
    const p2 = await as((tx) => listMovimientos(tx, 'venta', MAYO, { limit: 2, offset: 2 }));
    assert.ok(
      p2.some((r) => r.fecha === '2026-05-10'),
      'page 2 really holds the 10th',
    );
  });

  it('a day without rows opens where it would sit: the page of the next older row', async () => {
    assert.equal(await pagina('2026-05-05'), 3);
  });

  it('a day after the period is page 1; one before it is past the last page, for the loader to clamp', async () => {
    assert.equal(await pagina('2026-06-15'), 1);
    assert.equal(await pagina('2026-04-01'), 3, 'five rows at two a page: floor(5/2) + 1');
  });

  it('follows the search and the category, as the pages it points into do', async () => {
    assert.equal(await pagina('2026-05-01', { ...MAYO, buscar: 'taco' }), 1);
    assert.equal(await pagina('2026-05-01', { ...MAYO, clasificacion: 'Efectivo' }), 2);
  });

  it('refuses a day that is not YYYY-MM-DD', async () => {
    await assert.rejects(pagina('10/05/2026'), TypeError);
  });
});
