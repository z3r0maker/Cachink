/**
 * Shared contract test for any `SalesRepository` implementation.
 *
 * Called by:
 *   - `packages/testing/tests/in-memory-sales-repository.test.ts` against
 *     the in-memory impl.
 *   - `packages/data/tests/drizzle/sales-repository.test.ts` against the
 *     real Drizzle impl.
 *
 * Every assertion is implementation-agnostic; if the two impls diverge on
 * any observable behaviour, one of these tests will catch it.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, ClientId, IsoDate } from '@cachink/domain';
import type { SalesRepository } from '@cachink/data';
import { makeNewSale } from '../fixtures/sale.js';
import { TEST_DEVICE_ID } from './_shared.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;
const CLIENT_X = '01HZ8XQN9GZJXV8AKQ5X0C7C01' as ClientId;
const CLIENT_Y = '01HZ8XQN9GZJXV8AKQ5X0C7C02' as ClientId;
const TODAY = '2026-04-23' as IsoDate;
const YESTERDAY = '2026-04-22' as IsoDate;

export function describeSalesRepositoryContract(
  implName: string,
  makeRepo: () => SalesRepository,
): void {
  describe(`SalesRepository contract — ${implName}`, () => {
    let repo: SalesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('stamps id, audit columns, and default estadoPago on cash sales', async () => {
      const sale = await repo.create(makeNewSale({ businessId: BIZ_A }));
      expect(sale.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(sale.deviceId).toBe(TEST_DEVICE_ID);
      expect(sale.createdAt).toBe(sale.updatedAt);
      expect(sale.deletedAt).toBeNull();
      expect(sale.estadoPago).toBe('pagado');
      expect(sale.clienteId).toBeNull();
    });

    it('marks Crédito sales as pendiente and preserves clienteId', async () => {
      const sale = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_X }),
      );
      expect(sale.estadoPago).toBe('pendiente');
      expect(sale.clienteId).toBe(CLIENT_X);
    });

    it('findById returns the row when it exists, null when soft-deleted or missing', async () => {
      const sale = await repo.create(makeNewSale({ businessId: BIZ_A }));
      expect(await repo.findById(sale.id)).toEqual(sale);
      await repo.delete(sale.id);
      expect(await repo.findById(sale.id)).toBeNull();
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('findByDate scopes by businessId + date and excludes soft-deleted rows', async () => {
      const keep = await repo.create(makeNewSale({ businessId: BIZ_A, fecha: TODAY }));
      const otherDate = await repo.create(makeNewSale({ businessId: BIZ_A, fecha: YESTERDAY }));
      const otherBiz = await repo.create(makeNewSale({ businessId: BIZ_B, fecha: TODAY }));
      const dropped = await repo.create(makeNewSale({ businessId: BIZ_A, fecha: TODAY }));
      await repo.delete(dropped.id);

      const rows = await repo.findByDate(TODAY, BIZ_A);
      expect(rows.map((r) => r.id)).toContain(keep.id);
      expect(rows.map((r) => r.id)).not.toContain(otherDate.id);
      expect(rows.map((r) => r.id)).not.toContain(otherBiz.id);
      expect(rows.map((r) => r.id)).not.toContain(dropped.id);
    });

    it('findByDate orders results by createdAt descending', async () => {
      const older = await repo.create(makeNewSale({ businessId: BIZ_A, concepto: 'first' }));
      // await a short delay so the second row gets a later createdAt timestamp
      await new Promise((r) => setTimeout(r, 5));
      const newer = await repo.create(makeNewSale({ businessId: BIZ_A, concepto: 'second' }));
      const rows = await repo.findByDate(TODAY, BIZ_A);
      const ids = rows.map((r) => r.id);
      expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
    });

    it('findPendingByClient returns only pendiente/parcial credit sales', async () => {
      const pendiente = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_X }),
      );
      const parcial = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_X }),
      );
      await repo.updatePaymentState(parcial.id, 'parcial');
      const pagado = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_X }),
      );
      await repo.updatePaymentState(pagado.id, 'pagado');
      const otroCliente = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_Y }),
      );

      const rows = await repo.findPendingByClient(CLIENT_X);
      const ids = rows.map((r) => r.id);
      expect(ids).toEqual(expect.arrayContaining([pendiente.id, parcial.id]));
      expect(ids).not.toContain(pagado.id);
      expect(ids).not.toContain(otroCliente.id);
    });

    it('updatePaymentState mutates estadoPago and bumps updatedAt', async () => {
      const sale = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_X }),
      );
      const originalUpdatedAt = sale.updatedAt;
      await new Promise((r) => setTimeout(r, 5));
      await repo.updatePaymentState(sale.id, 'parcial');
      const after = await repo.findById(sale.id);
      expect(after?.estadoPago).toBe('parcial');
      expect(after && after.updatedAt.localeCompare(originalUpdatedAt)).toBeGreaterThanOrEqual(0);
    });

    it('updatePaymentState on a missing id is a no-op', async () => {
      await expect(
        repo.updatePaymentState('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, 'pagado'),
      ).resolves.toBeUndefined();
    });

    it('delete on a missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });

    it('preserves monto as bigint end-to-end', async () => {
      const sale = await repo.create(makeNewSale({ businessId: BIZ_A, monto: 1_234_567n }));
      const loaded = await repo.findById(sale.id);
      expect(loaded?.monto).toBe(1_234_567n);
      expect(typeof loaded?.monto).toBe('bigint');
    });

    it('findByDateRange returns an empty array when the range has no sales', async () => {
      await repo.create(makeNewSale({ businessId: BIZ_A, fecha: '2025-01-01' as IsoDate }));
      const rows = await repo.findByDateRange('2026-05-01', '2026-05-31', BIZ_A);
      expect(rows).toEqual([]);
    });

    it('findByDateRange includes rows on both boundary dates', async () => {
      const start = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-20' as IsoDate }),
      );
      const mid = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-22' as IsoDate }),
      );
      const end = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-24' as IsoDate }),
      );
      const outsideBefore = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-19' as IsoDate }),
      );
      const outsideAfter = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-25' as IsoDate }),
      );
      const otherBiz = await repo.create(
        makeNewSale({ businessId: BIZ_B, fecha: '2026-04-22' as IsoDate }),
      );

      const rows = await repo.findByDateRange('2026-04-20', '2026-04-24', BIZ_A);
      const ids = rows.map((r) => r.id);
      expect(ids).toEqual(expect.arrayContaining([start.id, mid.id, end.id]));
      expect(ids).not.toContain(outsideBefore.id);
      expect(ids).not.toContain(outsideAfter.id);
      expect(ids).not.toContain(otherBiz.id);
    });

    it('findByDateRange returns rows sorted by fecha desc', async () => {
      const oldest = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-20' as IsoDate }),
      );
      const newest = await repo.create(
        makeNewSale({ businessId: BIZ_A, fecha: '2026-04-24' as IsoDate }),
      );
      const rows = await repo.findByDateRange('2026-04-20', '2026-04-24', BIZ_A);
      expect(rows[0]!.id).toBe(newest.id);
      expect(rows[rows.length - 1]!.id).toBe(oldest.id);
    });

    // Audit Round 2 J1: partial-update contract per ADR-023.
    it('update applies the patch fields and bumps updatedAt', async () => {
      const sale = await repo.create(makeNewSale({ businessId: BIZ_A, monto: 1000n }));
      const originalUpdatedAt = sale.updatedAt;
      await new Promise((r) => setTimeout(r, 5));
      const updated = await repo.update(sale.id, {
        monto: 2500n,
        concepto: 'Concepto editado',
      });
      expect(updated?.monto).toBe(2500n);
      expect(updated?.concepto).toBe('Concepto editado');
      expect(updated && updated.updatedAt.localeCompare(originalUpdatedAt)).toBeGreaterThan(0);
      // Untouched fields stay untouched.
      expect(updated?.fecha).toBe(sale.fecha);
      expect(updated?.metodo).toBe(sale.metodo);
    });

    it('update returns null for a missing or soft-deleted sale', async () => {
      const result = await repo.update('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never, { monto: 1n });
      expect(result).toBeNull();
      const sale = await repo.create(makeNewSale({ businessId: BIZ_A }));
      await repo.delete(sale.id);
      expect(await repo.update(sale.id, { monto: 999n })).toBeNull();
    });

    it('update preserves clienteId when the patch omits it', async () => {
      const sale = await repo.create(
        makeNewSale({ businessId: BIZ_A, metodo: 'Crédito', clienteId: CLIENT_X }),
      );
      const updated = await repo.update(sale.id, { concepto: 'Sólo concepto' });
      expect(updated?.clienteId).toBe(CLIENT_X);
    });
  });
}
