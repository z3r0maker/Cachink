import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { syncPillState } from '../src/shell/sync-state';

/**
 * "The sync pill must tell the truth." One happy path and three unhappy ones,
 * per CLAUDE.md §2.4.
 */
describe('syncPillState', () => {
  it('says Sincronizado only when the queue is empty', () => {
    assert.deepEqual(syncPillState(0), { tone: 'success', label: 'Sincronizado' });
  });

  it('reports the real count, never a hardcoded label', () => {
    assert.deepEqual(syncPillState(3), { tone: 'warning', label: '3 registros no enviados' });
  });

  it('uses the singular for exactly one row', () => {
    assert.deepEqual(syncPillState(1), { tone: 'warning', label: '1 registro no enviado' });
  });

  it('never claims a queue from a negative or non-finite count', () => {
    assert.equal(syncPillState(-1).label, 'Sincronizado');
    assert.equal(syncPillState(Number.NaN).label, 'Sincronizado');
  });
});
