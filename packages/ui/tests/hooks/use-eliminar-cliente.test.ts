/**
 * useEliminarCliente error-type tests (Slice 2 C31).
 */

import { describe, expect, it } from 'vitest';
import { ClientPendingSalesError } from '../../src/hooks/use-eliminar-cliente';

describe('ClientPendingSalesError', () => {
  it('carries the pendingCount on the error instance', () => {
    const err = new ClientPendingSalesError(3);
    expect(err.name).toBe('ClientPendingSalesError');
    expect(err.pendingCount).toBe(3);
    expect(err.message).toContain('3');
  });

  it('is distinguishable from a regular Error', () => {
    const err: Error = new ClientPendingSalesError(1);
    expect(err instanceof ClientPendingSalesError).toBe(true);
  });
});
