/**
 * Shared contract for {@link AppConfigRepository} implementations.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { AppConfigRepository } from '@cachink/data';

export function describeAppConfigRepositoryContract(
  implName: string,
  makeRepo: () => AppConfigRepository,
): void {
  describe(`AppConfigRepository contract — ${implName}`, () => {
    let repo: AppConfigRepository;

    beforeEach(() => {
      repo = makeRepo();
    });

    it('get returns null for missing keys', async () => {
      expect(await repo.get('missing')).toBeNull();
    });

    it('set then get round-trips the value', async () => {
      await repo.set('mode', '"local-standalone"');
      expect(await repo.get('mode')).toBe('"local-standalone"');
    });

    it('set overwrites prior values for the same key', async () => {
      await repo.set('mode', '"local-standalone"');
      await repo.set('mode', '"cloud"');
      expect(await repo.get('mode')).toBe('"cloud"');
    });

    it('delete removes the key', async () => {
      await repo.set('k', 'v');
      await repo.delete('k');
      expect(await repo.get('k')).toBeNull();
    });

    it('delete on a missing key is a no-op', async () => {
      await expect(repo.delete('missing')).resolves.toBeUndefined();
    });

    it('list returns every (key, value) pair', async () => {
      await repo.set('mode', '"cloud"');
      await repo.set('currentBusinessId', '"01HZ8XQN9GZJXV8AKQ5X0C7BIZ"');
      const rows = await repo.list();
      expect(rows).toHaveLength(2);
      const asObject = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      expect(asObject).toEqual({
        mode: '"cloud"',
        currentBusinessId: '"01HZ8XQN9GZJXV8AKQ5X0C7BIZ"',
      });
    });

    it('preserves empty-string values (distinct from null)', async () => {
      await repo.set('emptyString', '');
      expect(await repo.get('emptyString')).toBe('');
    });
  });
}
