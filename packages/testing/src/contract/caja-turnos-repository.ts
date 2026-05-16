/**
 * Shared contract for {@link CajaTurnosRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoTimestamp, UserId } from '@cachink/domain';
import type { CajaTurnosRepository, CreateCajaTurnoInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER = '01HZ8XQN9GZJXV8AKQ5X0C7SR1' as UserId;
const USER_B = '01HZ8XQN9GZJXV8AKQ5X0C7SR2' as UserId;

function input(overrides: Partial<CreateCajaTurnoInput> = {}): CreateCajaTurnoInput {
  return {
    userId: USER,
    fecha: '2026-05-09',
    aperturaAt: '2026-05-09T08:00:00.000Z',
    montoAperturaCentavos: 5000n,
    efectivoAdicionalCentavos: 0n,
    businessId: BIZ,
    ...overrides,
  };
}

export function describeCajaTurnosRepositoryContract(
  implName: string,
  makeRepo: () => CajaTurnosRepository,
): void {
  describe(`CajaTurnosRepository contract — ${implName}`, () => {
    let repo: CajaTurnosRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + audit and cierreAt starts null', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.cierreAt).toBeNull();
      expect(row.montoAperturaCentavos).toBe(5000n);
    });

    it('findById returns the row, null for missing', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('findOpenByUser returns open turn, null after closing', async () => {
      const row = await repo.create(input());
      expect(await repo.findOpenByUser(USER)).toEqual(row);
      await repo.update(row.id, { cierreAt: '2026-05-09T18:00:00.000Z' as IsoTimestamp });
      expect(await repo.findOpenByUser(USER)).toBeNull();
    });

    it('findLatest returns a non-null result when turns exist', async () => {
      await repo.create(input({ fecha: '2026-05-08' }));
      await repo.create(input({ fecha: '2026-05-09', userId: USER_B }));
      const latest = await repo.findLatest(BIZ);
      expect(latest).not.toBeNull();
      expect(latest!.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    it('findByDateRange returns turns within the range', async () => {
      await repo.create(input({ fecha: '2026-05-07' }));
      await repo.create(input({ fecha: '2026-05-09', userId: USER_B }));
      const rows = await repo.findByDateRange('2026-05-08', '2026-05-10', BIZ);
      expect(rows).toHaveLength(1);
    });

    it('update patches cierreAt and totals', async () => {
      const row = await repo.create(input());
      const updated = await repo.update(row.id, {
        cierreAt: '2026-05-09T18:00:00.000Z' as IsoTimestamp,
        montoCierreCentavos: 8000n,
        diferenciaCentavos: 0n,
      });
      expect(updated.cierreAt).toBe('2026-05-09T18:00:00.000Z');
      expect(updated.montoCierreCentavos).toBe(8000n);
    });
  });
}
