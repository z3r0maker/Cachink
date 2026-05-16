/**
 * Shared contract for {@link DirectorAlertsRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId } from '@cachink/domain';
import type { DirectorAlertsRepository, CreateDirectorAlertInput } from '@cachink/data';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function input(overrides: Partial<CreateDirectorAlertInput> = {}): CreateDirectorAlertInput {
  return {
    source: 'stock-bajo',
    severity: 'warning',
    titleKey: 'alerts.stockLow',
    message: '3 productos con stock bajo',
    actionRoute: '/productos',
    businessId: BIZ,
    ...overrides,
  };
}

export function describeDirectorAlertsRepositoryContract(
  implName: string,
  makeRepo: () => DirectorAlertsRepository,
): void {
  describe(`DirectorAlertsRepository contract — ${implName}`, () => {
    let repo: DirectorAlertsRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('create stamps id + defaults read to false', async () => {
      const row = await repo.create(input());
      expect(row.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
      expect(row.read).toBe(false);
      expect(row.source).toBe('stock-bajo');
    });

    it('findById returns the row, null for missing', async () => {
      const row = await repo.create(input());
      expect(await repo.findById(row.id)).toEqual(row);
      expect(await repo.findById('01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as never)).toBeNull();
    });

    it('findUnread returns only unread alerts', async () => {
      const a1 = await repo.create(input({ message: 'Alert 1' }));
      await repo.create(input({ message: 'Alert 2' }));
      await repo.markRead(a1.id);
      const unread = await repo.findUnread(BIZ);
      expect(unread).toHaveLength(1);
      expect(unread[0]!.message).toBe('Alert 2');
    });

    it('findAll returns all alerts including read', async () => {
      const a1 = await repo.create(input());
      await repo.create(input());
      await repo.markRead(a1.id);
      const all = await repo.findAll(BIZ);
      expect(all).toHaveLength(2);
    });

    it('markRead sets read flag to true', async () => {
      const row = await repo.create(input());
      await repo.markRead(row.id);
      const updated = await repo.findById(row.id);
      expect(updated?.read).toBe(true);
    });

    it('markAllRead marks all alerts as read', async () => {
      await repo.create(input());
      await repo.create(input());
      await repo.markAllRead(BIZ);
      const unread = await repo.findUnread(BIZ);
      expect(unread).toHaveLength(0);
    });

    it('preserves actionRoute and metadata', async () => {
      const row = await repo.create(input({
        actionRoute: '/custom-route',
        metadata: '{"key":"value"}',
      }));
      const found = await repo.findById(row.id);
      expect(found?.actionRoute).toBe('/custom-route');
    });
  });
}
