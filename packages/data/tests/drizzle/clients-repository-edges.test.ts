import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { newEntityId, type BusinessId, type ClientId } from '@xangarro/domain';

import { DrizzleClientsRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';
import type { XangarroDatabase } from '../../src/repositories/drizzle/_db.js';

/**
 * The clients twin of the products edges: the create defaults a capture
 * leans on, the per-field guards of `update` (and the stamp-only save), a
 * patch against a row that is not there, and the soft-delete every read
 * must respect. The phone writes clientes without RFC or credit terms —
 * those rows are the norm, not the exception.
 */

const BIZ = newEntityId<BusinessId>();

function repo(db: XangarroDatabase): DrizzleClientsRepository {
  return new DrizzleClientsRepository(db, TEST_DEVICE_ID);
}

describe('DrizzleClientsRepository · edges', () => {
  it('a bare create carries the defaults: no contact, no credit, aprobado', async () => {
    const r = repo(makeFreshDb());
    const c = await r.create({ nombre: 'María', businessId: BIZ });
    assert.equal(c.telefono, null);
    assert.equal(c.email, null);
    assert.equal(c.nota, null);
    assert.equal(c.limiteCentavos, null);
    assert.equal(c.plazoDias, null);
    assert.equal(c.estadoRevision, 'aprobado');
    assert.equal(c.fusionadoConId, null);
  });

  it('a full create keeps the credit terms and the register’s review state', async () => {
    const r = repo(makeFreshDb());
    const fusion = newEntityId<ClientId>();
    const c = await r.create({
      nombre: 'María',
      telefono: '5512345678',
      email: 'maria@ejemplo.mx',
      nota: 'Paga puntual',
      limiteCentavos: 500_00n,
      plazoDias: 15,
      estadoRevision: 'pendiente',
      fusionadoConId: fusion,
      businessId: BIZ,
    });
    assert.equal(c.telefono, '5512345678');
    assert.equal(c.email, 'maria@ejemplo.mx');
    assert.equal(c.nota, 'Paga puntual');
    assert.equal(c.limiteCentavos, 500_00n);
    assert.equal(c.plazoDias, 15);
    assert.equal(c.estadoRevision, 'pendiente');
    assert.equal(c.fusionadoConId, fusion);
  });

  it('a patch carries only the fields it names; a stamp-only save touches nothing else', async () => {
    const r = repo(makeFreshDb());
    const c = await r.create({ nombre: 'María', telefono: '5512345678', businessId: BIZ });

    const cambiado = await r.update(c.id, { nombre: 'María Elena', nota: 'Frecuente' });
    assert.equal(cambiado?.nombre, 'María Elena');
    assert.equal(cambiado?.nota, 'Frecuente');
    assert.equal(cambiado?.telefono, '5512345678');

    const sellado = await r.update(c.id, {});
    assert.equal(sellado?.nombre, 'María Elena');
    assert.equal(sellado?.email, null);
  });

  it('each patchable field travels on its own', async () => {
    const r = repo(makeFreshDb());
    const c = await r.create({ nombre: 'María', businessId: BIZ });
    for (const paso of [
      { telefono: '5512345678' },
      { email: 'maria@ejemplo.mx' },
      { nota: 'Paga puntual' },
    ]) {
      const out = await r.update(c.id, paso);
      assert.deepEqual(
        Object.entries(paso).every(([k, v]) => (out as Record<string, unknown>)[k] === v),
        true,
        `paso ${Object.keys(paso)[0]}`,
      );
    }
  });

  it('a patch against a row that is not there is null, and deleting hides the row everywhere', async () => {
    const r = repo(makeFreshDb());
    assert.equal(await r.update(newEntityId<ClientId>(), { nombre: 'X' }), null);

    const c = await r.create({ nombre: 'María', businessId: BIZ });
    await r.delete(c.id);
    assert.equal(await r.findById(c.id), null);
    assert.deepEqual(await r.findByName('María', BIZ), []);
    assert.equal(await r.count(BIZ), 0);
  });
});
