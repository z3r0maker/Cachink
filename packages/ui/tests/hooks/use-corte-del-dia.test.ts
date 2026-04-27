/**
 * useCorteDelDia underlying-repo tests (Slice 3 C5). The hook is a
 * direct pass-through to `DayClosesRepository.findByDate`; we assert
 * the repo behaviour that the hook surfaces.
 */

import { describe, expect, it } from 'vitest';
import { InMemoryDayClosesRepository, makeNewDayClose } from '@cachink/testing';
import type { BusinessId, DeviceId, IsoDate } from '@cachink/domain';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const TODAY = '2026-04-24' as IsoDate;

describe('DayClosesRepository.findByDate (surfaced by useCorteDelDia)', () => {
  it('returns null when no corte exists for today on this device', async () => {
    const closes = new InMemoryDayClosesRepository(DEV);
    await expect(closes.findByDate(TODAY, DEV)).resolves.toBeNull();
  });

  it('returns the corte when one exists for today on this device', async () => {
    const closes = new InMemoryDayClosesRepository(DEV);
    const saved = await closes.create(
      makeNewDayClose({ fecha: TODAY, businessId: BIZ, efectivoContadoCentavos: 100n }),
    );
    const found = await closes.findByDate(TODAY, DEV);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
  });

  it('returns null for a different device id on the same date', async () => {
    const closes = new InMemoryDayClosesRepository(DEV);
    await closes.create(makeNewDayClose({ fecha: TODAY, businessId: BIZ }));
    const otherDevice = '01HZ8XQN9GZJXV8AKQ5X0OTHER' as DeviceId;
    await expect(closes.findByDate(TODAY, otherDevice)).resolves.toBeNull();
  });
});
