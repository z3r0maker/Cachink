/**
 * Shared contract for {@link DayClosesRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';
import type { DayClosesRepository } from '@cachink/data';
import { makeNewDayClose } from '../fixtures/day-close.js';
import { TEST_DEVICE_ID } from './_shared.js';

const BIZ_A = '01HZ8XQN9GZJXV8AKQ5X0C7A01' as BusinessId;
const BIZ_B = '01HZ8XQN9GZJXV8AKQ5X0C7A02' as BusinessId;
const DEV_OTHER = '01HZ8XQN9GZJXV8AKQ5X0C7DEZ' as DeviceId;
const APR_22 = '2026-04-22' as IsoDate;
const APR_23 = '2026-04-23' as IsoDate;

export function describeDayClosesRepositoryContract(
  implName: string,
  makeRepo: () => DayClosesRepository,
): void {
  describe(`DayClosesRepository contract — ${implName}`, () => {
    let repo: DayClosesRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('computes diferencia on create (contado − esperado) and stamps audit', async () => {
      const row = await repo.create(
        makeNewDayClose({
          businessId: BIZ_A,
          efectivoEsperadoCentavos: 250_000n,
          efectivoContadoCentavos: 248_000n,
        }),
      );
      expect(row.diferenciaCentavos).toBe(-2_000n);
      expect(row.deviceId).toBe(TEST_DEVICE_ID);
    });

    it('handles positive and zero diferencias', async () => {
      const positive = await repo.create(
        makeNewDayClose({
          businessId: BIZ_A,
          efectivoEsperadoCentavos: 100_000n,
          efectivoContadoCentavos: 101_000n,
        }),
      );
      const zero = await repo.create(
        makeNewDayClose({
          businessId: BIZ_A,
          efectivoEsperadoCentavos: 100_000n,
          efectivoContadoCentavos: 100_000n,
          fecha: APR_22,
        }),
      );
      expect(positive.diferenciaCentavos).toBe(1_000n);
      expect(zero.diferenciaCentavos).toBe(0n);
    });

    it('findByDate scopes by deviceId — different devices are independent', async () => {
      const a = await repo.create(makeNewDayClose({ businessId: BIZ_A, fecha: APR_23 }));
      const found = await repo.findByDate(APR_23, TEST_DEVICE_ID);
      expect(found?.id).toBe(a.id);
      expect(await repo.findByDate(APR_23, DEV_OTHER)).toBeNull();
    });

    it('findLatest returns the most recent non-deleted corte for the business', async () => {
      await repo.create(makeNewDayClose({ businessId: BIZ_A, fecha: APR_22 }));
      const newer = await repo.create(makeNewDayClose({ businessId: BIZ_A, fecha: APR_23 }));
      await repo.create(makeNewDayClose({ businessId: BIZ_B, fecha: APR_23 }));
      expect((await repo.findLatest(BIZ_A))?.id).toBe(newer.id);
    });

    it('findLatest returns null when no cortes exist for the business', async () => {
      expect(await repo.findLatest(BIZ_A)).toBeNull();
    });

    it('delete soft-deletes; findById + findByDate then return null', async () => {
      const row = await repo.create(makeNewDayClose({ businessId: BIZ_A, fecha: APR_23 }));
      await repo.delete(row.id);
      expect(await repo.findById(row.id)).toBeNull();
      expect(await repo.findByDate(APR_23, TEST_DEVICE_ID)).toBeNull();
    });

    it('delete on missing id is a no-op', async () => {
      await expect(repo.delete('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).resolves.toBeUndefined();
    });
  });
}
