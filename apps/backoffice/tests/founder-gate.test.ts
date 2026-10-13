import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { Founder } from '@xangarro/data-corp';

import { founderForNav, founderOrNull } from '../src/server/founder-gate';

/**
 * The founder permission (E-01, ADR-124 §1): a staff member reaches «Empresa»
 * only when corp names them. The console must keep working when the corp
 * connection is not configured or fails: the area disappears, the rest stays.
 */
const UNO: Founder = {
  id: 'f1',
  staffMemberId: 'staff-1',
  numero: 1,
  nombre: 'Fundador Uno',
  rfc: null,
};

describe('founderOrNull', () => {
  it('returns the founder the lookup finds', async () => {
    assert.deepEqual(await founderOrNull('staff-1', async () => UNO), UNO);
  });

  it('returns null for a staff member who is not a founder', async () => {
    assert.equal(await founderOrNull('staff-2', async () => null), null);
  });

  it('returns null when corp is not configured at all', async () => {
    assert.equal(await founderOrNull('staff-1', null), null);
  });

  it('lets a failing lookup throw, so a page shows its error state', async () => {
    await assert.rejects(
      founderOrNull('staff-1', async () => {
        throw new Error('corp down');
      }),
      /corp down/,
    );
  });
});

describe('founderForNav', () => {
  it('hides the area, and reports why, when the lookup fails', async () => {
    const seen: unknown[] = [];
    const found = await founderForNav(
      'staff-1',
      async () => {
        throw new Error('corp down');
      },
      (e) => seen.push(e),
    );
    assert.equal(found, null);
    assert.equal(seen.length, 1);
  });

  it('shows the area for a founder', async () => {
    assert.deepEqual(
      await founderForNav(
        'staff-1',
        async () => UNO,
        () => {},
      ),
      UNO,
    );
  });
});
