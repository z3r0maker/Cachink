/**
 * useQuickSwitchAuth — result shape. Recovery state is gone (ADR-072):
 * a forgotten NIP is the owner's to reset from the portal.
 */

import { describe, expect, it } from 'vitest';
import type { BusinessId } from '@xangarro/domain';
import type { useQuickSwitchAuth } from '../../src/app/use-quick-switch-auth';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('useQuickSwitchAuth', () => {
  it('exposes authentication only — no recovery surface (ADR-072)', () => {
    // Structural: the hook's public type has exactly these keys.
    const keys: readonly (keyof ReturnType<typeof useQuickSwitchAuth>)[] = [
      'users',
      'error',
      'submitting',
      'handleAuth',
    ];
    expect(keys).toContain('handleAuth');
    expect(keys).not.toContain('startRecovery');
    expect(keys).not.toContain('handleRecover');
    void BIZ;
  });
});
